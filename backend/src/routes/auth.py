from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from models.user import User  
from services.chat import ChatService  
from models.login_log import LoginLog
from models.group_member import GroupMember
from sqlalchemy import or_
from extensions import db
from flask_sqlalchemy import SQLAlchemy

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    if not request.is_json:
        return jsonify({'message': '请求必须是JSON格式'}), 415
    
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    email = data.get('email')

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
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(email=email).first()

    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')

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