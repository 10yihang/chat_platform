from flask import Flask
from flask_cors import CORS
from config import Config
from extensions import db
from routes.auth import auth_bp
from routes.chat import chat_bp
from routes.media import media_bp
from routes.user import user_bp
from routes.group import group_bp
from routes.profile import profile_bp
from config import Config
from dotenv import load_dotenv
from websocket import socketio
from flask_jwt_extended import JWTManager

def create_app():
    app = Flask(__name__)
    
    # 配置CORS
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:8000", "http://10.255.253.3:8000", "http://127.0.0.1:8000"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
        },
        r"/socket.io/*": {
            "origins": ["http://localhost:8000", "http://10.255.253.3:8000"],
            "methods": ["GET", "POST", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
        }
    })
    
    app.config.from_object(Config)
    print(app.config['JWT_SECRET_KEY'])
    db.init_app(app)
    JWTManager(app)
    
    # 配置 SocketIO
    socketio.init_app(app, 
        cors_allowed_origins="*",
        async_mode='eventlet',
        ping_timeout=60,
        ping_interval=25,
        logger=True,
        engineio_logger=True)
    
    # 注册蓝图
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(chat_bp, url_prefix='/api/chat')
    app.register_blueprint(media_bp, url_prefix='/api/media')
    app.register_blueprint(user_bp, url_prefix='/api/user')
    app.register_blueprint(group_bp, url_prefix='/api/group')
    app.register_blueprint(profile_bp, url_prefix='/api/profile')
    
    return app

if __name__ == '__main__':
    load_dotenv()
    app = create_app()
    with app.app_context():
        db.create_all()
    print('数据库初始化完成')
    socketio.run(app, debug=True, port=5000, host='0.0.0.0')