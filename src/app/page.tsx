'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, FolderOpen, Play, CheckCircle } from 'lucide-react';

interface Session {
  id: string;
  date: string;
}

export default function Home() {
  const router = useRouter();
  const [sprache, setSprache] = useState<'de' | 'en'>('de');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch list of active sessions from server
  useEffect(() => {
    async function loadSessions() {
      try {
        const response = await fetch('/api/game');
        const data = await response.json();
        if (data.sessions) {
          setSessions(data.sessions);
        }
      } catch (err) {
        console.error('Failed to load sessions:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSessions();
  }, []);

  // Handle New Game start
  const handleNewGame = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'new_game', sprache }),
      });
      const data = await res.json();
      if (data.sessionId) {
        router.push(`/play?sessionId=${data.sessionId}`);
      }
    } catch (err) {
      console.error('Failed to start new game:', err);
      alert('Spielstart fehlgeschlagen.');
      setIsLoading(false);
    }
  };

  // Handle Load Session
  const handleLoadSession = (sessionId: string) => {
    router.push(`/play?sessionId=${sessionId}`);
  };

  return (
    <div className="flex min-h-screen bg-[#0C0B0A] text-stone-200 items-center justify-center p-4 font-mono relative overflow-hidden">
      
      {/* Background Graphic Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,#0C0B0A_90%)] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-2xl bg-stone-950 border border-stone-900 shadow-2xl p-6 md:p-12 relative rounded-sm">
        
        {/* Decorative Institutional Details */}
        <div className="absolute top-2 left-2 text-[8px] text-stone-700 tracking-widest">
          KVR-KL-MD // KONTROLLINSTANZ 2026
        </div>
        <div className="absolute top-2 right-2 text-[8px] text-stone-700 tracking-widest">
          STATUS: IN BEREITSCHAFT
        </div>

        {/* Heading Panel */}
        <div className="text-center my-6 md:my-10 border-b border-stone-900 pb-8">
          <h1 className="text-4xl md:text-5xl font-black tracking-widest text-[#EBE7DC] uppercase animate-pulse">
            Kaldermünd
          </h1>
          <p className="text-stone-500 text-xs md:text-sm mt-3 tracking-wide max-w-md mx-auto">
            {sprache === 'de' 
              ? 'Ein surreales Bürokratie-Rollenspiel an der Schwelle der absoluten Wahrheit.' 
              : 'A surreal bureaucratic RPG on the threshold of absolute truth.'}
          </p>
        </div>

        {/* Configuration Row */}
        <div className="mb-8 p-4 bg-stone-900/30 border border-stone-900 rounded-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-stone-500 text-xs block mb-1">
                {sprache === 'de' ? 'SYSTEMSPRACHE WÄHLEN' : 'CHOOSE SYSTEM LANGUAGE'}
              </span>
              <span className="text-stone-100 text-sm font-bold">
                {sprache === 'de' ? 'DEUTSCH (Nativ)' : 'ENGLISH (Native)'}
              </span>
            </div>
            
            {/* Language Switch Button */}
            <div className="flex gap-2">
              <button
                onClick={() => setSprache('de')}
                className={`px-4 py-1.5 text-xs font-bold border transition-all cursor-pointer rounded-sm outline-none
                  ${sprache === 'de' 
                    ? 'border-amber-900 bg-amber-950/30 text-amber-400' 
                    : 'border-stone-800 text-stone-500 hover:text-stone-300'}`}
              >
                DEUTSCH
              </button>
              <button
                onClick={() => setSprache('en')}
                className={`px-4 py-1.5 text-xs font-bold border transition-all cursor-pointer rounded-sm outline-none
                  ${sprache === 'en' 
                    ? 'border-amber-900 bg-amber-950/30 text-amber-400' 
                    : 'border-stone-800 text-stone-500 hover:text-stone-300'}`}
              >
                ENGLISH
              </button>
            </div>
          </div>
        </div>

        {/* Actions Block */}
        <div className="flex flex-col gap-6">
          
          {/* Start New Game Button */}
          <button
            onClick={handleNewGame}
            disabled={isLoading}
            className="flex items-center justify-center gap-3 w-full bg-stone-900 hover:bg-stone-900/60 border border-stone-800 hover:border-amber-500/50 text-stone-200 hover:text-amber-400 font-bold py-4 px-6 rounded-sm cursor-pointer transition-all active:scale-[0.99] outline-none"
          >
            <Play size={18} />
            <span>
              {sprache === 'de' ? 'NEUES ABENTEUER BEGINNEN' : 'START NEW ADVENTURE'}
            </span>
          </button>

          {/* Load Game Section */}
          <div className="border-t border-stone-900 pt-6">
            <h3 className="text-stone-500 text-xs tracking-wider mb-4 flex items-center gap-2">
              <FolderOpen size={14} />
              <span>
                {sprache === 'de' ? 'GESPEICHERTE SITZUNGEN' : 'SAVED SESSIONS'}
              </span>
            </h3>

            {isLoading ? (
              <div className="text-center py-6 text-stone-600 text-xs animate-pulse">
                {sprache === 'de' ? 'Akten werden sortiert...' : 'Sorting folders...'}
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-stone-900 rounded-sm text-stone-600 text-xs">
                {sprache === 'de' 
                  ? 'Keine vorherigen Berichte gefunden. Reiche Formular G-14b ein.' 
                  : 'No previous records found. Submit form G-14b.'}
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                {sessions.map((sess) => (
                  <button
                    key={sess.id}
                    onClick={() => handleLoadSession(sess.id)}
                    className="flex justify-between items-center w-full border border-stone-900 bg-stone-950 hover:bg-stone-900 hover:border-stone-800 px-4 py-3 text-left transition-all rounded-sm cursor-pointer text-xs group outline-none"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-stone-300 font-semibold group-hover:text-amber-400 transition-colors">
                        {sess.id}
                      </span>
                      <span className="text-stone-600 text-[10px]">
                        {sess.date}
                      </span>
                    </div>
                    <span className="text-stone-600 group-hover:text-amber-500 transition-colors">
                      {sprache === 'de' ? 'Laden ➔' : 'Load ➔'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer legalities */}
        <div className="mt-12 text-center text-[10px] text-stone-700 leading-relaxed border-t border-stone-900 pt-6">
          <p>
            {sprache === 'de' 
              ? 'WICHTIGER HINWEIS: Alle Entscheidungen sind endgültig. Der Spielleiter haftet nicht für Lügenüberlastungen, Stille-Zonen-Einfrierungen oder unauffindbare Büros.' 
              : 'IMPORTANT NOTICE: All decisions are final. The Game Master is not responsible for lie resonance overload, silent zone stasis, or misplaced office numbers.'}
          </p>
        </div>
      </div>
    </div>
  );
}
