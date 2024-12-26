from datetime import datetime, timedelta
from extensions import db

class Message(db.Model):
    __tablename__ = 'messages'

    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    sender_name = db.Column(db.String(80))
    receiver_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    group_id = db.Column(db.Integer, nullable = True)
    content = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(20), default='text')
    created_at = db.Column(db.DateTime, default=datetime.now)
    status = db.Column(db.String(20), default='sent')
    file_url = db.Column(db.String(255))
    is_read = db.Column(db.Boolean, default=False)

    def __init__(self, sender_id, receiver_id = 0, group_id = 0, content = '', type = 'text', file_url = '', status = 'sent', sender_name = ''):
        self.sender_id = sender_id
        self.receiver_id = receiver_id
        self.group_id = group_id
        self.content = content
        self.type = type
        self.file_url = file_url
        self.status = status
        self.sender_name = sender_name

    def __str__(self):
        return f'Message: {self.id}, {self.sender_id}, {self.receiver_id}, {self.group_id}, {self.content}, {self.type}, {self.created_at}, {self.status}, {self.file_url}'

    def __repr__(self):
        return super().__repr__()

    def to_dict(self):
        return {
            'id': self.id,
            'sender_id': self.sender_id,
            'receiver_id': self.receiver_id,
            'group_id': self.group_id,
            'content': self.content,
            'type': self.type,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'status': self.status,
            'file_url': self.file_url,
            'sender_name': self.sender_name
        }
    
    def save(self):
        print(f'Saving message: {self}')
        if None in [self.sender_id, self.receiver_id, self.group_id]:
            raise Exception('Sender ID, Receiver ID, or Group ID is required')
        if not self.sender_id:
            raise Exception('Sender ID is required')
        if self.receiver_id == 0 and self.group_id == 0:
            raise Exception('Receiver ID or Group ID is required')
        try:
            db.session.add(self)
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            raise e