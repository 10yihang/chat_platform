from datetime import UTC, timedelta, datetime
from extensions import db

class Group(db.Model):
    __tablename__ = 'user_groups'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    avatar = db.Column(db.String(255))
    owner_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    type = db.Column(db.Enum('public', 'private'), default='private')
    created_at = db.Column(db.DateTime, default=datetime.now)

