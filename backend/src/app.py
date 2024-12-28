from flask import Flask, send_from_directory
from flask_cors import CORS
from config import Config
from extensions import db, socketio, redis_client
from routes.auth import auth_bp
from routes.chat import chat_bp
from routes.user import user_bp
from routes.group import group_bp
from routes.profile import profile_bp
from routes.file import file_bp
from routes.ai import ai_bp
from routes.friend_request import friend_request_bp
from config import Config
from dotenv import load_dotenv
from flask_jwt_extended import JWTManager
from routes.whiteboard import whiteboard_bp
import ssl, os

def create_app(app):
    # 配置CORS
    CORS(app, resources={
        r"/api/*": {
            "origins": ["https://localhost", "https://10.255.253.3", "https://127.0.0.1", "http://10.71.114.215", "https://chat.yihang01.cn"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
        },
        r"/socket.io/*": {
            "origins": ["https://localhost", "https://10.255.253.3", "https://127.0.0.1", "http://10.71.114.215", "https://chat.yihang01.cn"],
            # "methods": ["GET", "POST", "OPTIONS"],
            # "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
        }
    })
    
    app.config.from_object(Config)
    db.init_app(app)
    redis_client.init_app(app)
    JWTManager(app)
    
    socketio.init_app(app, 
        cors_allowed_origins="*",
        async_mode='threading',
        ping_timeout=60,
        ping_interval=25,
        logger=True,
        engineio_logger=True,
        transports=['websocket'])
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(chat_bp, url_prefix='/api/chat')
    app.register_blueprint(user_bp, url_prefix='/api/user')
    app.register_blueprint(group_bp, url_prefix='/api/group')
    app.register_blueprint(profile_bp, url_prefix='/api/profile')
    app.register_blueprint(friend_request_bp, url_prefix='/api/friend')
    app.register_blueprint(file_bp, url_prefix='/api/file')
    app.register_blueprint(whiteboard_bp, url_prefix='/api/whiteboard')
    app.register_blueprint(ai_bp, url_prefix='/api/ai')

    return app

app = Flask(__name__)

if __name__ == '__main__':
    load_dotenv()
    create_app(app)
    with app.app_context():
        db.create_all()
    print('数据库初始化完成')

    ssl_ctx = ssl.SSLContext(ssl.PROTOCOL_TLSv1_2)
    ssl_ctx.load_cert_chain(certfile='chat.yihang01.cn_bundle.crt', keyfile='chat.yihang01.cn.key')

    socketio.run(app, debug=True, port=Config.PORT, host='0.0.0.0', ssl_context=ssl_ctx)