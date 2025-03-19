import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import PropTypes from 'prop-types';

// 청크 크기 (바이트)
const CHUNK_SIZE = 1024 * 1024; // 1MB

// 시간을 HH:MM:SS 형식으로 변환하는 함수
const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts = [];
    if (hrs > 0) {
        parts.push(hrs.toString().padStart(2, '0'));
    }
    parts.push(mins.toString().padStart(2, '0'));
    parts.push(secs.toString().padStart(2, '0'));

    return parts.join(':');
};

function AudioPreview({ fileInfo, fileUrl }) {
    const waveformRef = useRef(null);
    const wavesurfer = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        // WaveSurfer 인스턴스 생성
        wavesurfer.current = WaveSurfer.create({
            container: waveformRef.current,
            waveColor: '#4F4A85',
            progressColor: '#383351',
            height: 100,
            responsive: true,
            normalize: true,
            partialRender: true,
            barWidth: 2,
            barGap: 1,
            barRadius: 2,
            plugins: [],
        });

        // 이벤트 리스너 설정
        if (wavesurfer.current) {
            wavesurfer.current.on('ready', () => {
                setIsLoading(false);
                setDuration(wavesurfer.current.getDuration());
            });

            wavesurfer.current.on('audioprocess', (time) => {
                setCurrentTime(time);
            });

            wavesurfer.current.on('finish', () => {
                setIsPlaying(false);
            });

            wavesurfer.current.on('error', (err) => {
                setError(`오디오 파일을 로드하는 중 오류가 발생했습니다: ${err.message}`);
                setIsLoading(false);
            });

            // 대용량 파일 처리
            if (fileInfo.size > CHUNK_SIZE * 2) {
                loadAudioInChunks();
            } else {
                wavesurfer.current.load(fileUrl);
            }
        }

        return () => {
            if (wavesurfer.current) {
                wavesurfer.current.destroy();
            }
        };
    }, [fileUrl, fileInfo.size]);

    const loadAudioInChunks = async () => {
        try {
            const response = await fetch(fileUrl);
            if (!response.body) {
                throw new Error('ReadableStream not supported');
            }

            const reader = response.body.getReader();
            const contentLength = Number(response.headers.get('Content-Length'));
            let receivedLength = 0;
            const chunks = [];
            let reading = true;

            while (reading) {
                // eslint-disable-next-line no-await-in-loop
                const { done, value } = await reader.read();
                reading = !done;

                if (done) {
                    break;
                }

                chunks.push(value);
                receivedLength += value.length;

                // 일정 크기만큼 로드되면 파형 업데이트
                if (chunks.length === 1 || receivedLength === contentLength) {
                    const blob = new Blob(chunks, { type: fileInfo.mime_type });
                    if (wavesurfer.current) {
                        wavesurfer.current.loadBlob(blob);
                    }
                }
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다';
            setError(`파일 로딩 중 오류가 발생했습니다: ${errorMessage}`);
        }
    };

    const handlePlayPause = () => {
        if (wavesurfer.current) {
            wavesurfer.current.playPause();
            setIsPlaying(!isPlaying);
        }
    };

    if (error) {
        return (
            <div className='audio-preview__error'>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className='audio-preview__wrapper'>
            <div
                ref={waveformRef}
                className='audio-preview__waveform'
            />
            <div className='audio-preview__controls'>
                <button
                    className='audio-preview__play-button'
                    onClick={handlePlayPause}
                    disabled={isLoading}
                    type='button'
                    data-playing={isPlaying}
                    aria-label={isPlaying ? '일시정지' : '재생'}
                />
                <div className='audio-preview__time'>
                    <span className='audio-preview__time-current'>
                        {formatTime(currentTime)}
                    </span>
                    <span className='audio-preview__time-separator'>{' / '}</span>
                    <span className='audio-preview__time-total'>
                        {formatTime(duration)}
                    </span>
                </div>
                {isLoading && (
                    <div className='audio-preview__loading'>
                        <div className='audio-preview__loading-spinner'/>
                        <span>{'오디오를 불러오는 중...'}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

AudioPreview.propTypes = {
    fileInfo: PropTypes.shape({
        id: PropTypes.string,
        mime_type: PropTypes.string.isRequired,
        size: PropTypes.number.isRequired,
        link: PropTypes.string,
    }).isRequired,
    fileUrl: PropTypes.string.isRequired,
};

export default AudioPreview;