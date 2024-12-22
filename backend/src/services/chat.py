from flask import Blueprint, request, jsonify
from models.message import Message
import jwt
from jwt import encode
from models.user import User
from config import Config

class ChatService:
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
        return jwt.encode({'user_id': user_id}, Config.SECRET_KEY, algorithm='HS256')

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