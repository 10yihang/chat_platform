from flask import Flask, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/api/*": {
    "origins": "*",
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "allow_headers": "*"
}})

@app.route('/api/auth/login', methods=['POST','OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        return {"message": "Options OK"}, 200
    return {"message": "Login successful!"}, 200

if __name__ == '__main__':
    app.run(debug=True, port=5000, host='0.0.0.0')
