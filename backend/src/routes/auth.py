from flask import Blueprint, request, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash
from models.user import User  
from services.chat import ChatService  
from models.login_log import LoginLog
from models.group_member import GroupMember
from sqlalchemy import or_
from extensions import db, redis_client
from flask_sqlalchemy import SQLAlchemy
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from captcha.image import ImageCaptcha
import random, string, base64, io
from flask_mail import Mail, Message

limiter = Limiter(key_func=get_remote_address)
image = ImageCaptcha()
mail = Mail()

auth_bp = Blueprint('auth', __name__)

def generate_code(length=4):
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

@auth_bp.route('/captcha', methods=['GET'])
def get_captcha():
    code = generate_code()
    session['captcha'] = code
    data = image.generate(code)
    byte_data = io.BytesIO()
    data.save(byte_data, 'PNG')
    # 转为base64
    base64_data = base64.b64encode(byte_data.getvalue()).decode()
    return jsonify({'captcha': f'data:image/png;base64,{base64_data}'})

@auth_bp.route('/send-email-code', methods=['POST'])
@limiter.limit("1 per minute")
def send_email_code():
    data = request.get_json()
    email = data.get('email')
    if not email:
        return jsonify({'message': '邮箱不能为空'}), 400
    
    code = generate_code(6)
    redis_client.setex(f'email_code:{email}', 300, code)
    
    try:
        msg = Message(
            '注册验证码',
            sender='yihang_01_doge@qq.com',
            recipients=[email]
        )
        msg.body = f'您的验证码是：{code}，5分钟内有效'
        mail.send(msg)
        return jsonify({'message': '验证码已发送'}), 200
    except Exception as e:
        print(e)
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
    captcha = data.get('captcha')

    if session.get('captcha') != captcha.upper():
        return jsonify({'message': '验证码错误'}), 401

    token = ChatService.generate_token(0)

    try:
        if email == '' and password == '':
            print(f'访客发送的token: {token}')
            return jsonify({
                'message': '登录成功',
                # 'username': user.username,
                # 'email': user.email,
                'userId': 0,
                'token': token
            }), 200
    except Exception as e:
        print(e)
        return jsonify({'message': '服务器错误,访客登陆失败'}), 500
    
    # print(f'访客发送的token: {token}')

    user = User.query.filter_by(email=email).first()

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

