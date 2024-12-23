import React, { useRef, useState } from 'react';
import {MediaPlayerProps} from '../types';

const MediaPlayer: React.FC<MediaPlayerProps> = ({ src, type }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = () => {
    if (type === 'audio' && audioRef.current) {
      isPlaying ? audioRef.current.pause() : audioRef.current.play();
    } else if (type === 'video' && videoRef.current) {
      isPlaying ? videoRef.current.pause() : videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="media-player">
      {type === 'audio' ? (
        <audio ref={audioRef} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} controls>
          <source src={src} type="audio/mpeg" />
          Your browser does not support the audio element.
        </audio>
      ) : (
        <video ref={videoRef} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} controls>
          <source src={src} type="video/mp4" />
          Your browser does not support the video element.
        </video>
      )}
      <button onClick={handlePlay}>
        {isPlaying ? '暂停' : '播放'}
      </button>
    </div>
  );
};

export default MediaPlayer;