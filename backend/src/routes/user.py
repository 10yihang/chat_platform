from flask import Blueprint, request, jsonify
from extensions import db
from models.user import User
from models.group_member import GroupMember
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.friendship import Friendship
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

@user_bp.route('/friends', methods=['GET'])
@jwt_required()
def get_user_friends():
    user_id = get_jwt_identity()
    friendships = Friendship.query.filter(
        (
            (Friendship.user_id == user_id) | 
            (Friendship.friend_id == user_id)
        ),
        Friendship.status == 'accepted'
    ).all()
    
    friends = []
    for f in friendships:
        friend = f.friend if str(f.user_id) == user_id else f.user
        friends.append({
            'id': friend.id,
            'name': friend.username,
            'avatar': friend.avatar,
            'type': 'friend'
        })
    return jsonify(friends), 200

@user_bp.route('/groups', methods=['GET'])
@jwt_required()
def get_user_groups():
    user_id = get_jwt_identity()
    groups = GroupMember.query.filter_by(user_id=user_id).all()
    return jsonify([{
        'id': g.group.id,
        'name': g.group.name,
        'avatar': g.group.avatar,
        'type': 'group'
    } for g in groups]), 200

@user_bp.route('/status', methods=['GET'])
@jwt_required()
def get_user_status():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    return jsonify({'status': user.status}), 200