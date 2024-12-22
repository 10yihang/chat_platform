from flask import Blueprint, request, jsonify
from services.chat import ChatService

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