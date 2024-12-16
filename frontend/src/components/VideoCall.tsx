import React, { useEffect, useRef } from 'react';

const VideoCall: React.FC = () => {
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

    useEffect(() => {
        const initVideoCall = async () => {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            peerConnectionRef.current = new RTCPeerConnection();
            stream.getTracks().forEach(track => {
                peerConnectionRef.current?.addTrack(track, stream);
            });

            peerConnectionRef.current.onicecandidate = (event) => {
                if (event.candidate) {
                    // Send the candidate to the remote peer
                }
            };

            peerConnectionRef.current.ontrack = (event) => {
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = event.streams[0];
                }
            };
        };

        initVideoCall();

        return () => {
            peerConnectionRef.current?.close();
        };
    }, []);

    return (
        <div>
            <h2>视频通话</h2>
            <video ref={localVideoRef} autoPlay muted />
            <video ref={remoteVideoRef} autoPlay />
        </div>
    );
};

export default VideoCall;