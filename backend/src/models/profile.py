from extensions import db
from datetime import datetime, timedelta

class Profile(db.Model):
    __tablename__ = 'profiles'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    avatar = db.Column(db.String(255))
    bio = db.Column(db.Text)
    location = db.Column(db.String(100))
    phone = db.Column(db.String(20))
    updated_at = db.Column(db.DateTime, default=datetime.now)