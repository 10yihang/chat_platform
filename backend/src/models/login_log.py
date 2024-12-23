from datetime import UTC, timedelta, datetime
from extensions import db

class LoginLog(db.Model):
    __tablename__ = 'login_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    ip_address = db.Column(db.String(50))
    device_info = db.Column(db.String(255))
    login_time = db.Column(db.DateTime, default=datetime.now)
    status = db.Column(db.String(20), nullable=False)