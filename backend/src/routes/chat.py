from flask import Blueprint, request, jsonify
from services.chat import ChatService
from models.message import Message
from models.user import User
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db

chat_bp = Blueprint('chat', __name__)
chat_service = ChatService()

@chat_bp.route('/send', methods=['POST'])
def send_message():
    try:
        if not request.is_json:
            return jsonify({'message': '请求必须是JSON格式'}), 415
    except Exception as e:
        return jsonify({'message': '请求必须是JSON格式'}), 415
    data = request.json
    # print(data)
    sender = data.get('sender_id')
    content = data.get('content')
    receiver = data.get('receiver_id')
    type = data.get('type')
    file_url = data.get('file_url')
    group = data.get('group_id')
    status = data.get('status')
    if receiver == None:
        receiver = 0
    if group == None:
        group = 0
    if status == None:
        status = 'sent'
    try:
        if type == 'text':
            # print('text', sender, receiver, group, content, status)
            message = chat_service.send_text_message(sender, receiver, group, content, status)
        elif type == 'emoji':
            message = chat_service.send_emoji_message(sender, receiver, group, content, status)
        elif type == 'file':
            message = chat_service.send_file_message(sender, receiver, group, content, file_url, status)
        
        message.save()
        return jsonify(message.to_dict()), 200
    except Exception as e:
        print(e)
        return jsonify({'message': 'Message not sent!'}), 500

@chat_bp.route('/receive/<user_id>', methods=['GET'])
def receive_messages(user_id):
    # messages = chat_service.receive_messages(user_id)
    # messages = {'message': 'Messages received!'}
    # return jsonify(messages), 200
    return 200

@chat_bp.route('/history', methods=['POST'])
@jwt_required()
def get_history():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        group_id = data.get('groupId')
        friend_id = data.get('friendId')

        print(f'group_id: {group_id}, friend_id: {friend_id}', user_id)
        
        query = Message.query
        
        if group_id:
            query = query.filter(Message.group_id == group_id)
        elif friend_id:
            query = query.filter(
                ((Message.sender_id == user_id) & (Message.receiver_id == friend_id)) |
                ((Message.sender_id == friend_id) & (Message.receiver_id == user_id))
            )
            
        messages = query.order_by(Message.created_at.desc()).limit(50).all()
        messages.reverse()
        return jsonify([msg.to_dict() for msg in messages]), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@chat_bp.route('/messages/read/<int:chat_id>', methods=['POST'])
@jwt_required()
def mark_messages_read(chat_id):
    try:
        current_user = User.query.get(get_jwt_identity())
        Message.query.filter(
            Message.receiver_id == current_user.id,
            (Message.sender_id == chat_id) | (Message.group_id == chat_id),
            (Message.is_read == False or Message.is_read == None)
        ).update({Message.is_read: True})
        db.session.commit()
        return jsonify({'success': True}), 200
    except Exception as e:
        db.session.rollback()
        print('error', str(e))
        return jsonify({'error': str(e)}), 500

@chat_bp.route('/messages/unread/count', methods=['GET'])
@jwt_required()
def get_unread_counts():
    try:
        current_user = User.query.get(get_jwt_identity())
        unread_counts = db.session.query(
            Message.sender_id,
            db.func.count(Message.id)
        ).filter(
            Message.receiver_id == current_user.id,
            Message.is_read == False
        ).group_by(Message.sender_id).all()
        
        return jsonify({str(sender_id): count for sender_id, count in unread_counts}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500