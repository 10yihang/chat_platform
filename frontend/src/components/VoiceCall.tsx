import React from 'react';
import { IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import CallIcon from '@mui/icons-material/Call';
import CallEndIcon from '@mui/icons-material/CallEnd';
import { useSocketContext } from '../contexts/SocketContextProvider';

interface VoiceCallProps {
  friendId?: string;
  groupId?: string;
  userName?: string;
}

const VoiceCall: React.FC<VoiceCallProps> = ({ friendId, userName, groupId }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isConnected, setIsConnected] = React.useState(false);
  const localAudioRef = React.useRef<HTMLAudioElement>(null);
  const remoteAudioRef = React.useRef<HTMLAudioElement>(null);
  const peerConnection = React.useRef<RTCPeerConnection | null>(null);
  const { socket} = useSocketContext();

  const handleCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localAudioRef.current!.srcObject = stream;
      setIsOpen(true);
      
      socket?.emit('call_request', { 
        target_id: friendId,
        caller_name: userName,
        type: 'voice' 
      });
    } catch (error) {
      console.error('获取音频失败:', error);
    }
  };

  return (
    <>
      <IconButton onClick={handleCall}>
        <CallIcon />
      </IconButton>

      <Dialog open={isOpen} onClose={() => setIsOpen(false)}>
        <DialogTitle>语音通话</DialogTitle>
        <DialogContent>
          <audio ref={localAudioRef} autoPlay muted />
          <audio ref={remoteAudioRef} autoPlay />
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

export default VoiceCall;