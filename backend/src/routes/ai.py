from flask import Response, stream_with_context
import json
from flask import request, Blueprint, jsonify
from flask_jwt_extended import jwt_required
import os
from openai import OpenAI
from volcenginesdkarkruntime import Ark
from dotenv import load_dotenv
import textwrap
from enum import Enum
import google.generativeai as genai

class AIModel(Enum):
    DOUBAO = 1
    GEMINI = 2
    DEEPSEEK = 3
    GROK = 4

load_dotenv()
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
genai.configure(api_key=GOOGLE_API_KEY)
DEEP_API_KEY = os.getenv('DEEP_API_KEY')
GROK_API_KEY = os.getenv('GROK_API_KEY')

ai_bp = Blueprint('ai', __name__)

Doubao_Client = Ark(
    base_url="https://ark.cn-beijing.volces.com/api/v3",
)

Deep_SeeK_Client = OpenAI(
    api_key=DEEP_API_KEY,
    base_url="https://api.deepseek.com",
)

Grok_Client = OpenAI(
    api_key = GROK_API_KEY,
    base_url = "https://api.x.ai/v1"
)

AI_PROMPT = '''
你的任务根据聊天记录模仿要回复的人的语气进行一个模拟的回复。
请注意，你的回复应该是一个合理的、有逻辑的回答，而不是随机的或无意义的回答。
你当前需要建议回复的人是：用户{}
以下是聊天记录：

{}

在模仿语气进行模拟回复时：
1. 仔细观察聊天记录中对方的用词、句式和风格。
2. 尽量使用相似的语言风格和表达方式。
3. 只需要对当前需要回复的人做出模拟回复即可
4. 回答的句式不要过于重复，尽量保持多样性
请给出模拟回复。

'''

@ai_bp.route('/suggest/stream', methods=['POST'])
@jwt_required()
def suggest_stream():
    data = request.get_json()
    if not data:
        print("No JSON data provided")
        return jsonify({"error": "No JSON data provided"}), 400

    messages = data.get('messages', [])
    current_user_id = data.get('current_user_id')
    model_name = data.get('model', 'doubao') 

    conversation = []
    for message in messages:
        sender = message.get('sender_id')
        content = message.get('content')
        if sender and content:
            conversation.append(f'用户{sender}: {content}')
        else:
            print(f"Invalid message format: {message}") 
            continue
    prompt = AI_PROMPT.format(current_user_id, '\n'.join(conversation))
    
    try:
        if model_name.upper() == 'GEMINI':
            choose_model = AIModel.GEMINI
        elif model_name.upper() == 'DOUBAO':
            choose_model = AIModel.DOUBAO
        elif model_name.upper() == 'GROK':
            choose_model = AIModel.GROK
        elif model_name.upper() == 'DEEPSEEK':
            choose_model = AIModel.DEEPSEEK
        print(f'Selected model: {choose_model}, Original model name: {model_name}')
    except KeyError:
        print(f"Invalid model: {model_name}")
        return jsonify({"error": "Invalid model"}), 400

    if not current_user_id:
        return jsonify({"error": "current_user_id is required"}), 400
    if not messages:
        return jsonify({"error": "messages is required"}), 400
    
    

    def get_Doubao_response():
        # print(prompt)
        try:
            return Doubao_Client.chat.completions.create(
                model="ep-20241225132124-f9dn8",
                messages=[{"role": "system", "content": "你是一个聊天助手，你现在正在给用户提供回复建议。"},
                          {"role": "user", "content": prompt}],
                stream=True
            )
        except Exception as e:
            print(f"Error calling Doubao API: {e}")
            return None
        
    def get_Gemini_response():
        try:
            model = genai.GenerativeModel('gemini-1.5-flash')
            return model.generate_content(prompt, stream=True)
        except Exception as e:
            print(f"Error calling Gemini API: {e}")
            return None

    def get_Deep_response():
        try:
            return Deep_SeeK_Client.chat.completions.create(
                model = "deepseek-chat",
                messages=[{"role": "system", "content": "你是一个聊天助手，你现在正在给用户提供回复建议。"},
                          {"role": "user", "content": prompt}],
                stream=True
            )
        except Exception as e:
            print(f"Error calling DeepSeek API: {e}")
            return None
        
    def get_Grok_response():
        try:
            return Grok_Client.chat.completions.create(
                model = "grok-2-1212",
                messages=[{"role": "system", "content": "你是一个聊天助手，你现在正在给用户提供回复建议。"},
                          {"role": "user", "content": prompt}],
                stream=True
            )
        except Exception as e:
            print(f"Error calling DeepSeek API: {e}")
            return None

    def Doubao_generate():
        stream = get_Doubao_response()
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
    
    def Gemeni_generate():
        stream = get_Gemini_response()
        if stream is None:
            yield f"data: {json.dumps({'error': 'Failed to get AI response'})}\n\n"
            return
        
        try:
            for chunk in stream:
                content = chunk.text
                # print(f"Sending content: {content}")
                yield f"data: {json.dumps({'content': content})}\n\n"
        except Exception as e:
            print(f"Error processing stream: {e}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    def DeepSeek_generate():
        stream = get_Deep_response()
        if stream is None:
            yield f"data: {json.dumps({'error': 'Failed to get AI response'})}\n\n"
            return
        try:
            for chunk in stream:
                print(f'Chunk: {chunk}')
                if chunk.choices and chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    yield f"data: {json.dumps({'content': content})}\n\n"
        except Exception as e:
            print(f"Error processing stream: {e}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    def Grok_generate():
        stream = get_Grok_response()
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

    def AI_generate():
        if choose_model == AIModel.DOUBAO:
            for chunk in Doubao_generate():
                yield chunk
        elif choose_model == AIModel.GEMINI:
            for chunk in Gemeni_generate():
                yield chunk
        elif choose_model == AIModel.DEEPSEEK:
            for chunk in DeepSeek_generate():
                yield chunk
        elif choose_model == AIModel.GROK:
            for chunk in Grok_generate():
                yield chunk

    return Response(
        stream_with_context(AI_generate()),
        mimetype='text/event-stream'
    )