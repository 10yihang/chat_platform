from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from models.user import User  
from services.chat import ChatService  
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
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()

    if not user or not check_password_hash(user.password, password):
        return jsonify({'message': '用户名或密码错误'}), 401

    # 假设有一个方法可以生成JWT令牌
    token = ChatService.generate_token(user.id)

    return jsonify({'token': token}), 200