from datetime import datetime
from extensions import db

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __init__(self, username, password, email=None):
        self.username = username
        self.password = password
        self.email = email

    def __repr__(self):
        return f"<User(username={self.username}, email={self.email})>"

    def check_password(self, password):
        return self.password == password
    
    def save(self):
        db.session.add(self)
        db.session.commit()