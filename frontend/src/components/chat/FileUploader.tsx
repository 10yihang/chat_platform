import React, { useRef, useState } from 'react';
import { IconButton, LinearProgress } from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { message } from 'antd';
import { Socket } from 'socket.io-client';

interface FileUploaderProps {
    socket: Socket | null;
    roomId: string | string[];
    messageData: {
        sender_id: number;
        receiver_id: number;
        group_id: number;
        sender_name: string;
        room: string | string[];
    };
}

const FileUploader: React.FC<FileUploaderProps> = ({ socket, roomId, messageData }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);

    const CHUNK_SIZE = 200 * 1024;
    const MAX_CONCURRENT_UPLOADS = 5;
    const TIMEOUT_DURATION = 5000;
    const MAX_RETRIES = 3;

    const uploadChunk = async (
        fileId: string,
        chunkIndex: number,
        chunk: ArrayBuffer,
        totalChunks: number,
        retryCount = 0
    ): Promise<void> => {
        return new Promise((resolve, reject) => {
            const chunkHandler = () => {
                resolve();
            };

            socket?.once('chunk_received', chunkHandler);
            socket?.emit('file_chunk', {
                fileId,
                chunkIndex,
                totalChunks,
                data: Array.from(new Uint8Array(chunk))
            });

            const timeoutId = setTimeout(async () => {
                socket?.off('chunk_received', chunkHandler);
                if (retryCount < MAX_RETRIES) {
                    try {
                        await uploadChunk(fileId, chunkIndex, chunk, totalChunks, retryCount + 1);
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                } else {
                    reject(new Error(`分片 ${chunkIndex} 上传超时，已重试 ${MAX_RETRIES} 次`));
                }
            }, TIMEOUT_DURATION);

            socket?.once('chunk_received', () => {
                clearTimeout(timeoutId);
                socket?.off('chunk_received', chunkHandler);
                resolve();
            });
        });
    };

    const uploadChunksConcurrently = async (chunks: ArrayBuffer[], fileId: string, totalChunks: number) => {
        let completedChunks = 0;
        const updateProgress = () => {
            completedChunks++;
            const progress = (completedChunks / totalChunks) * 100;
            setUploadProgress(progress);
        };

        for (let i = 0; i < chunks.length; i += MAX_CONCURRENT_UPLOADS) {
            const uploadPromises = [];
            for (let j = 0; j < MAX_CONCURRENT_UPLOADS && i + j < chunks.length; j++) {
                const chunkIndex = i + j;
                uploadPromises.push(
                    uploadChunk(fileId, chunkIndex, chunks[chunkIndex], totalChunks)
                        .then(() => {
                            updateProgress();
                        })
                );
            }
            await Promise.all(uploadPromises).catch((error) => {
                console.error('分片上传失败:', error);
                throw error;
            });
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        event.target.value = '';

        if (file.size > 1024 * 1024 * 1024) {
            message.error('文件大小不能超过1GB');
            return;
        }

        const filename_nospace = file.name.replace(/\s/g, '_');
        const fileName = encodeURIComponent(filename_nospace);

        const fileMessageData = {
            ...messageData,
            content: filename_nospace,
            type: 'file'
        };

        setIsUploading(true);
        setUploadProgress(0);

        try {
            const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
            const chunks: ArrayBuffer[] = [];

            for (let i = 0; i < totalChunks; i++) {
                const start = i * CHUNK_SIZE;
                const end = Math.min(start + CHUNK_SIZE, file.size);
                chunks.push(await file.slice(start, end).arrayBuffer());
            }

            const fileId = await new Promise<string>((resolve, reject) => {
                const initHandler = (response: any) => {
                    resolve(response.file_id);
                };

                socket?.once('file_transfer_init', initHandler);
                socket?.emit('file_transfer_start', {
                    fileName,
                    fileSize: file.size,
                    totalChunks,
                    fileType: file.type,
                    message: fileMessageData
                });

                setTimeout(() => {
                    socket?.off('file_transfer_init', initHandler);
                    reject(new Error('File transfer init timeout'));
                }, 5000);
            });

            await uploadChunksConcurrently(chunks, fileId, totalChunks);
            message.success('文件上传成功,请稍等');
        } catch (error) {
            console.error('文件上传失败:', error);
            message.error('文件上传失败');
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    return (
        <>
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileUpload}
            />
            {isUploading && (
                <LinearProgress
                    variant="determinate"
                    value={uploadProgress}
                    sx={{ mb: 1, width: '100%' }}
                />
            )}
            <IconButton onClick={() => fileInputRef.current?.click()}>
                <AttachFileIcon />
            </IconButton>
        </>
    );
};

export default FileUploader;
