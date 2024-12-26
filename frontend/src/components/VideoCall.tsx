import React from 'react';
import { IconButton, Button, Typography, Box } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import CallEndIcon from '@mui/icons-material/CallEnd';
import { useSocketContext } from '../contexts/SocketContextProvider';
import Draggable from 'react-draggable';
import { Paper } from '@mui/material';

interface VideoCallProps {
  friendId?: string;
  groupId?: string;
  userName?: string;
}

const VideoCall: React.FC<VideoCallProps> = ({friendId, userName, groupId }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isConnected, setIsConnected] = React.useState(false);
  const localVideoRef = React.useRef<HTMLVideoElement>(null);
  const remoteVideoRef = React.useRef<HTMLVideoElement>(null);
  const peerConnection = React.useRef<RTCPeerConnection | null>(null);
  const localStream = React.useRef<MediaStream|null>(null);
  const { socket } = useSocketContext();

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    peerConnection.current = pc;
    return pc;
  };

  const handleCall = async () => {
    try {
      setIsOpen(true);
      const pc = createPeerConnection();
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStream.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      const offer = await pc.createOffer({ offerToReceiveVideo: true, offerToReceiveAudio: true });
      await pc.setLocalDescription(offer);

      // 仅发起 video_call_request
      socket?.emit('video_call_request', {
        target_id: friendId,
        sender_id: localStorage.getItem('userId'),
        caller_name: userName,
        type: 'video',
        sdp: offer
      });
    } catch (error) {
      console.error('获取视频或创建通话请求失败:', error);
    }
  };

  React.useEffect(() => {
    if (!socket) return;

    socket.on('video_call_received', async (data) => {
      // ...existing code...
    });

    socket.on('video_call_answered', async (data) => {
      // ...existing code...
    });

    socket.on('video_ice_candidate', async (data) => {
      // ...existing code...
    });

    socket.on('video_call_rejected', () => {
      // ...existing code...
    });

    socket.on('video_call_ended', () => {
      // ...existing code...
    });

    return () => {
      socket.off('video_call_received');
      socket.off('video_call_answered');
      socket.off('video_ice_candidate');
      socket.off('video_call_rejected');
      socket.off('video_call_ended');
    };
  }, [socket]);

  const handleEndCall = () => {
    setIsOpen(false);
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop());
      localStream.current = null;
    }
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    socket?.emit('video_call_ended', {
      target_id: friendId,
      sender_id: localStorage.getItem('userId')
    });
  };

  return (
    <>
      <IconButton onClick={handleCall}>
        <VideocamIcon />
      </IconButton>

      {isOpen && (
        <Draggable bounds="body" handle=".drag-handle">
          <Paper
            sx={{
              position: 'fixed',
              right: 20,
              bottom: 20,
              zIndex: 1300,
              width: 400,
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
              <Typography>视频通话</Typography>
              <IconButton size="small" onClick={handleEndCall} sx={{ color: 'white' }}>
                <CallEndIcon />
              </IconButton>
            </Box>
            <Box sx={{ p: 2, display: 'flex', gap: '16px' }}>
              <video ref={localVideoRef} autoPlay muted style={{ width: '50%', backgroundColor: '#000' }} />
              <video ref={remoteVideoRef} autoPlay style={{ width: '50%', backgroundColor: '#000' }} />
            </Box>
          </Paper>
        </Draggable>
      )}
    </>
  );
};

export default VideoCall;