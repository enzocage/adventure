import React, { useState, useRef } from 'react';
import { Mic, Square, ArrowRight, Loader2 } from 'lucide-react';

interface TextInputProps {
  onSubmit: (text: string) => void;
  disabled: boolean;
}

export default function TextInput({ onSubmit, disabled }: TextInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (inputValue.trim() && !disabled && !isTranscribing) {
      onSubmit(inputValue.trim());
      setInputValue('');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Determine supported mimeType
      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/ogg';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/mp4';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = ''; // Let browser decide
      }

      const mediaRecorder = mimeType 
        ? new MediaRecorder(stream, { mimeType }) 
        : new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const recordedType = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: recordedType });
        
        // Convert Blob to Base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          try {
            const base64Audio = (reader.result as string).split(',')[1];
            setIsTranscribing(true);

            const response = await fetch('/api/transcribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audio: base64Audio, mimeType: recordedType }),
            });

            const data = await response.json();
            setIsTranscribing(false);

            if (data.text) {
              setInputValue(data.text);
            }
          } catch (err) {
            console.error('Failed to transcribe:', err);
            setIsTranscribing(false);
          }
        };

        // Stop all tracks to release hardware light
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Zugriff auf das Mikrofon wurde verweigert oder wird nicht unterstützt.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <form onSubmit={handleSend} className="w-full font-mono text-sm">
      <div className="flex items-center gap-2 border border-stone-800 bg-stone-950 p-2 rounded-sm shadow-md">
        
        {/* Record/Stop Button */}
        {isRecording ? (
          <button
            type="button"
            onClick={stopRecording}
            className="flex items-center justify-center h-10 w-10 bg-rose-950 hover:bg-rose-900 border border-rose-800 hover:border-rose-600 text-rose-400 rounded-sm cursor-pointer transition-all animate-pulse"
            title="Aufnahme stoppen"
          >
            <Square size={16} />
          </button>
        ) : (
          <button
            type="button"
            onClick={startRecording}
            disabled={disabled || isTranscribing}
            className={`flex items-center justify-center h-10 w-10 rounded-sm transition-all
              ${disabled || isTranscribing
                ? 'bg-stone-900 border border-stone-850 text-stone-600 cursor-not-allowed'
                : 'bg-stone-900 border border-stone-800 hover:border-amber-500/50 hover:text-amber-400 text-stone-400 cursor-pointer active:scale-95'
              }`}
            title="Per Sprache eingeben"
          >
            {isTranscribing ? <Loader2 size={16} className="animate-spin text-amber-500" /> : <Mic size={16} />}
          </button>
        )}

        {/* Text Input Field */}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={disabled || isRecording || isTranscribing}
          placeholder={
            isRecording 
              ? 'Nimmt Sprache auf... Drücke Stopp zum Übersetzen' 
              : isTranscribing 
              ? 'Wird transkribiert...' 
              : 'Was tust du? (z.B. "Zettel aufheben" oder freie Eingabe)...'
          }
          className={`flex-grow h-10 bg-transparent text-stone-100 placeholder-stone-600 px-2 outline-none border-none
            ${(isRecording || isTranscribing) ? 'italic text-stone-500 select-none' : ''}`}
        />

        {/* Submit Button */}
        <button
          type="submit"
          disabled={disabled || !inputValue.trim() || isRecording || isTranscribing}
          className={`flex items-center justify-center h-10 px-4 rounded-sm transition-all font-semibold uppercase tracking-wider gap-1
            ${disabled || !inputValue.trim() || isRecording || isTranscribing
              ? 'bg-stone-900 border border-stone-850 text-stone-600 cursor-not-allowed'
              : 'bg-amber-950 border border-amber-800 hover:border-amber-500 text-amber-400 hover:bg-stone-900 cursor-pointer active:scale-95'
            }`}
        >
          <span>Senden</span>
          <ArrowRight size={14} />
        </button>
      </div>
      
      {/* Feedback status row */}
      {(isRecording || isTranscribing) && (
        <div className="text-[10px] text-stone-500 mt-1 pl-2 flex items-center gap-2">
          <div className={`h-1.5 w-1.5 rounded-full ${isRecording ? 'bg-rose-500 animate-ping' : 'bg-amber-500 animate-pulse'}`} />
          <span>{isRecording ? 'Mikrofon aktiv: Sprich jetzt.' : 'Audio wird analysiert...'}</span>
        </div>
      )}
    </form>
  );
}
