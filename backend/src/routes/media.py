from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import os

media_bp = Blueprint('media', __name__)

UPLOAD_FOLDER = 'uploads/'  # 上传文件的目录

@media_bp.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': '没有文件被上传'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': '没有选择文件'}), 400
    if file :
        filename = secure_filename(file.filename)
        file.save(os.path.join(UPLOAD_FOLDER, filename))
        return jsonify({'message': '文件上传成功', 'filename': filename}), 201
    return jsonify({'error': '不允许的文件类型'}), 400

@media_bp.route('/media/<filename>', methods=['GET'])
def get_media(filename):
    return jsonify({'message': f'获取媒体文件: {filename}'}), 200