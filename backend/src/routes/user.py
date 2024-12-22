from flask import Blueprint, request, jsonify
from extensions import db
from models.user import User
user_bp = Blueprint('user', __name__)

@user_bp.route('/update', methods=['PUT'])
def update_profile():
    return jsonify({'message': 'writing'}), 200

@user_bp.route('/delete', methods=['DELETE'])
def delete_profile():
    return jsonify({'message': 'writing'}), 200

@user_bp.route('/<user_id>', methods=['GET'])
def get_user(user_id):
    user = db.session.query(User).filter(User.id == user_id).first()
    return jsonify({'username': user.username}), 200