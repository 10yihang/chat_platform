from datetime import datetime
from extensions import db

class Friendship(db.Model):
    __tablename__ = 'friendships'
    
    id = db.Column(db.BigInteger, primary_key=True)
    user_id = db.Column(db.BigInteger, db.ForeignKey('users.id'), nullable=False)
    friend_id = db.Column(db.BigInteger, db.ForeignKey('users.id'), nullable=False)
    status = db.Column(db.Enum('pending', 'accepted', 'blocked'), default='pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', foreign_keys=[user_id], backref='friendships_initiated')
    friend = db.relationship('User', foreign_keys=[friend_id], backref='friendships_received')

    def __repr__(self):
        return f'<Friendship {self.user_id} -> {self.friend_id}>'