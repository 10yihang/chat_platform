from datetime import datetime

class Message:
    def __init__(self, content, sender_id):
        self.content = content
        self.sender_id = sender_id
        self.timestamp = datetime.utcnow()

    def to_dict(self):
        return {
            'content': self.content,
            'sender_id': self.sender_id,
            'timestamp': self.timestamp.isoformat()
        }