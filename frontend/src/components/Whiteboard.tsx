import React, { useRef, useEffect, useState } from 'react';
import { Paper, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import Draggable from 'react-draggable';
import { useSocketContext } from '../contexts/SocketContextProvider';

interface WhiteboardProps {
  roomId: string;
  onClose: () => void;
}

const Whiteboard: React.FC<WhiteboardProps> = ({ roomId, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const { socket } = useSocketContext();

  const whiteboardRoomId = `whiteboard_${roomId}`;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    setContext(ctx);

    console.log('Joining whiteboard room:', whiteboardRoomId); 

    socket?.emit('join_whiteboard', { 
      room: whiteboardRoomId,
      token: localStorage.getItem('token'),
    });

    socket?.emit('request_whiteboard_state', { 
      room: whiteboardRoomId 
    });

    // 监听绘制事件
    socket?.on('draw', (data: { x: number; y: number; drawing: boolean; color: string; lineWidth: number; room: string }) => {
        console.log(data.room, whiteboardRoomId)
      
        if (!context || data.room !== whiteboardRoomId) return;
      
      context.strokeStyle = data.color;
      context.lineWidth = data.lineWidth;
      
      if (data.drawing) {
        context.lineTo(data.x, data.y);
        context.stroke();
      } else {
        context.beginPath();
        context.moveTo(data.x, data.y);
      }
    });

    // 监听清空白板事件
    socket?.on('clear_whiteboard', (data: { room: string }) => {
      if (!context || !canvas || data.room !== whiteboardRoomId) return;
      context.clearRect(0, 0, canvas.width, canvas.height);
    });

    // 监听白板状态
    socket?.on('whiteboard_state', (data: { state: any[], room: string }) => {
      if (!context || data.room !== whiteboardRoomId) return;
      
      context.clearRect(0, 0, canvas.width, canvas.height);
      
      data.state.forEach(item => {
        context.strokeStyle = item.color;
        context.lineWidth = item.lineWidth;
        
        if (item.drawing) {
          context.lineTo(item.x, item.y);
          context.stroke();
        } else {
          context.beginPath();
          context.moveTo(item.x, item.y);
        }
      });
    });

    return () => {
      socket?.off('draw');
      socket?.off('clear_whiteboard');
      socket?.off('whiteboard_state');
    };
  }, [socket, context, whiteboardRoomId, roomId]);

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!context || !isDrawing) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    context.lineTo(x, y);
    context.stroke();

    // 发送绘制数据
    socket?.emit('draw', {
      x,
      y,
      drawing: true,
      room: whiteboardRoomId
    });
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || !context) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    context.beginPath();
    context.moveTo(x, y);

    socket?.emit('draw', {
      x,
      y,
      drawing: false,
      room: whiteboardRoomId
    });
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (context) {
      context.beginPath();
    }
  };

  const clearCanvas = () => {
    if (!context || !canvasRef.current) return;
    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    socket?.emit('clear_whiteboard', { 
      room: whiteboardRoomId 
    });
  };

  return (
    <Draggable handle=".handle" bounds="parent">
      <Paper
        elevation={3}
        sx={{
          position: 'absolute',
          right: 20,
          top: 20,
          zIndex: 1000,
          backgroundColor: 'white',
          borderRadius: 2
        }}
      >
        <div className="handle" style={{ 
          cursor: 'move',
          padding: '8px',
          backgroundColor: '#128C7E',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8
        }}>
          <span>共享白板</span>
          <div>
            <IconButton size="small" onClick={clearCanvas} sx={{ color: 'white', mr: 1 }}>
              <DeleteOutlineIcon />
            </IconButton>
            <IconButton size="small" onClick={onClose} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </div>
        </div>
        <canvas
          ref={canvasRef}
          width={600}
          height={400}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          style={{ border: '1px solid #ddd' }}
        />
      </Paper>
    </Draggable>
  );
};

export default Whiteboard;
