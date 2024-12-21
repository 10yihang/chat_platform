from flask_sqlalchemy import SQLAlchemy
from flask import Flask
app = Flask(__name__)
db = SQLAlchemy(app)
class User(db.Model):
    id = db.Column(db.Integer, primary_key = True)
    username = db.Column(db.String(80), unique = True, nullable = False)
    password = db.Column(db.String(80), nullable = False)

user = User.query.filter_by(username='test_user').first()