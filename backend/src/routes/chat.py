from flask import Blueprint, request, jsonify
from services.chat import ChatService

chat_bp = Blueprint('chat', __name__)
chat_service = ChatService()

@chat_bp.route('/send', methods=['POST'])
def send_message():
    data = request.json
    message = chat_service.send_message(data['sender'], data['content'])
    return jsonify(message), 201

@chat_bp.route('/receive/<user_id>', methods=['GET'])
def receive_messages(user_id):
    messages = chat_service.receive_messages(user_id)
    return jsonify(messages), 200