import os
import time
from config import Config
from werkzeug.utils import secure_filename

class FileUploadManager:
    def __init__(self):
        self.file_chunks = {}  
        self.file_info = {}  

    def init_file(self, file_name, total_chunks, file_type, message_data):
        # print(f"初始化文件: {file_name}, {total_chunks}, {file_type}, {message_data}")
        decoded_name = secure_filename(file_name)
        file_id = f"{message_data['sender_id']}_{int(time.time())}_{file_name}"
        self.file_chunks[file_id] = [None] * total_chunks
        self.file_info[file_id] = {
            'name': decoded_name,
            'type': file_type,
            'total_chunks': total_chunks,
            'received_chunks': 0,
            'message_data': message_data
        }
        return file_id.replace(' ','')

    def add_chunk(self, file_id, chunk_index, chunk_data):
        if file_id in self.file_chunks:
            self.file_chunks[file_id][chunk_index] = chunk_data
            self.file_info[file_id]['received_chunks'] += 1
            return self.file_info[file_id]['received_chunks'] == self.file_info[file_id]['total_chunks']
        return False

    def save_file(self, file_id):
        try:
            if file_id not in self.file_chunks:
                return None

            file_data = self.file_info[file_id]
            chunks = self.file_chunks[file_id]
            
            if None in chunks:
                return None

            if not os.path.exists(Config.UPLOAD_FOLDER):
                os.makedirs(Config.UPLOAD_FOLDER)

            file_path = os.path.join(Config.UPLOAD_FOLDER, file_id)
            with open(file_path, 'wb') as f:
                for chunk in chunks:
                    f.write(bytes(chunk))

            del self.file_chunks[file_id]
            # del self.file_info[file_id]

            return f'/uploads/{file_id}'
        except Exception as e:
            print(f"保存文件失败: {str(e)}")
            return None