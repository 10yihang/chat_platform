import React from 'react';
import { IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import CallEndIcon from '@mui/icons-material/CallEnd';
import { useSocketContext } from '../contexts/SocketContextProvider';

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
  const { socket } = useSocketContext();

  const handleCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localVideoRef.current!.srcObject = stream;
      setIsOpen(true);
      
      socket?.emit('call_request', { 
        target_id: friendId,
        caller_name: userName,
        type: 'video' 
      });
    } catch (error) {
      console.error('获取视频失败:', error);
    }
  };

  return (
    <>
      <IconButton onClick={handleCall}>
        <VideocamIcon />
      </IconButton>

      <Dialog 
        open={isOpen} 
        onClose={() => setIsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>视频通话</DialogTitle>
        <DialogContent>
          <div style={{ display: 'flex', gap: '16px' }}>
            <video 
              ref={localVideoRef} 
              autoPlay 
              muted 
              style={{ width: '50%', backgroundColor: '#000' }} 
            />
            <video 
              ref={remoteVideoRef} 
              autoPlay 
              style={{ width: '50%', backgroundColor: '#000' }} 
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setIsOpen(false)} 
            color="error" 
            startIcon={<CallEndIcon />}
          >
            结束通话
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default VideoCall;