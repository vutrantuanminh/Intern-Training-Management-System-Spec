import { useEffect, useRef } from 'react';
import { useWebRTC } from '../hooks/useWebRTC';

interface VideoCallProps {
    roomId: string;
    userId: number;
    onLeave: () => void;
}

export function VideoCall({ roomId, userId, onLeave }: VideoCallProps) {
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideosRef = useRef<Map<string, HTMLVideoElement>>(new Map());

    const {
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
    } = useWebRTC({ roomId, userId });

    useEffect(() => {
        joinRoom();
        return () => leaveRoom();
    }, []);

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    const handleLeave = () => {
        leaveRoom();
        onLeave();
    };

    return (
        <div className="fixed inset-0 bg-gray-900 z-50">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/50 to-transparent z-10">
                <div className="flex items-center justify-between">
                    <h1 className="text-white text-xl font-semibold">Video Call</h1>
                    <button
                        onClick={handleLeave}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                        Leave Call
                    </button>
                </div>
            </div>

            {/* Video Grid */}
            <div className="h-full p-4 pt-20 pb-24">
                <div className={`grid gap-4 h-full ${remoteStreams.size === 0 ? 'grid-cols-1' :
                    remoteStreams.size === 1 ? 'grid-cols-2' :
                        remoteStreams.size <= 4 ? 'grid-cols-2 grid-rows-2' :
                            'grid-cols-3 grid-rows-3'
                    }`}>
                    {/* Local Video */}
                    <div className="relative bg-gray-800 rounded-lg overflow-hidden">
                        <video
                            ref={localVideoRef}
                            autoPlay
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-2 left-2 bg-black/50 px-3 py-1 rounded-full text-white text-sm">
                            You {!isVideoEnabled && '(Video Off)'}
                        </div>
                    </div>

                    {/* Remote Videos */}
                    {Array.from(remoteStreams.entries()).map(([peerId, stream]) => (
                        <RemoteVideo key={peerId} peerId={peerId} stream={stream} />
                    ))}
                </div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/50 to-transparent">
                <div className="flex items-center justify-center gap-4">
                    <button
                        onClick={toggleAudio}
                        className={`p-4 rounded-full ${isAudioEnabled ? 'bg-gray-700' : 'bg-red-600'
                            } hover:opacity-80`}
                    >
                        {isAudioEnabled ? (
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                            </svg>
                        )}
                    </button>

                    <button
                        onClick={toggleVideo}
                        className={`p-4 rounded-full ${isVideoEnabled ? 'bg-gray-700' : 'bg-red-600'
                            } hover:opacity-80`}
                    >
                        {isVideoEnabled ? (
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                        )}
                    </button>

                    <button
                        onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                        className={`p-4 rounded-full ${isScreenSharing ? 'bg-blue-600' : 'bg-gray-700'
                            } hover:opacity-80`}
                    >
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}

function RemoteVideo({ peerId, stream }: { peerId: string; stream: MediaStream }) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <div className="relative bg-gray-800 rounded-lg overflow-hidden">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-black/50 px-3 py-1 rounded-full text-white text-sm">
                User {peerId}
            </div>
        </div>
    );
}
