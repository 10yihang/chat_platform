from flask import Blueprint, request, jsonify, send_from_directory, Response
from config import Config
from flask_jwt_extended import jwt_required
import os

file_bp = Blueprint('file', __name__)

@file_bp.route('/uploads/<path:filename>', methods=['GET'])
# @jwt_required()
def uploaded_file(filename):
    def send_file():
        store_path = os.path.join(Config.UPLOAD_FOLDER,filename)
        with open(store_path, 'rb') as targetfile:
            while 1:
                data = targetfile.read(1 * 1024 * 1024) 
                if not data:
                    break
                yield data
    response = Response(send_file(), content_type='application/octet-stream')
    response.headers["Content-disposition"] = 'attachment; filename=%s' % filename   # 如果不加上这行代码，导致下图的问题
    return response