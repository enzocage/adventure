import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface AudioPlayerProps {
  track: 'normal' | 'drone' | 'silent' | 'piano' | 'percussion' | 'city' | null;
}

export default function AudioPlayer({ track }: AudioPlayerProps) {
  const [isMuted, setIsMuted] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
  };

  const playTrack = (trackName: string) => {
    if (isMuted) return;

    stopAudio();

    if (trackName === 'silent') return;

    console.log(`Loading static background loop for track: "${trackName}"`);
    const url = `/assets/musik/${trackName}.mp3`;
    const audio = new Audio(url);
    audio.loop = true;
    audio.volume = 0.25; // Safe low background volume
    audioRef.current = audio;

    audio.play().catch(err => {
      console.warn('Autoplay prevented or failed:', err);
    });
  };

  // React to mute toggle
  useEffect(() => {
    if (isMuted) {
      stopAudio();
    } else {
      playTrack(track || 'normal');
    }
    return () => stopAudio();
  }, [isMuted]);

  // React to track change
  useEffect(() => {
    if (!isMuted) {
      playTrack(track || 'normal');
    }
  }, [track]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopAudio();
  }, []);

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <button
      onClick={toggleMute}
      className={`flex items-center gap-2 px-3 py-1.5 border font-mono text-xs rounded-sm transition-all cursor-pointer select-none outline-none
        ${isMuted 
          ? 'border-stone-800 bg-stone-950 text-stone-500 hover:text-stone-300 hover:border-stone-600' 
          : 'border-amber-900 bg-amber-950/40 text-amber-400 hover:bg-amber-900/50 hover:border-amber-700 animate-pulse'}`}
      title={isMuted ? 'Musik einschalten' : 'Stummschalten'}
    >
      {isMuted ? (
        <>
          <VolumeX size={14} />
          <span>SOUND OUT [ OFF ]</span>
        </>
      ) : (
        <>
          <Volume2 size={14} />
          <span>SOUND ACTIVE [ { (track || 'normal').toUpperCase() } ]</span>
        </>
      )}
    </button>
  );
}
