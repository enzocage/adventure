import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface AudioPlayerProps {
  track: 'normal' | 'drone' | 'silent' | 'piano' | 'percussion' | 'city' | null;
}

export default function AudioPlayer({ track }: AudioPlayerProps) {
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(0.25); // Default to 25% volume
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
    audio.volume = volume;
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

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
    }
  };

  return (
    <div className="relative flex flex-col items-center">
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

      {/* Volume Slider dropdown, only shown when unmuted */}
      {!isMuted && (
        <div className="absolute top-full right-0 mt-1 p-2 bg-stone-950/95 border border-stone-850 rounded-sm shadow-2xl flex items-center gap-2 z-30 select-none animate-fadeIn w-36 lg:w-44">
          <span className="text-[8px] text-stone-500 font-bold tracking-wider font-mono">VOL:</span>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.05" 
            value={volume} 
            onChange={handleVolumeChange}
            className="flex-grow h-1 bg-stone-900 rounded-sm appearance-none cursor-pointer accent-amber-500 focus:outline-none"
            style={{
              WebkitAppearance: 'none',
              background: '#2E2C27'
            }}
          />
          <span className="text-[9px] text-amber-500 font-bold w-6 text-right font-mono">
            {Math.round(volume * 100)}%
          </span>
        </div>
      )}
    </div>
  );
}
