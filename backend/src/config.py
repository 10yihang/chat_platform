import os
from datetime import timedelta

class Config:
    REDIS_URL = "redis://localhost:6379/0"
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'dev-jwt-secret-key')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    JWT_TOKEN_LOCATION = ['headers', 'query_string']
    MYSQL_CONFIG = {
        'host': '10.255.253.63',
        'port': 3306,
        'user': 'root',
        'password': os.environ.get('MYSQL_PASSWORD'),
        'database': 'chat_platform',
        'charset': 'utf8mb4'
    }
    SQLALCHEMY_DATABASE_URI = f"mysql+pymysql://{MYSQL_CONFIG['user']}:{MYSQL_CONFIG['password']}@{MYSQL_CONFIG['host']}:{MYSQL_CONFIG['port']}/{MYSQL_CONFIG['database']}?charset={MYSQL_CONFIG['charset']}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    UPLOAD_FOLDER = 'uploads'
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024
    PREFERRED_URL_SCHEME = 'https'
    BASE_URL = 'https://chat.yihang01.cn'
    PORT = 5000
    MAIL_SERVER = 'smtp.qq.com'
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USE_SSL = False
    MAIL_USERNAME = 'yihang_01_doge@qq.com'
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD') 
    MAIL_DEFAULT_SENDER = 'yihang_01_doge@qq.com' 