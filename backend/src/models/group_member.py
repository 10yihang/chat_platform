from datetime import datetime
from extensions import db

class GroupMember(db.Model):
    __tablename__ = 'group_members'
    
    id = db.Column(db.BigInteger, primary_key=True)
    group_id = db.Column(db.BigInteger, db.ForeignKey('user_groups.id'), nullable=False)
    user_id = db.Column(db.BigInteger, db.ForeignKey('users.id'), nullable=False)
    role = db.Column(db.Enum('admin', 'member'), default='member')
    nickname = db.Column(db.String(50))
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)

    group = db.relationship('Group', backref='members')
    user = db.relationship('User', backref='group_memberships')