from flask_socketio import emit, join_room, leave_room, rooms
from extensions import db, socketio, redis_client
from flask import request, current_app
from models.group_member import GroupMember
# from models.friendship import Friendship
# from models.message import Message
# from models.user import User
from flask_jwt_extended import decode_token, verify_jwt_in_request, get_jwt_identity
from utils.token_util import decode_jwt_token
import jwt
from config import Config

class OnlineUserManager:
    @staticmethod
    def add_online_user(user_id: int, sid: str):
        redis_client.sadd('online_users', user_id)
        redis_client.set(f'user_sid:{user_id}', sid)
    
    @staticmethod
    def remove_online_user(user_id: int):
        redis_client.srem('online_users', user_id)
        redis_client.delete(f'user_sid:{user_id}')
    
    @staticmethod
    def get_online_users():
        return [int(uid) for uid in redis_client.smembers('online_users')]
    
    @staticmethod
    def get_user_sid(user_id: int):
        return redis_client.get(f'user_sid:{user_id}')

user_rooms = {}

@socketio.on('connect')
def handle_connect(auth):
    try:
        token = auth.get('token')
        if not token:
            raise Exception('未提供Token')

        decoded_token = jwt.decode(
            token,
            Config.JWT_SECRET_KEY,
            algorithms=["HS256"]
        )
        user_id = decoded_token.get('user_id')
        
        if not user_id:
            raise Exception('Token中未包含用户ID')
        
        current_rooms = rooms()
        
        # 加入私人房间（如果未加入）
        private_room = f'user_{user_id}'
        if private_room not in current_rooms:
            join_room(private_room)
            print(f"用户 {user_id} 加入私人房间: {private_room}")
        
        # 加入用户所在的群组（如果未加入）
        user_groups = GroupMember.query.filter_by(user_id=user_id).all()
        group_rooms = []
        for group in user_groups:
            room_id = f'group_{group.group_id}'
            if room_id not in current_rooms:
                join_room(room_id)
                print(f"用户 {user_id} 加入群组房间: {room_id}")
            group_rooms.append(room_id)

        print(f"{user_id} 加入的房间: {rooms()}")   
        
        # 更新用户房间记录
        user_rooms[user_id] = {
            'private': private_room,
            'groups': group_rooms
        }
        
        # 添加到在线用户管理
        OnlineUserManager.add_online_user(user_id, request.sid)
        
        online_users = OnlineUserManager.get_online_users()
        emit('online_users', {'users': online_users}, broadcast=True)
        
        return True
        
    except Exception as e:
        print(f"连接错误: {str(e)}")
        return False

@socketio.on('disconnect')
def handle_disconnect():
    try:
        token = request.args.get('token')
        if token:
            user_id = decode_token(token).get('user_id')
            
            # 离开所有房间
            if user_id in user_rooms:
                room_list = [user_rooms[user_id]['private']] + user_rooms[user_id]['groups']
                for room in room_list:
                    leave_room(room)
                del user_rooms[user_id]
            
            OnlineUserManager.remove_online_user(user_id)
            online_users = OnlineUserManager.get_online_users()
            emit('online_users', {'users': online_users}, broadcast=True)
            
    except Exception as e:
        print(f"断开连接错误: {str(e)}")