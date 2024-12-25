from flask import Response, stream_with_context
import json
from flask import request, Blueprint
from flask_jwt_extended import jwt_required

ai_bp = Blueprint('ai', __name__)

@ai_bp.route('/suggest/stream', methods=['POST'])
@jwt_required()
def suggest_stream():
    data = request.json
    messages = data.get('messages', [])
    current_user_id = data.get('current_user_id')

    def get_ai_response(messages, current_user_id):
        pass

    def generate():
        # 这里替换为你的AI生成逻辑
        response = get_ai_response(messages, current_user_id)  
        for token in response:
            yield f"data: {json.dumps({'content': token})}\n\n"

    return Response(
        stream_with_context(generate()),
        content_type='text/event-stream'
    )
