from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_socketio import emit, rooms
from models.friend_request import FriendRequest
from models.user import User
from models.friendship import Friendship
from extensions import db
from websocket import socketio

friend_request_bp = Blueprint('friend_request', __name__)

@friend_request_bp.route('/check/<int:user_id>', methods=['GET'])
@jwt_required()
def check_friendship(user_id):
    print(user_id)
    current_user = get_jwt_identity()
    friendship = Friendship.query.filter(
        ((Friendship.user_id == current_user) & (Friendship.friend_id == user_id)) |
        ((Friendship.user_id == user_id) & (Friendship.friend_id == current_user))
    ).first()
    
    return jsonify({'is_friend': bool(friendship)}), 200

@socketio.on('friend_request')
def handle_friend_request(data):
    try:
        sender_id = data.get('sender_id')
        receiver_id = data.get('receiver_id')
        
        print(f"处理好友请求: 从 {sender_id} 到 {receiver_id}")
        print(f"当前活动房间: {rooms()}")
        
        sender = User.query.get(sender_id)
        if not sender:
            raise Exception('用户不存在')
            
        existing_friendship = Friendship.query.filter(
            ((Friendship.user_id == sender_id) & (Friendship.friend_id == receiver_id)) |
            ((Friendship.user_id == receiver_id) & (Friendship.friend_id == sender_id))
        ).first()
        
        if existing_friendship:
            emit('error', {'msg': '已经是好友了'}, room=request.sid)
            return False
            
        # 创建好友请求
        friend_request = FriendRequest(
            sender_id=sender_id,
            receiver_id=receiver_id,
            status='pending'
        )
        
        db.session.add(friend_request)
        db.session.commit()
        
        print(f"发送好友请求通知到: user_{receiver_id}")
        
        # 发送通知包含完整的发送者信息
        room = f'user_{receiver_id}'
        print(f"准备发送到房间 {room}")
        emit('friend_request_received', {
            'request_id': friend_request.id,
            'sender': {
                'id': sender.id,
                'username': sender.username,
                'avatar': sender.avatar
            }
        }, room=room)
        print(f"通知已发送到房间 {room}")
        
        return True
        
    except Exception as e:
        print(f"处理好友请求错误: {str(e)}")
        emit('error', {'msg': str(e)}, room=request.sid)
        return False
