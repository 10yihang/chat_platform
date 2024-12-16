import React from 'react';
import Chat from '../components/Chat';
import FileUpload from '../components/FileUpload';
import MediaPlayer from '../components/MediaPlayer';
import VideoCall from '../components/VideoCall';

const Room: React.FC = () => {
  return (
    <div className="room">
      <Chat />
      <FileUpload />
      <MediaPlayer src="" type="video" />
      <VideoCall />
    </div>
  );
};

export default Room;