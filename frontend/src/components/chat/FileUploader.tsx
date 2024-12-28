import React, { useRef, useState, useCallback, useEffect } from 'react';
import { IconButton } from '@mui/material';
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
    onUploadProgress: (isUploading: boolean, progress: number) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ 
    socket, 
    roomId, 
    messageData,
    onUploadProgress 
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const receivedChunksRef = useRef(0);
    const totalChunksRef = useRef(0);

    const CHUNK_SIZE = 200 * 1024;
    const MAX_CONCURRENT_UPLOADS = 5;
    const TIMEOUT_DURATION = 5000;
    const MAX_RETRIES = 3;

    useEffect(() => {
        if (!socket) return;

        const handleUploadProgress = (data: { fileId: string, progress: number, room: string }) => {
            if (data.room === messageData.room) {
                onUploadProgress(true, data.progress);
            }
        };

        socket.on('upload_progress', handleUploadProgress);
        return () => {
            socket.off('upload_progress', handleUploadProgress);
        };
    }, [socket, onUploadProgress, messageData.room]);

    const updateUploadProgress = useCallback((received: number, total: number) => {
        const progress = (received / total) * 100;
        onUploadProgress(true, progress);
    }, [onUploadProgress]);

    const uploadChunk = async (
        fileId: string,
        chunkIndex: number,
        chunk: ArrayBuffer,
        totalChunks: number,
        retryCount = 0
    ): Promise<void> => {
        return new Promise((resolve, reject) => {
            const chunkHandler = () => {
                receivedChunksRef.current += 1;
                updateUploadProgress(receivedChunksRef.current, totalChunksRef.current);
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
        try {
            for (let i = 0; i < chunks.length; i += MAX_CONCURRENT_UPLOADS) {
                const uploadPromises = [];
                for (let j = 0; j < MAX_CONCURRENT_UPLOADS && i + j < chunks.length; j++) {
                    const chunkIndex = i + j;
                    uploadPromises.push(uploadChunk(fileId, chunkIndex, chunks[chunkIndex], totalChunks));
                }
                await Promise.all(uploadPromises);
            }
            // 所有分片上传完成后再关闭进度条
            setTimeout(() => {
                setIsUploading(false);
                onUploadProgress(false, 0);
            }, 500);
        } catch (error) {
            console.error('分片上传失败:', error);
            throw error;
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
        receivedChunksRef.current = 0;
        onUploadProgress(true, 0);  // 添加这行，确保开始时通知父组件

        try {
            totalChunksRef.current = Math.ceil(file.size / CHUNK_SIZE);
            const chunks: ArrayBuffer[] = [];

            for (let i = 0; i < totalChunksRef.current; i++) {
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
                    totalChunks: totalChunksRef.current,
                    fileType: file.type,
                    message: fileMessageData,
                    room: messageData.room
                });

                setTimeout(() => {
                    socket?.off('file_transfer_init', initHandler);
                    reject(new Error('File transfer init timeout'));
                }, 5000);
            });

            await uploadChunksConcurrently(chunks, fileId, totalChunksRef.current);
            message.success('文件上传成功,请稍等');
        } catch (error) {
            console.error('文件上传失败:', error);
            message.error('文件上传失败');
            setIsUploading(false);
            onUploadProgress(false, 0);
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
            <IconButton onClick={() => fileInputRef.current?.click()}>
                <AttachFileIcon />
            </IconButton>
        </>
    );
};

export default FileUploader;
