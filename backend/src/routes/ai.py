from flask import Response, stream_with_context
import json
from flask import request, Blueprint
from flask_jwt_extended import jwt_required

ai_bp = Blueprint('ai', __name__)

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

请在<模拟回复>标签内给出模拟回复。

'''

@ai_bp.route('/suggest/stream', methods=['POST'])
@jwt_required()
def suggest_stream():
    data = request.json
    messages = data.get('messages', [])
    current_user_id = data.get('current_user_id')

    def get_ai_response(messages, current_user_id):
        conversation = [f'{current_user_id}: {message["content"]}' for message in messages]
        prompt = AI_PROMPT.format(current_user_id, '\n'.join(conversation))
        
        return ['AI response 1', 'AI response 2', 'AI response 3']

    def generate():
        response = get_ai_response(messages, current_user_id)  
        for token in response:
            yield f"data: {json.dumps({'content': token})}\n\n"

    return Response(
        stream_with_context(generate()),
        content_type='text/event-stream'
    )
