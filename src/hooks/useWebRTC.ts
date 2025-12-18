import { useEffect, useRef, useState } from 'react';
import { socketService } from '../services/socketService';

interface WebRTCProps {
    roomId: string;
    userId: number;
}

export function useWebRTC({ roomId, userId }: WebRTCProps) {
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);

    const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
    const configuration: RTCConfiguration = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
        ],
    };

    useEffect(() => {
        const socket = socketService.getSocket();
        if (!socket) return;

        // WebRTC signaling
        socket.on('webrtc:offer', handleReceiveOffer);
        socket.on('webrtc:answer', handleReceiveAnswer);
        socket.on('webrtc:ice-candidate', handleReceiveIceCandidate);
        socket.on('webrtc:user-joined', handleUserJoined);
        socket.on('webrtc:user-left', handleUserLeft);

        return () => {
            socket.off('webrtc:offer');
            socket.off('webrtc:answer');
            socket.off('webrtc:ice-candidate');
            socket.off('webrtc:user-joined');
            socket.off('webrtc:user-left');
            cleanup();
        };
    }, [roomId]);

    const startLocalStream = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });
            setLocalStream(stream);
            return stream;
        } catch (error) {
            console.error('Failed to get local stream:', error);
            throw error;
        }
    };

    const createPeerConnection = (peerId: string, stream: MediaStream) => {
        const pc = new RTCPeerConnection(configuration);

        // Add local tracks
        stream.getTracks().forEach(track => {
            pc.addTrack(track, stream);
        });

        // Handle remote stream
        pc.ontrack = (event) => {
            setRemoteStreams(prev => {
                const newMap = new Map(prev);
                newMap.set(peerId, event.streams[0]);
                return newMap;
            });
        };

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socketService.getSocket()?.emit('webrtc:ice-candidate', {
                    roomId,
                    peerId,
                    candidate: event.candidate,
                });
            }
        };

        peerConnections.current.set(peerId, pc);
        return pc;
    };

    const handleUserJoined = async ({ peerId }: { peerId: string }) => {
        if (!localStream) return;

        const pc = createPeerConnection(peerId, localStream);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socketService.getSocket()?.emit('webrtc:offer', {
            roomId,
            peerId,
            offer,
        });
    };

    const handleReceiveOffer = async ({ peerId, offer }: any) => {
        if (!localStream) return;

        const pc = createPeerConnection(peerId, localStream);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socketService.getSocket()?.emit('webrtc:answer', {
            roomId,
            peerId,
            answer,
        });
    };

    const handleReceiveAnswer = async ({ peerId, answer }: any) => {
        const pc = peerConnections.current.get(peerId);
        if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
        }
    };

    const handleReceiveIceCandidate = async ({ peerId, candidate }: any) => {
        const pc = peerConnections.current.get(peerId);
        if (pc) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
    };

    const handleUserLeft = ({ peerId }: { peerId: string }) => {
        const pc = peerConnections.current.get(peerId);
        if (pc) {
            pc.close();
            peerConnections.current.delete(peerId);
        }
        setRemoteStreams(prev => {
            const newMap = new Map(prev);
            newMap.delete(peerId);
            return newMap;
        });
    };

    const toggleVideo = () => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            videoTrack.enabled = !videoTrack.enabled;
            setIsVideoEnabled(videoTrack.enabled);
        }
    };

    const toggleAudio = () => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            audioTrack.enabled = !audioTrack.enabled;
            setIsAudioEnabled(audioTrack.enabled);
        }
    };

    const startScreenShare = async () => {
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
            });

            const screenTrack = screenStream.getVideoTracks()[0];

            // Replace video track for all peer connections
            peerConnections.current.forEach(pc => {
                const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                if (sender) {
                    sender.replaceTrack(screenTrack);
                }
            });

            screenTrack.onended = () => {
                stopScreenShare();
            };

            setIsScreenSharing(true);
        } catch (error) {
            console.error('Failed to start screen share:', error);
        }
    };

    const stopScreenShare = () => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];

            peerConnections.current.forEach(pc => {
                const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                if (sender) {
                    sender.replaceTrack(videoTrack);
                }
            });
        }
        setIsScreenSharing(false);
    };

    const cleanup = () => {
        localStream?.getTracks().forEach(track => track.stop());
        peerConnections.current.forEach(pc => pc.close());
        peerConnections.current.clear();
        setRemoteStreams(new Map());
    };

    const joinRoom = async () => {
        const stream = await startLocalStream();
        socketService.getSocket()?.emit('webrtc:join-room', { roomId, userId });
        return stream;
    };

    const leaveRoom = () => {
        socketService.getSocket()?.emit('webrtc:leave-room', { roomId });
        cleanup();
    };

    return {
        localStream,
        remoteStreams,
        isVideoEnabled,
        isAudioEnabled,
        isScreenSharing,
        joinRoom,
        leaveRoom,
        toggleVideo,
        toggleAudio,
        startScreenShare,
        stopScreenShare,
    };
}
