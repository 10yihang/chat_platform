from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from models.user import User  # 修改为绝对导入
from services.chat import ChatService  # 修改为绝对导入

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'message': '用户名和密码不能为空'}), 400

    hashed_password = generate_password_hash(password, method='sha256')
    new_user = User(username=username, password=hashed_password)

    # 假设有一个方法可以保存用户到数据库
    new_user.save()

    return jsonify({'message': '用户注册成功'}), 201

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