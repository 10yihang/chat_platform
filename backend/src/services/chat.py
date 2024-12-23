from flask import Blueprint, request, jsonify
from models.message import Message
import jwt, time, os
from werkzeug.utils import secure_filename
from jwt import encode, decode
from models.user import User
from config import Config
from datetime import datetime, timedelta, UTC
from extensions import db
from websocket import socketio
from models.group_member import GroupMember
from flask_socketio import emit, join_room, leave_room
from services.file_manager import FileUploadManager
from models.message import Message
from extensions import socketio
from flask_socketio import emit

class ChatService:

    def __init__(self):
        self.setup_socket_handlers()
        self.file_manager = FileUploadManager()
        
    def setup_socket_handlers(self):
        @socketio.on('chat')
        def handle_message(data):
            try:
                message_type = data.get('message', {}).get('type')
                if not message_type:
                    raise ValueError("消息类型不能为空")
                    
                handlers = {
                    'text': self.handle_text_message,
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

        @socketio.on('file_transfer_start')
        def handle_file_start(data):
            try:
                print(f"data[message]: {data['message']}")
                file_id = self.file_manager.init_file(
                    data['fileName'],
                    data['totalChunks'],
                    data['fileType'],
                    data['message']
                )
                # print(f"初始化文件传输: {file_id}")
                emit('file_transfer_init', {'file_id': file_id})
            except Exception as e:
                print(f"初始化文件传输失败: {str(e)}")
                emit('error', {'msg': str(e)})

        @socketio.on('file_chunk')
        def handle_file_chunk(data):
            try:
                # print(f"接收文件分片: {data}")
                if self.file_manager.add_chunk(data['fileId'], data['chunkIndex'], data['data']):
                    file_url = self.file_manager.save_file(data['fileId'])
                    if file_url:
                        file_info = self.file_manager.file_info.get(data['fileId'])
                        # print('file info: ',self.file_manager.file_info)
                        if not file_info:
                            raise ValueError(f"找不到文件信息: {data['fileId']}")
                            
                        message_data = file_info['message_data']
                        new_message = Message(
                            sender_id=message_data['sender_id'],
                            receiver_id=message_data['receiver_id'],
                            group_id=message_data['group_id'],
                            content=message_data['content'],
                            type='file',
                            sender_name=message_data['sender_name'],
                            file_url=file_url
                        )
                        new_message.save()
                        
                        emit('message', {
                            'id': new_message.id,
                            'sender_id': new_message.sender_id,
                            'receiver_id': new_message.receiver_id,
                            'group_id': new_message.group_id,
                            'content': new_message.content,
                            'type': 'file',
                            'sender_name': new_message.sender_name,
                            'created_at': new_message.created_at.isoformat(),
                            'file_url': file_url
                        }, room=message_data['room'])

                emit('chunk_received', {'index': data['chunkIndex']})
            except Exception as e:
                print(f"处理文件分片失败: {str(e)}")
                emit('error', {'msg': str(e)})
            
    def handle_text_message(self, data):
        try:
            message = data.get('message')
            room = data.get('room')
            
            if not room:
                raise ValueError("房间ID不能为空")
                
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
            
            # 确保消息只发送到指定房间
            emit('message', {
                **message,
                'id': new_message.id,
                'sender_name': sender.username,
                'created_at': new_message.created_at.isoformat()
            }, room=room)
            
            return True
        except Exception as e:
            print(f"处理消息错误: {str(e)}")
            emit('error', {'msg': str(e)})
            return False
    
    # def handle_file_message(self, data):
    #     try:
    #         UPLOAD_FOLDER = Config.UPLOAD_FOLDER

    #         message = data.get('message', {})
    #         file_data = data.get('file')
            
    #         if not file_data or not isinstance(file_data, dict):
    #             raise Exception('未提供文件或文件格式错误')
                
    #         sender = User.query.get(message.get('sender_id'))
    #         if not sender:
    #             raise Exception('发送者不存在')

    #         # 生成唯一文件名
    #         filename = secure_filename(file_data.get('name', ''))
    #         unique_filename = f'{sender.id}_{int(time.time())}_{filename}'

    #         # 确保上传目录存在
    #         if not os.path.exists(UPLOAD_FOLDER):
    #             os.makedirs(UPLOAD_FOLDER)

    #         # 保存文件
    #         file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
    #         with open(file_path, 'wb') as f:
    #             binary_data = bytes(file_data.get('data', []))
    #             f.write(binary_data)

    #         file_url = f'/uploads/{unique_filename}'

    #         new_message = Message(
    #             sender_id=message.get('sender_id'),
    #             receiver_id=message.get('receiver_id', 0),
    #             group_id=message.get('group_id', 0),
    #             content=message.get('content'),
    #             type='file',
    #             sender_name=sender.username,
    #             file_url=file_url
    #         )
            
    #         new_message.save()
            
    #         # 发送消息通知
    #         emit('message', {
    #             'id': new_message.id,
    #             'sender_id': new_message.sender_id,
    #             'receiver_id': new_message.receiver_id,
    #             'group_id': new_message.group_id,
    #             'content': new_message.content,
    #             'type': 'file',
    #             'sender_name': sender.username,
    #             'created_at': new_message.created_at.isoformat(),
    #             'file_url': file_url
    #         }, room=message.get('room'))
            
    #         return True
            
    #     except Exception as e:
    #         print(f"处理文件错误: {str(e)}")
    #         emit('error', {'msg': str(e)})
    #         return False
        
    def handle_emoji_message(self, data):
        return self.handle_message(data)

    def handle_message(self, data):
        pass

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
            'exp': datetime.utcnow() + timedelta(hours=24), 
            'iat': datetime.utcnow(),  
            'sub': str(user_id)  
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