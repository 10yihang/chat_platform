from flask import Response, stream_with_context
import json
from flask import request, Blueprint, jsonify
from flask_jwt_extended import jwt_required
import os
from openai import OpenAI
from volcenginesdkarkruntime import Ark
from dotenv import load_dotenv

load_dotenv()

ai_bp = Blueprint('ai', __name__)

Doubao_Client = Ark(
    base_url="https://ark.cn-beijing.volces.com/api/v3",
)

AI_PROMPT = '''
你的任务根据聊天记录模仿要回复的人的语气进行一个模拟的回复。

请注意，你的回复应该是一个合理的、有逻辑的回答，而不是随机的或无意义的回答。

你当前需要建议回复的人是：{}

以下是聊天记录：

{}

在模仿语气进行模拟回复时：

1. 仔细观察聊天记录中对方的用词、句式和风格。

2. 尽量使用相似的语言风格和表达方式。

3. 只需要对当前需要回复的人做出模拟回复即可

请给出模拟回复。

'''

@ai_bp.route('/suggest/stream', methods=['POST'])
@jwt_required()
def suggest_stream():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No JSON data provided"}), 400

    messages = data.get('messages', [])
    current_user_id = data.get('current_user_id')

    if not current_user_id:
        return jsonify({"error": "current_user_id is required"}), 400
    if not messages:
        return jsonify({"error": "messages is required"}), 400

    def get_ai_response(messages, current_user_id):
        conversation = []
        for message in messages:
            sender = message.get('sender_id')
            content = message.get('content')
            if sender and content:
                conversation.append(f'{sender}: {content}')
            else:
                print(f"Invalid message format: {message}") 
                continue

        prompt = AI_PROMPT.format(current_user_id, '\n'.join(conversation))
        try:
            # 直接返回stream，不要提前遍历
            return Doubao_Client.chat.completions.create(
                model="ep-20241225132124-f9dn8",
                messages=[{"role": "system", "content": prompt}],
                stream=True
            )
        except Exception as e:
            print(f"Error calling Doubao API: {e}")
            return None

    def generate():
        stream = get_ai_response(messages, current_user_id)
        if stream is None:
            yield f"data: {json.dumps({'error': 'Failed to get AI response'})}\n\n"
            return
        
        try:
            for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    # print(f"Sending content: {content}")
                    yield f"data: {json.dumps({'content': content})}\n\n"
        except Exception as e:
            print(f"Error processing stream: {e}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return Response(
        stream_with_context(generate()),
        mimetype='text/event-stream'
    )