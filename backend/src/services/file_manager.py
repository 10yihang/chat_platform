import os
import time
from config import Config
from urllib.parse import unquote

class FileUploadManager:
    def __init__(self):
        self.file_chunks = {}  
        self.file_info = {}  

    def init_file(self, file_name, total_chunks, file_type, message_data):
        try:
            # 解码并规范化文件名
            decoded_name = unquote(file_name)
            # 生成文件ID时保持原始格式
            file_id = f"{message_data['sender_id']}_{int(time.time())}_{decoded_name}"
            
            self.file_chunks[file_id] = [None] * total_chunks
            self.file_info[file_id] = {
                'name': decoded_name,
                'type': file_type,
                'total_chunks': total_chunks,
                'received_chunks': 0,
                'message_data': message_data
            }
            return file_id
        except Exception as e:
            print(f"初始化文件失败: {str(e)}")
            return None

    def add_chunk(self, file_id, chunk_index, chunk_data):
        try:
            decoded_file_id = unquote(file_id)
            
            if decoded_file_id in self.file_chunks:
                self.file_chunks[decoded_file_id][chunk_index] = chunk_data
                self.file_info[decoded_file_id]['received_chunks'] += 1
                print(f'isTrue: {self.file_info[decoded_file_id]['received_chunks']} ---------: {self.file_info[decoded_file_id]['total_chunks']}')
                return self.file_info[decoded_file_id]['received_chunks'] == self.file_info[decoded_file_id]['total_chunks']

            else:
                print(f'未找到文件ID: {decoded_file_id}')
                return False
        except Exception as e:
            print(f"添加分片失败: {str(e)}")
            return False

    def save_file(self, file_id):
        try:
            if file_id not in self.file_chunks:
                return None

            # file_data = self.file_info[file_id]
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