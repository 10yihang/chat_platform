import React, { useState, useRef, useCallback, useEffect } from 'react';
import { IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box } from '@mui/material';
import CallIcon from '@mui/icons-material/Call';
import CallEndIcon from '@mui/icons-material/CallEnd';
import { useSocketContext } from '../contexts/SocketContextProvider';
import { message } from 'antd';
import Draggable from 'react-draggable';
import { Paper } from '@mui/material';

interface VoiceCallProps {
  friendId?: string;
  groupId?: string;
  userName?: string;
}

const checkAudioPermission = async () => {
  try {
    await navigator.mediaDevices.getUserMedia({ audio: true });
    return true;
  } catch (error) {
    console.error('无法访问麦克风:', error);
    return false;
  }
};

const VoiceCall: React.FC<VoiceCallProps> = ({ friendId, userName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isCaller, setIsCaller] = useState(false);
  const [showCallDialog, setShowCallDialog] = useState(false);
  const [callerName, setCallerName] = useState('');
  const [isEnded, setIsEnded] = useState(false);
  const localAudioRef = useRef<HTMLAudioElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const { socket } = useSocketContext();

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('ice_candidate', {
          target_id: friendId,
          candidate: event.candidate,
          sender_id: localStorage.getItem('userId')
        });
      }
    };

    pc.ontrack = (event) => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = event.streams[0];
      }
    };

    peerConnection.current = pc;
    return pc;
  }, [friendId, socket]);

  const handleCall = async () => {
    try {
      const hasPermission = await checkAudioPermission();
      if (!hasPermission) {
        message.error('请允许访问麦克风');
        return;
      }

      setIsOpen(true);
      setIsEnded(false);
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStream.current = stream;
      
      if (localAudioRef.current) {
        localAudioRef.current.srcObject = stream;
      }
      
      const pc = createPeerConnection();
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket?.emit('call_request', {
        target_id: friendId,
        caller_name: userName,
        type: 'voice',
        sdp: offer
      });

      setIsCaller(true);
    } catch (error) {
      console.error('获取音频失败:', error);
      handleEndCall();
    }
  };

  useEffect(() => {
    if (!socket) return;

    socket.on('call_received', async (data) => {
        console.log('call_received', data);
      setCallerName(data.caller_name);
      setShowCallDialog(true);
    });

    socket.on('call_answered', async (data) => {
      if (peerConnection.current) {
        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(data.sdp)
        );
      }
      setIsConnected(true);
    });

    socket.on('ice_candidate', async (data) => {
      if (peerConnection.current) {
        await peerConnection.current.addIceCandidate(
          new RTCIceCandidate(data.candidate)
        );
      }
      
    });

    socket.on('call_rejected', () => {
      handleEndCall();
    });

    socket.on('call_ended', () => {
      handleEndCall();
    });

    socket.on('call_error', (error) => {
        console.error('通话错误:', error);
        setIsOpen(false);
        message.error('无法建立通话连接');
    });

    return () => {
      socket.off('call_received');
      socket.off('call_answered');
      socket.off('ice_candidate');
      socket.off('call_rejected');
      socket.off('call_ended');
    socket.off('call_error');
    };
  }, [socket, createPeerConnection]);

  const handleAcceptCall = async (data: any) => {
    try {
      setShowCallDialog(false);
      setIsOpen(true);
      setIsEnded(false); // 重置结束状态
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStream.current = stream;
      localAudioRef.current!.srcObject = stream;

      const pc = createPeerConnection();
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket?.emit('call_answer', {
        target_id: data.caller_id,
        sdp: answer
      });
    } catch (error) {
      console.error('接受通话失败:', error);
      setIsOpen(false);
      message.error('无法建立通话连接');
    }
  };

  const handleRejectCall = () => {
    setShowCallDialog(false);
    socket?.emit('call_rejected', { target_id: friendId });
  };

  const handleEndCall = () => {
    if (isEnded) return;
    
    try {
      setIsEnded(true);
      setIsOpen(false);
      setIsConnected(false);
      setShowCallDialog(false);
      
      if (localStream.current) {
        localStream.current.getTracks().forEach(track => track.stop());
        localStream.current = null;
      }
      
      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
      }

      if (localAudioRef.current) {
        localAudioRef.current.srcObject = null;
      }
      
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = null;
      }

      socket?.emit('call_ended', { 
        target_id: friendId,
        sender_id: localStorage.getItem('userId')
      });

    } catch (error) {
      console.error('结束通话失败:', error);
    }
  };

  useEffect(() => {
    return () => {
      handleEndCall(); // 组件卸载时清理资源
    };
  }, []);

  return (
    <>
      <IconButton onClick={handleCall}>
        <CallIcon />
      </IconButton>

      <Dialog open={showCallDialog} onClose={handleRejectCall}>
        <DialogTitle>来电</DialogTitle>
        <DialogContent>
          <Typography>{callerName} 邀请您语音通话</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRejectCall} color="error">
            拒绝
          </Button>
          <Button onClick={() => handleAcceptCall({ caller_id: friendId, sdp: peerConnection.current?.localDescription })} color="primary" autoFocus>
            接受
          </Button>
        </DialogActions>
      </Dialog>

      {isOpen && (
        <Draggable bounds="parent" handle=".drag-handle">
          <Paper
            sx={{
              position: 'fixed',
              right: 20,
              bottom: 20,
              zIndex: 1000,
              width: 300,
              borderRadius: 2,
              boxShadow: 3,
            }}
          >
            <Box 
              className="drag-handle" 
              sx={{ 
                cursor: 'move',
                bgcolor: 'primary.main',
                color: 'white',
                p: 1,
                borderTopLeftRadius: 8,
                borderTopRightRadius: 8,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Typography>语音通话</Typography>
              <IconButton size="small" onClick={handleEndCall} sx={{ color: 'white' }}>
                <CallEndIcon />
              </IconButton>
            </Box>
            <Box sx={{ p: 2 }}>
              <audio ref={localAudioRef} autoPlay muted />
              <audio ref={remoteAudioRef} autoPlay />
              <Typography align="center">
                {isConnected ? '通话中...' : '正在连接...'}
              </Typography>
            </Box>
          </Paper>
        </Draggable>
      )}
    </>
  );
};

export default VoiceCall;