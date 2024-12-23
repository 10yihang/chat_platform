from flask import Blueprint, request, jsonify
from models.message import Message
import jwt
from jwt import encode, decode
from models.user import User
from config import Config
from datetime import datetime, timedelta, UTC
from extensions import db
from websocket import socketio
from models.group_member import GroupMember
from flask_socketio import emit, join_room, leave_room

class ChatService:
    def __init__(self):
        self.setup_socket_handlers()
        
    def setup_socket_handlers(self):
        @socketio.on('chat')
        def handle_message(data):
            try:
                message_type = data.get('message', {}).get('type')
                if not message_type:
                    raise ValueError("消息类型不能为空")
                    
                handlers = {
                    'text': self.handle_text_message,
                    'file': self.handle_file_message,
                    'emoji': self.handle_emoji_message
                }
                
                handler = handlers.get(message_type)
                if not handler:
                    raise ValueError(f"不支持的消息类型: {message_type}")
                    
                return handler(data)
                
            except Exception as e:
                print(f"处理消息错误: {str(e)}")
                emit('error', {'msg': str(e)})
                return False
            
    def handle_text_message(self, data):
        return self.handle_message(data)
        
    def handle_file_message(self, data):
        return self.handle_message(data)
        
    def handle_emoji_message(self, data):
        return self.handle_message(data)

    def handle_message(self, data):
        try:
            message = data.get('message')
            sender = User.query.get(message['sender_id'])
            
            new_message = Message(
                sender_id=message['sender_id'],
                receiver_id=message.get('receiver_id', 0),
                group_id=message.get('group_id', 0),
                content=message['content'],
                type=message['type'],
                sender_name=sender.username
            )
            
            new_message.save()
            
            emit('message', {
                **message,
                'id': new_message.id,
                'sender_name': sender.username,
                'created_at': new_message.created_at.isoformat()
            }, room=data.get('room'))
            
            return True
        except Exception as e:
            print(f"处理消息错误: {str(e)}")
            emit('error', {'msg': str(e)})
            return False

    @staticmethod
    def send_text_message(sender_id, receiver_id = 0, group_id = 0, content = '', status = 'sent'):
        message = Message(
            sender_id=sender_id,
            receiver_id=receiver_id,
            group_id=group_id,
            content=content
        )
        return message
    
    @staticmethod
    def send_emoji_message(sender_id, receiver_id = 0, group_id = 0, content = '', status = 'sent'):
        message = Message(
            sender_id=sender_id,
            receiver_id=receiver_id,
            group_id=group_id,
            content=content,
            type='emoji'
        )
        return message
    
    @staticmethod
    def send_file_message(sender_id, receiver_id = 0, group_id = 0, content = '', file_url = '', status = 'sent'):
        message = Message(
            sender_id=sender_id,
            receiver_id=receiver_id,
            group_id=group_id,
            content=content,
            type='file',
            file_url=file_url
        )
        return message

    @staticmethod
    def get_messages(user_id, limit=50):
        return Message.query.filter_by(receiver_id=user_id).limit(limit).all()

    @staticmethod
    def get_chat_history(user1_id, user2_id, limit=50):
        return Message.query.filter(
            ((Message.sender_id == user1_id) & (Message.receiver_id == user2_id)) |
            ((Message.sender_id == user2_id) & (Message.receiver_id == user1_id))
        ).order_by(Message.created_at.desc()).limit(limit).all()
    
    @staticmethod
    def generate_token(user_id):
        payload = {
            'user_id': user_id,
            'exp': datetime.utcnow() + timedelta(hours=24),  # 过期时间
            'iat': datetime.utcnow(),  # 签发时间
            'sub': str(user_id)  # JWT标准声明
        }
        token = jwt.encode(payload, Config.JWT_SECRET_KEY, algorithm='HS256')
        try:
            decode_token = jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=["HS256"])
            print(f'解码后的token: {decode_token}')
            print(f'user_id: {decode_token.get("user_id")}')
        except:
            return '生成token失败'
        return jwt.encode(payload, Config.JWT_SECRET_KEY, algorithm='HS256')

chat_bp = Blueprint('chat', __name__)

@chat_bp.route('/send', methods=['POST'])
def send_message():
    data = request.json
    chat_service = ChatService()
    message = chat_service.send_message(
        sender_id=data['sender_id'],
        receiver_id=data['receiver_id'],
        content=data['content']
    )
    return jsonify({'status': 'success', 'message': 'Message sent'}), 200

@chat_bp.route('/receive/<user_id>', methods=['GET'])
def receive_messages(user_id):
    chat_service = ChatService()
    messages = chat_service.get_messages(user_id)
    return jsonify([message.to_dict() for message in messages]), 200

@chat_bp.route('/history/<user1_id>/<user2_id>', methods=['GET'])
def get_chat_history(user1_id, user2_id):
    chat_service = ChatService()
    messages = chat_service.get_chat_history(user1_id, user2_id)
    return jsonify([message.to_dict() for message in messages]), 200