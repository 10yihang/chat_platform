import React from 'react';
import Chat from '../components/Chat';
import FileUpload from '../components/FileUpload';
import MediaPlayer from '../components/MediaPlayer';
import VideoCall from '../components/VideoCall';

const Home: React.FC = () => {
  return (
    <div className="home">
      <Chat />
      <FileUpload />
      <MediaPlayer src="" type="video" />
      <VideoCall />
    </div>
  );
};

export default Home;