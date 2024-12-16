import os
from flask import current_app

class FileStorageService:
    def __init__(self, upload_folder=None):
        if upload_folder is None:
            upload_folder = current_app.config['UPLOAD_FOLDER']
        self.upload_folder = upload_folder
        os.makedirs(self.upload_folder, exist_ok=True)

    def save_file(self, file):
        file_path = os.path.join(self.upload_folder, file.filename)
        file.save(file_path)
        return file_path

    def get_file(self, filename):
        return os.path.join(self.upload_folder, filename)

    def delete_file(self, filename):
        file_path = self.get_file(filename)
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
        return False