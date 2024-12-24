from flask import Blueprint, request, jsonify, send_from_directory, Response
from config import Config
from werkzeug.utils import secure_filename
import os
from urllib.parse import unquote

file_bp = Blueprint('file', __name__)

@file_bp.route('/uploads/<path:filename>', methods=['GET'])
def uploaded_file(filename):
    def send_file():
        decoded_filename = unquote(filename)
        store_path = os.path.join(Config.UPLOAD_FOLDER, decoded_filename)
        try:
            with open(store_path, 'rb') as targetfile:
                while 1:
                    data = targetfile.read(1024 * 1024)
                    if not data:
                        break
                    yield data
        except FileNotFoundError:
            print(f"File not found: {store_path}")
            return jsonify({'error': 'File not found'}), 404
        except Exception as e:
            print(f"Error reading file: {e}")
            return jsonify({'error': 'Error reading file'}), 500

    try:
        decoded_filename = unquote(filename)
        decoded_filename = decoded_filename.encode('utf-8').decode('latin1')
        response = Response(send_file(), content_type='application/octet-stream')
        response.headers["Content-disposition"] = f"attachment; filename*='UTF-8''{decoded_filename}" # Corrected line
        return response
    except Exception as e:
        print(f"File download error: {str(e)}")
        return jsonify({'error': str(e)}), 500