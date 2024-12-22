from flask_socketio import SocketIO, emit, join_room, leave_room
from extensions import db
from flask import request, current_app
from models.group_member import GroupMember
from models.friendship import Friendship
from models.message import Message
from flask_jwt_extended import decode_token, verify_jwt_in_request, get_jwt_identity
from utils.token_util import decode_jwt_token
import jwt
from config import Config

socketio = SocketIO()
user_rooms = {}

@socketio.on('connect')
def handle_connect(auth):
    try:
        token = auth.get('token')
        if not token:
            raise Exception('未提供Token')

        with current_app.app_context():
            decoded_token = jwt.decode(
                token,
                Config.JWT_SECRET_KEY,
                algorithms=["HS256"]
            )
            print(f"解码后的token: {decoded_token}")
            user_id = decoded_token.get('user_id')
            
            if not user_id:
                raise Exception('Token中未包含用户ID')
            
            friends = Friendship.query.filter_by(user_id=user_id).all()

            for friend in friends:
                room_id = f'friend_{friend.friend_id}'
                join_room(room_id)

            user_groups = GroupMember.query.filter_by(user_id=user_id).all()
            
            for group in user_groups:
                room_id = f'group_{group.group_id}'
                join_room(room_id)
            
            emit('status', {'msg': '连接成功'})
            return True
            
    except jwt.ExpiredSignatureError:
        print("Token已过期")
        emit('error', {'msg': 'Token已过期'})
        return False
    except jwt.InvalidTokenError as e:
        print(f"无效的Token: {str(e)}")
        emit('error', {'msg': '无效的Token'})
        return False
    except Exception as e:
        print(f"连接错误: {str(e)}")
        emit('error', {'msg': str(e)})
        return False

@socketio.on('disconnect')
def handle_disconnect():
    if request.args.get('token'):
        user_id = decode_token(request.args.get('token'))['sub']
        if user_id in user_rooms:
            for room_type in user_rooms[user_id].values():
                for room in room_type:
                    leave_room(room)
            del user_rooms[user_id]

# @socketio.on('chat')
# def handle_message(data):
#     try:
#         print("Received chat message:", data) 
        
#         room = data.get('room')
#         message = data.get('message')
        
#         if not message or not room:
#             raise ValueError("消息或房间ID不能为空")
            
#         # 创建新消息
#         new_message = Message(
#             sender_id=message['sender_id'],
#             receiver_id=message.get('receiver_id', 0),
#             group_id=message.get('group_id', 0),
#             content=message['content'],
#             type=message['type']
#         )
        
#         print("Saving message to database...")  # 添加调试日志
#         db.session.add(new_message)
#         db.session.commit()
        
#         response_message = {
#             **message,
#             'id': new_message.id,
#             'created_at': new_message.created_at.isoformat()
#         }
#         print("Emitting message:", response_message)  # 添加调试日志
        
#         # 发送消息到指定房间
#         emit('message', response_message, room=room, broadcast=True)
#         return True
        
#     except Exception as e:
#         print(f"Error in handle_message: {str(e)}")
#         emit('error', {'msg': str(e)})
#         return False