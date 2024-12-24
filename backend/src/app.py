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
from routes.friend_request import friend_request_bp
from config import Config
from dotenv import load_dotenv
from flask_jwt_extended import JWTManager
from services.call_service import CallService
import eventlet
import ssl

def create_app():
    app = Flask(__name__)
    
    # 配置CORS，更新为HTTPS
    CORS(app, resources={
        r"/api/*": {
            "origins": ["https://localhost:8000", "https://10.255.253.3:8000", "https://127.0.0.1:8000"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
        },
        r"/socket.io/*": {
            "origins": ["https://localhost:8000", "https://10.255.253.3:8000", "https://127.0.0.1:8000"],
            "supports_credentials": True
        }
    })
    
    app.config.from_object(Config)
    app.add_url_rule('/uploads/<filename>', 'uploaded_file',
        lambda filename: send_from_directory(app.config['UPLOAD_FOLDER'],
        filename))
    db.init_app(app)
    print(app.config['JWT_SECRET_KEY'])
    redis_client.init_app(app)
    JWTManager(app)
    
    # 配置 SocketIO
    socketio.init_app(app, 
        cors_allowed_origins="*",
        async_mode='eventlet',
        ping_timeout=60,
        ping_interval=25,
        logger=True,
        engineio_logger=True,
        transports=['websocket'])
    
    # 注册蓝图
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(chat_bp, url_prefix='/api/chat')
    app.register_blueprint(user_bp, url_prefix='/api/user')
    app.register_blueprint(group_bp, url_prefix='/api/group')
    app.register_blueprint(profile_bp, url_prefix='/api/profile')
    app.register_blueprint(friend_request_bp, url_prefix='/api/friend')
    app.register_blueprint(file_bp, url_prefix='/api/file')
    
    return app

if __name__ == '__main__':
    load_dotenv()
    app = create_app()
    with app.app_context():
        db.create_all()
    print('数据库初始化完成')

    ssl_context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
    ssl_context.load_cert_chain(Config.SSL_CERT, Config.SSL_KEY)
    
    try:
        socket = eventlet.listen(('0.0.0.0', 5000))  # 或换成其他未占用端口
        socket = ssl_context.wrap_socket(socket, server_side=True)
        
        socketio.run(
            app,
            debug=True,
            host='0.0.0.0',
            port=5000,
            sock=socket
        )
    except OSError as e:
        print(f"Error: {e}")