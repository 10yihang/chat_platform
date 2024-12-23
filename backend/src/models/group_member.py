from datetime import UTC, timedelta, datetime
from extensions import db

class GroupMember(db.Model):
    __tablename__ = 'group_members'

    def __init__(self, group_id, user_id, role='member', nickname=None):
        self.group_id = group_id
        self.user_id = user_id
        self.role = role
        self.nickname = nickname
    
    id = db.Column(db.BigInteger, primary_key=True)
    group_id = db.Column(db.BigInteger, db.ForeignKey('user_groups.id'), nullable=False)
    user_id = db.Column(db.BigInteger, db.ForeignKey('users.id'), nullable=False)
    role = db.Column(db.Enum('admin', 'member'), default='member')
    nickname = db.Column(db.String(50))
    joined_at = db.Column(db.DateTime, default=datetime.now)

    group = db.relationship('Group', backref='members')
    user = db.relationship('User', backref='group_memberships')

    def __repr__(self):
        return f'<GroupMember {self.group_id} -> {self.user_id}>'
    
    def save(self):
        try:
            db.session.add(self)
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            raise e