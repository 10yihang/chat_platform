from datetime import datetime

class User:
    def __init__(self, username, password, email=None):
        self.username = username
        self.password = password
        self.email = email
        self.created_at = datetime.utcnow()

    def __repr__(self):
        return f"<User(username={self.username}, email={self.email})>"

    def check_password(self, password):
        return self.password == password