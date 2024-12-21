from flask import Flask
from flask_cors import CORS
from config import Config
from extensions import db
from routes.auth import auth_bp
from routes.chat import chat_bp
from routes.media import media_bp
from flask_sqlalchemy import SQLAlchemy
from config import Config

def create_app():
    app = Flask(__name__)
    CORS(app)
    app.config.from_object(Config)
    
    db.init_app(app)
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(chat_bp, url_prefix='/api/chat')
    app.register_blueprint(media_bp, url_prefix='/api/media')
    
    return app

if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        db.create_all()
    print('数据库初始化完成')
    app.run(debug=True, port=5000, host='0.0.0.0')