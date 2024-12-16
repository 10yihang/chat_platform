from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from routes.auth import auth_bp
from routes.chat import chat_bp
from routes.media import media_bp

# 初始化应用
app = Flask(__name__)
CORS(app)

# 配置应用程序
app.config['SECRET_KEY'] = 'your-secret-key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///chat.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# 初始化数据库
db = SQLAlchemy(app)

# 注册蓝图
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(chat_bp, url_prefix='/api/chat')
app.register_blueprint(media_bp, url_prefix='/api/media')

def init_db():
    with app.app_context():
        db.create_all()

if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000)