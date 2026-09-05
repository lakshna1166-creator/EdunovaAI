import React, { useRef, useState } from 'react';

import teacherVideo from '../../assets/teacher/teacher.mp4';
import thinkingVideo from '../../assets/teacher/thinking.mp4';
import celebrateVideo from '../../assets/teacher/celebrate.mp4';
import warningVideo from '../../assets/teacher/warning.mp4';
import educationVideo from '../../assets/teacher/education.mp4';
import ideaVideo from '../../assets/teacher/idea.mp4';
import questioningVideo from '../../assets/teacher/questioning.mp4';

const animations = {
    idle: teacherVideo,
    explaining: teacherVideo,
    teaching: teacherVideo,
    demonstrating: educationVideo,
    example: ideaVideo,
    questioning: questioningVideo,
    thinking: thinkingVideo,
    encouraging: celebrateVideo,
    correct: celebrateVideo,
    correcting: warningVideo,
    warning: warningVideo
};

const stateLabels = {
    idle: 'Ready to teach',
    explaining: 'Explaining...',
    teaching: 'Teaching...',
    demonstrating: 'Demonstrating...',
    example: 'Giving an example...',
    questioning: 'Asking a question...',
    thinking: 'Thinking...',
    encouraging: 'Great job!',
    correct: 'Correct!',
    correcting: 'Let me explain that differently...',
    warning: 'Let us check that again...'
};

export default function TeacherAnimation({
    state = 'idle',
    compact = false
}) {
    const video = animations[state] || teacherVideo;
    const label = stateLabels[state] || stateLabels.idle;

    if (compact) {
        const videoRef = useRef(null);
        const [isPlaying, setIsPlaying] = useState(true);

        const togglePlay = () => {
            if (!videoRef.current) return;

            if (videoRef.current.paused) {
                videoRef.current.play();
                setIsPlaying(true);
            } else {
                videoRef.current.pause();
                setIsPlaying(false);
            }
        };

        const toggleFullscreen = () => {
            if (!videoRef.current) return;

            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else if (videoRef.current.requestFullscreen) {
                videoRef.current.requestFullscreen();
            }
        };

        return (
            <div
                style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '18px',
                    padding: '18px',
                    boxShadow: 'var(--shadow-card)',
                    overflow: 'hidden',
                    display: 'flex',
                    justifyContent: 'center'
                }}
            >
                <div
                    style={{
                        position: 'relative',
                        width: '320px',
                        height: '260px',
                        background: '#F8FAFC',
                        borderRadius: '14px',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <video
                        ref={videoRef}
                        key={state}
                        src={video}
                        autoPlay
                        loop
                        muted
                        playsInline
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain'
                        }}
                    />

                    {/* Custom Controls */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '12px',
                            right: '12px',
                            display: 'flex',
                            gap: '8px'
                        }}
                    >
                        {/* Play / Pause */}
                        <button
                            type="button"
                            onClick={togglePlay}
                            aria-label={isPlaying ? 'Pause video' : 'Play video'}
                            style={{
                                width: '38px',
                                height: '38px',
                                border: 'none',
                                borderRadius: '10px',
                                background: 'rgba(15, 23, 42, 0.8)',
                                color: '#FFFFFF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                fontSize: '16px'
                            }}
                        >
                            {isPlaying ? '❚❚' : '▶'}
                        </button>

                        {/* Fullscreen */}
                        <button
                            type="button"
                            onClick={toggleFullscreen}
                            aria-label="Fullscreen"
                            style={{
                                width: '38px',
                                height: '38px',
                                border: 'none',
                                borderRadius: '10px',
                                background: 'rgba(15, 23, 42, 0.8)',
                                color: '#FFFFFF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                fontSize: '18px'
                            }}
                        >
                            ⛶
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '20px',
                padding: '20px',
                minHeight: '560px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-card)',
                overflow: 'hidden'
            }}
        >
            <div
                style={{
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    color: '#64748B',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: '14px'
                }}
            >
                AI Teacher
            </div>

            <div
                style={{
                    width: '100%',
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#F8FAFC',
                    borderRadius: '16px',
                    overflow: 'hidden'
                }}
            >
                <video
                    key={state}
                    src={video}
                    autoPlay
                    loop
                    muted
                    playsInline
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain'
                    }}
                />
            </div>

            <div
                style={{
                    marginTop: '16px',
                    padding: '10px 18px',
                    borderRadius: '999px',
                    background: '#EFF6FF',
                    color: '#2563EB',
                    fontSize: '0.88rem',
                    fontWeight: 700
                }}
            >
                {label}
            </div>
        </div>
    );
}