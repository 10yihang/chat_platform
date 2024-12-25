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
  const iceCandidatesQueue = useRef<RTCIceCandidate[]>([]);

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

  const addIceCandidate = async (candidate: RTCIceCandidate) => {
    try {
      if (peerConnection.current?.remoteDescription) {
        await peerConnection.current.addIceCandidate(candidate);
      } else {
        iceCandidatesQueue.current.push(candidate);
      }
    } catch (error) {
      console.error('添加ICE候选项失败:', error);
    }
  };

  const processIceCandidatesQueue = async () => {
    if (!peerConnection.current?.remoteDescription) return;
    
    while (iceCandidatesQueue.current.length) {
      const candidate = iceCandidatesQueue.current.shift();
      if (candidate) {
        try {
          await peerConnection.current.addIceCandidate(candidate);
        } catch (error) {
          console.error('处理队列中的ICE候选项失败:', error);
        }
      }
    }
  };

  const handleCall = async () => {
    try {
      if (!friendId || !userName) {
        message.error('无法发起通话：缺少必要信息');
        return;
      }

      const hasPermission = await checkAudioPermission();
      if (!hasPermission) {
        message.error('请允许访问麦克风');
        return;
      }

      // 立即设置状态，确保组件显示
      setIsOpen(true);
      setIsEnded(false);
      setIsCaller(true);
      setIsConnected(false);

      // 先清理之前的状态
      await handleEndCall();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStream.current = stream;

      if (localAudioRef.current) {
        localAudioRef.current.srcObject = stream;
      }

      const pc = createPeerConnection();
      stream.getTracks().forEach(track => {
        if (pc && stream) {
          pc.addTrack(track, stream);
        }
      });

      try {
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: false
        });
        await pc.setLocalDescription(offer);

        // console.log('发起通话请求:', offer);
        socket?.emit('call_request', {
          target_id: friendId,
          sender_id: localStorage.getItem('userId'),
          caller_name: userName,
          type: 'voice',
          sdp: offer
        });

      } catch (error) {
        console.error('创建通话请求失败:', error);
        handleEndCall();
        message.error('创建通话请求失败');
      }


    } catch (error) {
      console.error('发起通话失败:', error);
      handleEndCall();
      message.error('发起通话失败');
    }
  };

  useEffect(() => {
    if (!socket) return;

    socket.on('call_request_sent', (data) => {
      // console.log('通话请求已发送', data);
      // 确保通话界面保持打开
      setIsOpen(true);
      message.success('通话请求已发送');
    });

    socket.on('call_received', async (data) => {
      console.log('收到通话请求:', data);  // 添加日志
      setCallerName(data.caller_name);
      // 保存远程 SDP
      if (data.sdp) {
        sessionStorage.setItem('incomingCallSDP', JSON.stringify(data.sdp));
      }
      setShowCallDialog(true);
    });

    socket.on('call_answered', async (data) => {
      try {
        if (peerConnection.current) {
          await peerConnection.current.setRemoteDescription(
            new RTCSessionDescription(data.sdp)
          );
          await processIceCandidatesQueue();  // 处理排队的ICE候选项
        }
        setIsConnected(true);
      } catch (error) {
        console.error('设置远程描述失败:', error);
        handleEndCall();
      }
    });

    socket.on('ice_candidate', async (data) => {
      if (!peerConnection.current) return;
      
      try {
        const candidate = new RTCIceCandidate(data.candidate);
        await addIceCandidate(candidate);
      } catch (error) {
        console.error('处理ICE候选项失败:', error);
      }
    });

    socket.on('call_rejected', () => {
      console.log('通话被拒绝');
      message.info('对方拒绝了通话');
      handleEndCall();
    });

    socket.on('call_ended', () => {
      console.log('通话结束');
      message.info('通话已结束');
      handleEndCall();
    });

    socket.on('call_error', (error) => {
      console.error('通话错误:', error);
      handleEndCall();
      message.error(error.message || '无法建立通话连接');
    });

    return () => {
      socket.off('call_request_sent');
      socket.off('call_received');
      socket.off('call_answered');
      socket.off('ice_candidate');
      socket.off('call_rejected');
      socket.off('call_ended');
      socket.off('call_error');
    };
  }, [socket, createPeerConnection]);

  const handleAcceptCall = async () => {
    try {
      const storedSDP = sessionStorage.getItem('incomingCallSDP');
      if (!storedSDP) {
        throw new Error('无效的通话数据');
      }

      const incomingSDP = JSON.parse(storedSDP);
      console.log('接受通话，使用SDP:', incomingSDP);

      setShowCallDialog(false);
      setIsOpen(true);
      setIsEnded(false);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStream.current = stream;

      if (localAudioRef.current) {
        localAudioRef.current.srcObject = stream;
      }

      const pc = createPeerConnection();
      stream.getTracks().forEach(track => {
        if (pc && stream) {
          pc.addTrack(track, stream);
        }
      });

      // 设置远程描述
      await pc.setRemoteDescription(new RTCSessionDescription(incomingSDP));
      
      // 创建应答
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // 处理之前缓存的ICE候选项
      await processIceCandidatesQueue();

      // 发送应答
      socket?.emit('call_answer', {
        target_id: friendId,
        sender_id: localStorage.getItem('userId'),
        sdp: answer
      });

      setIsConnected(true);
      
      // 清理存储的 SDP
      sessionStorage.removeItem('incomingCallSDP');
      
    } catch (error) {
      console.error('接受通话失败:', error);
      handleEndCall();
      message.error('无法建立通话连接');
    }
  };

  const handleRejectCall = () => {
    try {
      setShowCallDialog(false);
      socket?.emit('call_rejected', { 
        target_id: friendId,
        sender_id: localStorage.getItem('userId')
      });
      handleEndCall();  // 确保本地状态被清理
    } catch (error) {
      console.error('拒绝通话失败:', error);
    }
  };

  const handleEndCall = async () => {
    if (isEnded || !isOpen) return;

    try {
      setIsEnded(true);
      setIsOpen(false);
      setIsConnected(false);
      setShowCallDialog(false);
      setIsCaller(false);

      if (localStream.current) {
        localStream.current.getTracks().forEach(track => {
          track.stop();
        });
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

      if (!isEnded) {
        socket?.emit('call_ended', {
          target_id: friendId,
          sender_id: localStorage.getItem('userId')
        });
      }

      sessionStorage.removeItem('incomingCallSDP');

    } catch (error) {
      console.error('结束通话失败:', error);
    }
  };

  useEffect(() => {
    return () => {
      handleEndCall();
    };
  }, []);

  return (
    <>
      <IconButton onClick={handleCall} disabled={isOpen}>
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
          <Button onClick={handleAcceptCall} color="primary" autoFocus>
            接受
          </Button>
        </DialogActions>
      </Dialog>

      {isOpen && (
        <Draggable bounds="body" handle=".drag-handle">
        <Paper
          sx={{
            position: 'fixed',
            right: 20,
            bottom: 20,
            zIndex: 1300,
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
        </Draggable>)}    </>
  );
};

export default VoiceCall;