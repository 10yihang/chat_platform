from flask import Blueprint, request, jsonify, session, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from models.user import User  
from services.chat import ChatService  
from models.login_log import LoginLog
from models.group_member import GroupMember
from sqlalchemy import or_
from extensions import db, redis_client, mail
from flask_sqlalchemy import SQLAlchemy
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from captcha.image import ImageCaptcha
import random, string, base64, io
from flask_mail import Mail, Message
import time

limiter = Limiter(key_func=get_remote_address)
image = ImageCaptcha()

auth_bp = Blueprint('auth', __name__)

def generate_code(length=4):
    # 生成验证码，默认4位
    chars = string.ascii_uppercase + string.digits 
    return ''.join(random.choices(chars, k=length))

@auth_bp.route('/captcha', methods=['GET'])
def get_captcha():
    ip = request.remote_addr
    current_time = time.time()
    
    last_request_time = redis_client.get(f'captcha_limit:{ip}')
    if last_request_time:
        time_diff = current_time - float(last_request_time)
        if time_diff < 3: 
            return jsonify({
                'message': f'请求过于频繁，请在{3-time_diff:.1f}秒后重试'
            }), 429

    redis_client.set(f'captcha_limit:{ip}', current_time, ex=10) 
    
    code = generate_code()
    session['captcha'] = code.upper()
    
    image_data = image.generate(code)
    byte_data = io.BytesIO()
    
    byte_data.write(image_data.getvalue())
    byte_data.seek(0)
    
    base64_data = base64.b64encode(byte_data.getvalue()).decode()
    
    return jsonify({'captcha': f'data:image/png;base64,{base64_data}'})

@auth_bp.route('/email-code-status', methods=['GET'])
def get_email_code_status():
    email = request.args.get('email')
    if not email:
        return jsonify({'remaining': 0})
    
    last_send_time = redis_client.get(f'email_send_time:{email}')
    if not last_send_time:
        return jsonify({'remaining': 0})
    
    time_diff = 60 - (time.time() - float(last_send_time))
    remaining = max(0, int(time_diff))
    return jsonify({'remaining': remaining})

@auth_bp.route('/send-email-code', methods=['POST'])
def send_email_code():
    data = request.get_json()
    email = data.get('email')
    if not email:
        return jsonify({'message': '邮箱不能为空'}), 400
    
    # 检查是否在冷却时间内
    last_send_time = redis_client.get(f'email_send_time:{email}')
    if last_send_time:
        time_diff = time.time() - float(last_send_time)
        if time_diff < 60:
            return jsonify({
                'message': f'请求过于频繁，请在{int(60-time_diff)}秒后重试',
                'remaining': int(60-time_diff)
            }), 429
    
    code = generate_code(6)
    try:
        msg = Message(
            subject='注册验证码',
            recipients=[email],
            body=f'欢迎注册聊天平台，您的验证码是：{code}，5分钟内有效'
        )
        mail.send(msg)
        
        # 设置验证码和发送时间
        redis_client.setex(f'email_code:{email}', 300, code)
        redis_client.setex(f'email_send_time:{email}', 60, str(time.time()))
        
        return jsonify({'message': '验证码已发送', 'remaining': 60}), 200
    except Exception as e:
        current_app.logger.error(f"发送邮件错误: {str(e)}")
        return jsonify({'message': '验证码发送失败'}), 500

@auth_bp.route('/register', methods=['POST'])
@limiter.limit("5 per minute")
def register():
    if not request.is_json:
        return jsonify({'message': '请求必须是JSON格式'}), 415
    
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    email = data.get('email')
    code = data.get('code')

    stored_code = redis_client.get(f'email_code:{email}')
    print(f'code: {code}, stored_code: {stored_code}')
    if not stored_code or stored_code.decode() != code:
        return jsonify({'message': '邮箱验证码错误或已过期'}), 401

    if not username or not password:
        return jsonify({'message': '用户名和密码不能为空'}), 400
    
    if not email:
        return jsonify({'message': '邮箱不能为空'}), 400
    
    # 检查用户名或邮箱是否已存在
    existing_user = User.query.filter(
        User.email == email
    ).first()
    
    if existing_user:
        return jsonify({'message': '邮箱已经存在'}), 400
    # 创建新用户
    try:
        hashed_password = generate_password_hash(password, method='pbkdf2:sha256')
        new_user = User(
            username=username,
            password=hashed_password,
            email=email
        )
        print(new_user)
        new_user.save()

        GroupMember(
            user_id=new_user.id,
            group_id=1,
            role='member'
        ).save()

        return jsonify({
            'message': '注册成功',
            'user': {
                'id': new_user.id,
                'username': new_user.username,
                'email': new_user.email
            }
        }), 200
    
    except Exception as e:
        db.session.rollback()
        print(e)
        return jsonify({'message': '注册失败，请稍后重试'}), 500

@auth_bp.route('/login', methods=['POST'])
@limiter.limit("5 per minute")
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    captcha = data.get('captcha', '').upper()  # 统一转换为大写比较

    print(f'输入的验证码: {captcha}, session中的验证码: {session.get("captcha")}')
    stored_captcha = session.get('captcha')
    if not stored_captcha or stored_captcha != captcha:
        return jsonify({'message': '验证码错误'}), 401

    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')

    if not email or not password:
        user_id = 0
        token = ChatService.generate_token(user_id)
        login_log = LoginLog(
            user_id=user_id,
            ip_address=ip_address,
            device_info=user_agent,
            status='success'
        )
        db.session.add(login_log)
        db.session.commit()

        print(f'访客登陆成功， user_id: {user_id}, token: {token}')
        return jsonify({'message': '访客登陆成功', 'token': token, 'user_id': user_id}), 200

    user = User.query.filter_by(email=email).first()

    try:
        if not user or not check_password_hash(user.password, password):
            login_log = LoginLog(
                user_id=user.id if user else 0,
                ip_address=ip_address,
                device_info=user_agent,
                status='failed'
            )
            db.session.add(login_log)
            db.session.commit()
            return jsonify({'message': '邮箱或密码错误'}), 401
        
        token = ChatService.generate_token(user.id)

        login_log = LoginLog(
            user_id=user.id,
            ip_address=ip_address,
            device_info=user_agent,
            status='success'
        )
        db.session.add(login_log)        
        db.session.commit()

        print(f'发送的token: {token}')

        return jsonify({
            'message': '登录成功',
            'username': user.username,
            'email': user.email,
            'userId': user.id,
            'token': token
        }), 200

    except Exception as e:
        print(e)
        db.session.rollback()
        return jsonify({'message': '服务器错误'}), 500

