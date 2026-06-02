'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BookOpen, HelpCircle, Shield, Briefcase, Users, FileText, ArrowLeft, RefreshCw, Dices, CheckCircle } from 'lucide-react';
import { GameState, PlayerStatus } from '@/lib/saveSystem';
import { rollD100, RollResult } from '@/lib/diceRoller';
import SceneImage from '@/components/SceneImage';
import NarratorText from '@/components/NarratorText';
import ActionButtons from '@/components/ActionButtons';
import TextInput from '@/components/TextInput';
import AudioPlayer from '@/components/AudioPlayer';

function PlayContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [narrationText, setNarrationText] = useState('');
  const [buttons, setButtons] = useState<string[]>([]);
  const [musicTrack, setMusicTrack] = useState<'normal' | 'drone' | 'silent' | 'piano' | null>(null);
  const [imagePrompt, setImagePrompt] = useState<string | null>(null);

  // Dice rolling state
  const [isRollPending, setIsRollPending] = useState(false);
  const [pendingRollType, setPendingRollType] = useState<'normal' | 'luegengehoer' | 'luegen' | 'kampf' | null>(null);
  const [pendingRollGoal, setPendingRollGoal] = useState<string | null>(null);
  const [diceResult, setDiceResult] = useState<RollResult | null>(null);
  const [lastAction, setLastAction] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'inventory' | 'quests' | 'npcs' | 'weltstand'>('inventory');
  const [showSpielerblatt, setShowSpielerblatt] = useState(false);

  // TTS State & Helper
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  const speakText = (text: string, lang: 'de' | 'en') => {
    if (typeof window === 'undefined') return;

    // Stop and cancel any existing audio playing
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current.src = '';
      activeAudioRef.current = null;
    }

    // Strip Markdown notations
    const cleanText = text
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/_/g, '')
      .replace(/^>\s+/gm, '') // Strip blockquotes
      .trim();

    if (!cleanText) return;

    // Create a new Audio element pointing to our /api/tts endpoint
    const url = `/api/tts?text=${encodeURIComponent(cleanText)}&lang=${lang}`;
    const audio = new Audio(url);
    audio.volume = 1.0;
    
    activeAudioRef.current = audio;
    audio.play().catch(err => {
      console.warn('Failed to play TTS audio. User interaction might be required:', err);
    });
  };

  const toggleTts = () => {
    if (isTtsEnabled) {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current.src = '';
        activeAudioRef.current = null;
      }
    } else if (narrationText) {
      speakText(narrationText, gameState?.status.sprache || 'de');
    }
    setIsTtsEnabled(!isTtsEnabled);
  };

  // Trigger TTS narration on text update
  useEffect(() => {
    if (isTtsEnabled && narrationText && !isLoading && gameState) {
      speakText(narrationText, gameState.status.sprache || 'de');
    }
  }, [narrationText, isTtsEnabled, isLoading]);

  // Stop speaking on unmount
  useEffect(() => {
    return () => {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current.src = '';
        activeAudioRef.current = null;
      }
    };
  }, []);

  // Load game on start
  useEffect(() => {
    if (!sessionId) {
      router.push('/');
      return;
    }
    
    async function initGame() {
      try {
        setIsLoading(true);
        // 1. Load session state from disk
        const loadRes = await fetch('/api/game', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'load_game', sessionId }),
        });
        const loadData = await loadRes.json();
        
        if (loadData.error) {
          router.push('/');
          return;
        }

        const state: GameState = loadData.state;
        setGameState(state);

        // 2. Check if this is a fresh game or existing
        const isFresh = state.protokoll.trim() === '# Spielprotokoll' || state.protokoll.length < 30;

        if (isFresh) {
          // Trigger the initial Spielstart.md load
          const triggerAction = state.status.sprache === 'en' ? 'Start' : 'Starten';
          await submitAction(triggerAction, state);
        } else {
          // Send a resume action to let the GM write a quick transition
          const resumeAction = state.status.sprache === 'en' 
            ? 'Resume game and summarize current situation in 2 sentences' 
            : 'Führe das Spiel fort und beschreibe die aktuelle Szene kurz in 2 Sätzen';
          await submitAction(resumeAction, state);
        }
      } catch (err) {
        console.error('Error starting game:', err);
      } finally {
        setIsLoading(false);
      }
    }

    initGame();
  }, [sessionId]);

  // Submit action to the API
  const submitAction = async (actionText: string, currentGameState?: GameState, roll?: RollResult) => {
    const stateToUse = currentGameState || gameState;
    if (!stateToUse || !sessionId) return;

    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current.src = '';
      activeAudioRef.current = null;
    }

    setIsLoading(true);
    setLastAction(actionText);

    try {
      const res = await fetch('/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: roll ? 'dice_roll' : 'play_action',
          sessionId,
          playerAction: actionText,
          diceResult: roll ? {
            baseRoll: roll.baseRoll,
            modifier: roll.modifier,
            finalScore: roll.finalScore,
            category: roll.category,
          } : undefined,
        }),
      });

      const data = await res.json();
      if (data.error) {
        alert(`Error: ${data.error}`);
        setIsLoading(false);
        return;
      }

      const gmRes = data.gmResponse;

      if (gmRes.bild_prompt) {
        setImagePrompt(gmRes.bild_prompt);
      }
      if (gmRes.musik_wechsel) {
        setMusicTrack(gmRes.musik_track);
      }

      if (gmRes.wuerfel_noetig) {
        // Roll required! Set pending state
        setNarrationText(gmRes.narration);
        setPendingRollType(gmRes.wuerfel_typ || 'normal');
        setPendingRollGoal(gmRes.wuerfel_ziel || 'Aktion');
        setButtons([]);
        setIsRollPending(true);
        setDiceResult(null);
      } else {
        // Normal update
        setNarrationText(gmRes.narration);
        setButtons(gmRes.neue_buttons || []);
        setIsRollPending(false);
        setDiceResult(null);
      }

      if (data.state) {
        setGameState(data.state);
      }
    } catch (err) {
      console.error('Failed to submit action:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Perform d100 roll check on client side
  const handleRollDice = () => {
    if (!gameState || !pendingRollType) return;
    
    // Check if ally is helping
    const isAllyHelping = false; // Could check from game state later
    
    const result = rollD100(
      pendingRollType,
      gameState.status.lp,
      isAllyHelping
    );
    setDiceResult(result);
  };

  // Submit rolled check outcome back to Game Master
  const handleDiceRollContinue = () => {
    if (!diceResult) return;
    submitAction(lastAction, gameState || undefined, diceResult);
  };  if (!gameState) {
    return (
      <div className="flex min-h-screen bg-[#0C0B0A] text-stone-200 items-center justify-center font-mono">
        <div className="text-center space-y-4">
          <RefreshCw size={24} className="animate-spin text-amber-500 mx-auto" />
          <div className="text-xs text-stone-500 tracking-widest uppercase">Aktenstapel wird geholt...</div>
        </div>
      </div>
    );
  }

  const sprache = gameState.status.sprache;

  return (
    <div className="h-screen max-h-screen overflow-hidden flex flex-col bg-[#0C0B0A] text-stone-200 font-mono relative">
      {/* Screen Grid Graphic Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.008)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.008)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* Scanline loading indicator at top of screen */}
      {isLoading && (
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-stone-950 overflow-hidden z-30 pointer-events-none">
          <div className="h-full bg-gradient-to-r from-transparent via-amber-500 to-transparent w-1/3 animate-scanline shadow-[0_0_10px_#f59e0b]" />
        </div>
      )}

      {/* Transparent Overlay Header */}
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between gap-3 p-3 bg-gradient-to-b from-[#0C0B0A] via-[#0C0B0A]/85 to-transparent border-b border-transparent pointer-events-auto">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push('/')}
            className="flex items-center gap-1.5 px-2 py-1 text-[10px] border border-stone-800 bg-stone-900/50 text-stone-500 hover:text-stone-300 hover:border-stone-600 rounded-sm transition-all cursor-pointer"
            title="Zurück zum Hauptmenü"
          >
            <ArrowLeft size={10} />
            <span>MENÜ</span>
          </button>
          <span className="text-stone-850">|</span>
          <span className="text-xs font-bold tracking-widest text-[#EBE7DC] uppercase truncate max-w-[90px] sm:max-w-none">Kaldermünd</span>
          
          <span className="text-stone-850">|</span>
          {/* Compact Header LP Bar */}
          <div className="flex items-center gap-1.5 select-none" title="Lebenspunkte (LP)">
            <span className="text-[9px] text-stone-500 font-semibold">LP:</span>
            <span className={`text-[10px] font-bold ${gameState.status.lp < 20 ? 'text-rose-500 animate-pulse' : gameState.status.lp < 50 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {gameState.status.lp}
            </span>
            <div className="h-1.5 w-10 bg-stone-950 border border-stone-850 rounded-sm overflow-hidden p-[1px] hidden min-[360px]:block">
              <div 
                className={`h-full transition-all duration-500 ease-out ${
                  gameState.status.lp < 20 ? 'bg-rose-600 animate-pulse' : gameState.status.lp < 50 ? 'bg-amber-500' : 'bg-emerald-600'
                }`}
                style={{ width: `${gameState.status.lp}%` }}
              />
            </div>
          </div>

          {isLoading && (
            <>
              <span className="text-stone-850">|</span>
              <div className="flex sm:hidden items-center gap-1 px-1.5 py-0.5 border border-amber-600/50 bg-amber-950/30 rounded-sm animate-pulse">
                <span className="h-1.5 w-1.5 bg-amber-500 rounded-full animate-ping shrink-0" />
                <span className="text-[8px] font-bold text-amber-400 tracking-wider uppercase whitespace-nowrap">
                  {sprache === 'de' ? 'PRÜFT...' : 'THINKING...'}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Compact center status information */}
        <div className="hidden sm:flex items-center gap-4 text-[10px] text-stone-500">
          {isLoading ? (
            <div className="flex items-center gap-2 px-3 py-1 border border-amber-600 bg-amber-950/40 rounded-sm animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.25)]">
              <span className="h-2 w-2 bg-amber-500 rounded-full animate-ping shrink-0" />
              <span className="text-[10px] font-bold text-amber-400 tracking-[0.2em] uppercase">
                {sprache === 'de' ? 'KVR BEHÖRDE PRÜFT AKTENLAGE...' : 'KVR PROCESSING INVESTIGATION...'}
              </span>
            </div>
          ) : (
            <>
              <div className="hidden md:flex items-center gap-1.5">
                <span className="font-semibold text-stone-600">ORT:</span>
                <span className="text-stone-300 uppercase truncate max-w-[120px] lg:max-w-[200px]">{gameState.status.location}</span>
              </div>
              <div className="hidden lg:flex items-center gap-1.5">
                <span className="font-semibold text-stone-600">ZEIT:</span>
                <span className="text-stone-300">{gameState.status.time}</span>
              </div>
              
              <div className="relative group flex items-center gap-1.5 px-2 py-0.5 border border-stone-850 bg-stone-950/40 rounded-sm select-none cursor-help">
                <span className="font-semibold text-stone-600">TOKENS:</span>
                <span className="text-amber-500 font-bold">
                  {(gameState.status.totalInputTokens || 0) + (gameState.status.totalOutputTokens || 0)}
                </span>
                <span className="text-stone-800">|</span>
                <span className="font-semibold text-stone-600">KOSTEN:</span>
                <span className="text-emerald-500 font-bold text-[9px]">
                  ${(gameState.status.totalCost || 0).toFixed(4)}
                </span>

                {/* Detailliertes Tooltip für Token- und Kostenaufschlüsselung */}
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-50 w-72 p-3.5 bg-stone-950/95 border border-stone-800 text-stone-300 rounded-sm shadow-2xl font-mono text-[9px] backdrop-blur-sm max-h-[80vh] overflow-y-auto">
                  <div className="text-amber-500 font-bold border-b border-stone-850 pb-1.5 mb-2.5 uppercase text-center tracking-wider text-[10px]">
                    {sprache === 'de' ? 'Kosten-Aufschlüsselung' : 'Cost Breakdown'}
                  </div>
                  
                  <div className="space-y-2.5">
                    {/* Spielleiter text */}
                    <div>
                      <div className="flex justify-between font-bold text-stone-200 uppercase tracking-wide text-[8px] text-amber-500/80 mb-0.5">
                        <span>1. Spielleiter (Gemini 2.5 Flash)</span>
                      </div>
                      <div className="flex justify-between text-stone-400 pl-2">
                        <span>Tokens (In/Out):</span>
                        <span>
                          {gameState.status.statsSpielleiterInputTokens || 0} / {gameState.status.statsSpielleiterOutputTokens || 0}
                        </span>
                      </div>
                      <div className="flex justify-between text-emerald-600 font-semibold pl-2">
                        <span>Kosten / Cost:</span>
                        <span>${(gameState.status.statsSpielleiterCost || 0).toFixed(6)}</span>
                      </div>
                    </div>

                    <div className="border-t border-stone-850/30 my-1" />

                    {/* Spracheingabe */}
                    <div>
                      <div className="flex justify-between font-bold text-stone-200 uppercase tracking-wide text-[8px] text-amber-500/80 mb-0.5">
                        <span>2. Spracheingabe (Gemini 2.5 Flash)</span>
                      </div>
                      <div className="flex justify-between text-stone-400 pl-2">
                        <span>Tokens (In/Out):</span>
                        <span>
                          {gameState.status.statsTranskriptionInputTokens || 0} / {gameState.status.statsTranskriptionOutputTokens || 0}
                        </span>
                      </div>
                      <div className="flex justify-between text-emerald-600 font-semibold pl-2">
                        <span>Kosten / Cost:</span>
                        <span>${(gameState.status.statsTranskriptionCost || 0).toFixed(6)}</span>
                      </div>
                    </div>

                    <div className="border-t border-stone-850/30 my-1" />

                    {/* Szenengenerator */}
                    <div>
                      <div className="flex justify-between font-bold text-stone-200 uppercase tracking-wide text-[8px] text-amber-500/80 mb-0.5">
                        <span>3. Szenengenerator (Gemini 2.5 Flash)</span>
                      </div>
                      <div className="flex justify-between text-stone-400 pl-2">
                        <span>Tokens (In/Out):</span>
                        <span>
                          {gameState.status.statsSzenenGenInputTokens || 0} / {gameState.status.statsSzenenGenOutputTokens || 0}
                        </span>
                      </div>
                      <div className="flex justify-between text-emerald-600 font-semibold pl-2">
                        <span>Kosten / Cost:</span>
                        <span>${(gameState.status.statsSzenenGenCost || 0).toFixed(6)}</span>
                      </div>
                    </div>

                    <div className="border-t border-stone-850/30 my-1" />

                    {/* Bilder */}
                    <div>
                      <div className="flex justify-between font-bold text-stone-200 uppercase tracking-wide text-[8px] text-amber-500/80 mb-0.5">
                        <span>4. Bild-Generierung (Imagen 4.0)</span>
                      </div>
                      <div className="flex justify-between text-stone-400 pl-2">
                        <span>Bilder-Anzahl / Count:</span>
                        <span>{gameState.status.statsBilderCount || 0}</span>
                      </div>
                      <div className="flex justify-between text-emerald-600 font-semibold pl-2">
                        <span>Kosten / Cost:</span>
                        <span>${(gameState.status.statsBilderCost || 0).toFixed(4)}</span>
                      </div>
                    </div>

                    <div className="border-t border-stone-850/30 my-1" />

                    {/* Musik */}
                    <div>
                      <div className="flex justify-between font-bold text-stone-200 uppercase tracking-wide text-[8px] text-amber-500/80 mb-0.5">
                        <span>5. Musik (Ambient Loops)</span>
                      </div>
                      <div className="flex justify-between text-stone-400 pl-2">
                        <span>Vibe-Wechsel / Changes:</span>
                        <span>{gameState.status.statsMusikCount || 0}</span>
                      </div>
                      <div className="flex justify-between text-emerald-600 font-semibold pl-2">
                        <span>Kosten / Cost:</span>
                        <span>$0.0000</span>
                      </div>
                    </div>

                    <div className="border-t border-stone-800 pt-2 mt-2 flex justify-between font-bold text-stone-100 text-[10px] border-double border-t-2">
                      <span>Gesamt / Total:</span>
                      <span className="text-emerald-500">
                        ${(gameState.status.totalCost || 0).toFixed(6)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          <AudioPlayer track={musicTrack} />
          
          <button
            onClick={toggleTts}
            className={`flex items-center gap-1 px-2 py-1 border font-mono text-[10px] rounded-sm transition-all cursor-pointer select-none outline-none
              ${isTtsEnabled 
                ? 'border-amber-900 bg-amber-950/40 text-amber-400 hover:bg-amber-900/50' 
                : 'border-stone-800 bg-stone-950 text-stone-500 hover:text-stone-300'}`}
            title={isTtsEnabled ? 'Sprachausgabe stummschalten' : 'Sprachausgabe einschalten'}
          >
            <span>TTS {isTtsEnabled ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={() => setShowSpielerblatt(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 border border-amber-900 bg-amber-950/20 hover:bg-amber-950/40 text-amber-400 font-mono text-[10px] rounded-sm transition-all cursor-pointer select-none outline-none"
            title="Spielerblatt / Charakterbogen öffnen"
          >
            <Briefcase size={10} />
            <span>SPIELERBLATT</span>
          </button>
        </div>
      </header>

      {/* Main Single-Viewport Layout Panel */}
      <main className="flex-grow flex flex-col lg:flex-row w-full max-w-none pt-16 pb-3 px-4 lg:px-6 overflow-hidden gap-4 lg:gap-6">
        
        {/* Left Column: Scene Image Container (Takes 2/3 width) */}
        <div className="w-full lg:w-2/3 flex flex-col justify-center items-center overflow-hidden lg:h-full min-h-[30vh]">
          <SceneImage prompt={imagePrompt} location={gameState.status.location} />
        </div>

        {/* Right Column: Other gameplay elements (Takes 1/3 width) */}
        <div className="w-full lg:w-1/3 flex flex-col justify-between overflow-hidden lg:h-full gap-3">
          
          {/* 1. Spielleiter Narration Text Box (Takes remaining vertical space in right column) */}
          <div className="flex-grow w-full overflow-hidden flex flex-col min-h-[15vh]">
            <NarratorText 
              text={narrationText} 
              className="flex-grow border border-stone-900 bg-stone-950/80 p-3 md:p-4 font-mono text-[11px] md:text-xs leading-relaxed text-stone-300 shadow-inner rounded-sm cursor-pointer select-none overflow-y-auto"
            />
          </div>

          {/* 2. Action Block: Handlungsbuttons & Texteingabe (or Dice rolling) */}
          <div className="flex-shrink-0 w-full border border-stone-900/80 bg-stone-950/90 p-2.5 md:p-3 rounded-sm shadow-md relative">
            <div className="text-[9px] text-stone-650 tracking-widest mb-1.5 flex items-center gap-1">
              <Shield size={9} />
              <span>AKTIONSAUSWAHL</span>
            </div>

            {isRollPending ? (
              /* DICE ROLLING PANEL */
              <div className="border border-stone-850 bg-stone-900/20 p-2.5 font-mono text-xs rounded-sm text-center">
                <div className="text-stone-400 font-bold uppercase tracking-widest text-[10px] mb-1.5 flex items-center justify-center gap-1">
                  <Dices className="text-amber-500" size={14} />
                  <span>D100 PRÜFUNG ERFORDERLICH</span>
                </div>
                <p className="text-stone-300 text-xs mb-2">
                  {sprache === 'de' ? 'Aktion:' : 'Action:'} <span className="text-stone-100 font-bold">"{pendingRollGoal}"</span>
                </p>

                {/* Modifiers List */}
                <div className="text-[9px] text-stone-500 text-left max-w-xs mx-auto mb-2.5 bg-stone-950/70 p-2 border border-stone-900 rounded-sm space-y-0.5">
                  {pendingRollType === 'luegengehoer' && <div className="text-emerald-500">+15 Lügengehör-Bonus</div>}
                  {pendingRollType === 'luegen' && <div className="text-rose-500">-20 Lügen-Sperre (Zunge des Zeugen)</div>}
                  {gameState.status.lp < 30 && <div className="text-rose-500">-10 Körperliche Erschöpfung (&lt;30 LP)</div>}
                  <div className="text-stone-600">Basis-Wurf: d100 Zyklen</div>
                </div>

                {!diceResult ? (
                  <button
                    onClick={handleRollDice}
                    className="px-4 py-1.5 bg-amber-950 hover:bg-amber-900 border border-amber-800 hover:border-amber-500 text-amber-400 text-xs font-bold tracking-widest uppercase cursor-pointer rounded-sm hover:scale-[1.01] active:scale-95 transition-all outline-none"
                  >
                    {sprache === 'de' ? 'WÜRFELN' : 'ROLL DICE'}
                  </button>
                ) : (
                  <div className="space-y-2.5 animate-fadeIn">
                    <div className="flex justify-center items-center gap-4 my-1">
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] text-stone-500">WURF</span>
                        <span className="text-lg font-bold text-stone-400">{diceResult.baseRoll}</span>
                      </div>
                      <div className="text-stone-700">+</div>
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] text-stone-500">MOD</span>
                        <span className={`text-lg font-bold ${diceResult.modifier >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {diceResult.modifier >= 0 ? `+${diceResult.modifier}` : diceResult.modifier}
                        </span>
                      </div>
                      <div className="text-stone-700">=</div>
                      <div className="flex flex-col items-center border border-amber-900/30 bg-amber-950/10 px-3 py-1 rounded-sm">
                        <span className="text-[9px] text-amber-500/70 font-semibold">GESAMT</span>
                        <span className="text-2xl font-black text-amber-400">{diceResult.finalScore}</span>
                      </div>
                    </div>

                    <div className="border border-stone-850 bg-stone-950/50 p-2 text-stone-300 max-w-sm mx-auto text-[10px] space-y-0.5">
                      <div className="font-bold text-amber-400 uppercase tracking-widest">{diceResult.category}</div>
                      <div className="text-stone-500 leading-normal">{diceResult.description}</div>
                    </div>

                    <button
                      onClick={handleDiceRollContinue}
                      className="px-4 py-1.5 bg-stone-900 hover:bg-stone-850 border border-stone-800 text-stone-300 hover:text-stone-100 text-xs uppercase tracking-wider cursor-pointer rounded-sm transition-all outline-none"
                    >
                      {sprache === 'de' ? 'Fortfahren' : 'Continue'} ➔
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* NORMAL ACTION CHOICE & TEXT BOX */
              <div className="space-y-1">
                <ActionButtons 
                  buttons={buttons} 
                  onSelect={(opt) => submitAction(opt)} 
                  disabled={isLoading} 
                />
                
                <div className="border-t border-stone-900/60 pt-1.5">
                  <TextInput 
                    onSubmit={(txt) => submitAction(txt)} 
                    disabled={isLoading} 
                    sessionId={sessionId}
                    onTranscriptionComplete={(newState) => setGameState(newState)}
                  />
                </div>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* SPIELERBLATT (CHARAKTERBOGEN) OVERLAY MODAL */}
      {showSpielerblatt && (
        <div 
          onClick={() => setShowSpielerblatt(false)}
          className="fixed inset-0 bg-[#0C0B0A]/95 z-40 flex items-center justify-center p-4 md:p-8 cursor-zoom-out select-none animate-fadeIn"
        >
          {/* File Card Container */}
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-[#EBE7DC] border-4 border-[#D4CBB3] p-5 text-[#4A473E] font-mono shadow-2xl rounded-sm relative overflow-hidden flex flex-col justify-between max-h-[85vh] cursor-default"
          >
            {/* Folder tab design top-left */}
            <div className="absolute top-0 left-0 bg-[#D4CBB3] px-3 py-1 text-[9px] font-bold text-[#4A473E] rounded-br-sm select-none uppercase tracking-widest">
              AKTE: {gameState.sessionId.split('_')[1] || 'TOMAS GRETSCH'}
            </div>

            {/* Close button top-right */}
            <button 
              onClick={() => setShowSpielerblatt(false)}
              className="absolute top-2 right-2 text-stone-500 hover:text-stone-800 font-bold font-sans text-sm px-2 cursor-pointer outline-none"
              title="Akte schließen"
            >
              ✕
            </button>

            <div className="mt-4 flex flex-col gap-3 flex-grow overflow-hidden">
              <div className="text-xs font-black border-b border-[#D4CBB3] pb-1.5 flex justify-between items-center text-[#3D3A32]">
                <span>PERSONALAKTE (CHARAKTERBOGEN)</span>
                <span className="text-[10px] uppercase text-stone-500">KVR-AKTE Nr. 2026-B</span>
              </div>

              {/* Status Header inside modal */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 bg-[#E1DBD0] p-2.5 rounded-sm text-[11px] border border-[#C2BAA6]">
                <div>
                  <span className="font-bold text-stone-500 uppercase block text-[8px]">NAME:</span>
                  <span className="font-bold text-[#3D3A32]">TOMAS GRETSCH</span>
                </div>
                <div>
                  <span className="font-bold text-stone-500 uppercase block text-[8px]">STATUS:</span>
                  <span className="font-bold text-[#3D3A32]">{gameState.status.resonance}</span>
                </div>
                <div>
                  <span className="font-bold text-stone-500 uppercase block text-[8px]">RESISTENZ:</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="h-1.5 w-14 bg-stone-300 rounded-sm overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          gameState.status.lp > 50 ? 'bg-emerald-600' : gameState.status.lp > 20 ? 'bg-amber-600' : 'bg-rose-600'
                        }`} 
                        style={{ width: `${gameState.status.lp}%` }}
                      />
                    </div>
                    <span className="font-bold text-[#3D3A32] text-[10px]">{gameState.status.lp}/100 LP</span>
                  </div>
                </div>
              </div>

              {/* Tabs inside file folder */}
              <div className="grid grid-cols-4 gap-1 border-b border-[#C2BAA6] pb-1.5">
                <button
                  onClick={() => setActiveTab('inventory')}
                  className={`py-1.5 px-1 text-center text-[9px] font-bold border transition-all cursor-pointer rounded-sm outline-none ${
                    activeTab === 'inventory' 
                      ? 'bg-[#3D3A32] text-[#EBE7DC] border-[#3D3A32]' 
                      : 'border-transparent text-stone-500 hover:text-stone-850 hover:bg-[#E1DBD0]'
                  }`}
                >
                  INVENTAR
                </button>
                <button
                  onClick={() => setActiveTab('quests')}
                  className={`py-1.5 px-1 text-center text-[9px] font-bold border transition-all cursor-pointer rounded-sm outline-none ${
                    activeTab === 'quests' 
                      ? 'bg-[#3D3A32] text-[#EBE7DC] border-[#3D3A32]' 
                      : 'border-transparent text-stone-500 hover:text-stone-850 hover:bg-[#E1DBD0]'
                  }`}
                >
                  QUESTS
                </button>
                <button
                  onClick={() => setActiveTab('npcs')}
                  className={`py-1.5 px-1 text-center text-[9px] font-bold border transition-all cursor-pointer rounded-sm outline-none ${
                    activeTab === 'npcs' 
                      ? 'bg-[#3D3A32] text-[#EBE7DC] border-[#3D3A32]' 
                      : 'border-transparent text-stone-500 hover:text-stone-850 hover:bg-[#E1DBD0]'
                  }`}
                >
                  CHARAKTERE
                </button>
                <button
                  onClick={() => setActiveTab('weltstand')}
                  className={`py-1.5 px-1 text-center text-[9px] font-bold border transition-all cursor-pointer rounded-sm outline-none ${
                    activeTab === 'weltstand' 
                      ? 'bg-[#3D3A32] text-[#EBE7DC] border-[#3D3A32]' 
                      : 'border-transparent text-stone-500 hover:text-stone-850 hover:bg-[#E1DBD0]'
                  }`}
                >
                  WELTSTAND
                </button>
              </div>

              {/* Tab content inside modal */}
              <div className="flex-grow overflow-y-auto pr-1 py-1 text-[11px] text-[#4A473E] max-h-[35vh]">
                {activeTab === 'inventory' && (
                  <div className="space-y-3">
                    <div>
                      <div className="text-[9px] text-stone-500 font-bold mb-1.5 uppercase tracking-wide">AKTIVE BEEINTRÄCHTIGUNGEN:</div>
                      {gameState.status.activeEffects.length === 0 ? (
                        <div className="text-stone-500 italic pl-1 text-[10px]">Keine physischen Störungen vermerkt.</div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          {gameState.status.activeEffects.map((eff, i) => (
                            <div key={i} className="px-2 py-1 bg-[#F5C2C2]/40 border border-[#E08A8A] text-rose-800 rounded-sm font-bold font-mono">
                              • {eff}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="border-t border-[#C2BAA6]/60 pt-2.5">
                      <div className="text-[9px] text-stone-500 font-bold mb-1.5 uppercase tracking-wide">EINGETRAGENE GEGENSTÄNDE:</div>
                      {gameState.status.inventory.length === 0 ? (
                        <div className="text-stone-500 italic pl-1 text-[10px]">Kein Besitz verzeichnet.</div>
                      ) : (
                        <ul className="space-y-1.5">
                          {gameState.status.inventory.map((item, i) => (
                            <li key={i} className="flex items-center gap-2 pl-2 py-0.5 border-l-2 border-[#C2BAA6] text-[#3D3A32]">
                              <span className="text-[#C2410C]">•</span>
                              <span className="font-semibold">{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'quests' && (
                  <ul className="space-y-2">
                    {gameState.quests.map((q) => (
                      <li key={q.id} className="border border-[#C2BAA6] p-2 rounded-sm bg-[#E5DFD4]">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-bold text-[#3D3A32]">{q.title}</span>
                          <span className={`text-[8px] px-1 py-0.5 rounded-sm uppercase font-bold border ${
                            q.status === 'completed'
                              ? 'bg-emerald-100 border-emerald-400 text-emerald-800'
                              : q.status === 'active'
                              ? 'bg-amber-100 border-amber-400 text-amber-800 animate-pulse'
                              : 'bg-rose-100 border-rose-400 text-rose-800'
                          }`}>
                            {q.status}
                          </span>
                        </div>
                        <p className="text-[9px] text-stone-600 leading-normal">{q.details}</p>
                      </li>
                    ))}
                  </ul>
                )}

                {activeTab === 'npcs' && (
                  <ul className="space-y-2">
                    {gameState.npcs.map((npc, i) => (
                      <li key={i} className="border border-[#C2BAA6] p-2 rounded-sm bg-[#E5DFD4] flex flex-col gap-1">
                        <div className="flex justify-between items-center border-b border-[#C2BAA6]/40 pb-0.5">
                          <span className="font-bold text-[#3D3A32]">{npc.name}</span>
                          <span className="text-[8px] text-[#8B8370] italic">{npc.location}</span>
                        </div>
                        <div className="text-[9px] text-stone-600 space-y-0.5">
                          <div><span className="font-semibold text-stone-500">Status:</span> {npc.status}</div>
                          <div><span className="font-semibold text-stone-500">Wissen:</span> {npc.knows}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                {activeTab === 'weltstand' && (
                  <div className="space-y-2.5">
                    <div>
                      <div className="text-[9px] text-stone-500 font-bold mb-1 tracking-wide uppercase">STILLE MASCHINE SYSTEMSTATUS:</div>
                      <div className="border border-[#C2BAA6] bg-[#E1DBD0] p-2 text-center rounded-sm">
                        <span className="text-[8px] text-stone-500 block uppercase tracking-widest">AKTIVIERUNG IN:</span>
                        <span className="text-2xl font-black text-[#C2410C] animate-pulse">{gameState.weltstand.stilleMaschineHours}h</span>
                      </div>
                    </div>

                    <div className="border-t border-[#C2BAA6]/60 pt-2">
                      <div className="text-[9px] text-stone-500 font-bold mb-1 tracking-wide uppercase">DOKUMENTIERTE ERKENNTNISSE:</div>
                      {gameState.weltstand.knownFacts.length === 0 ? (
                        <div className="text-stone-500 italic pl-1 text-[10px]">Keine städtischen Wahrheiten bewiesen.</div>
                      ) : (
                        <ul className="space-y-1">
                          {gameState.weltstand.knownFacts.map((fact, idx) => (
                            <li key={idx} className="flex gap-1.5 pl-1.5 border-l-2 border-[#C2BAA6] text-stone-600 leading-normal">
                              <span className="text-[#C2410C] shrink-0">✔</span>
                              <span>{fact}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Folder Footer info */}
            <div className="mt-3 border-t border-[#D4CBB3] pt-2 flex justify-between items-center text-[8px] text-[#8B8370] select-none">
              <span>BEHÖRDE FÜR RESTRUNGEN & STATISTIK</span>
              <span>VERTRAULICHE DOKUMENTE [KLASSE 3B]</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponents / Helpers
function TabButton({ active, onClick, label, icon }: { active: boolean; onClick: () => void; label: string; icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center py-2 px-1 text-[9px] font-bold border transition-all cursor-pointer select-none rounded-sm gap-1 outline-none
        ${active 
          ? 'border-amber-950 bg-amber-950/20 text-amber-400' 
          : 'border-transparent text-stone-500 hover:text-stone-300 hover:bg-stone-900/40'}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function LoaderAnim() {
  return (
    <div className="flex gap-0.5 ml-2 items-center">
      <div className="h-1.5 w-1.5 bg-amber-500 animate-bounce rounded-full [animation-delay:-0.3s]" />
      <div className="h-1.5 w-1.5 bg-amber-500 animate-bounce rounded-full [animation-delay:-0.15s]" />
      <div className="h-1.5 w-1.5 bg-amber-500 animate-bounce rounded-full" />
    </div>
  );
}

export default function PlayPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen bg-[#0C0B0A] text-stone-205 items-center justify-center font-mono">
        <div className="text-center space-y-4">
          <RefreshCw size={24} className="animate-spin text-amber-500 mx-auto" />
          <div className="text-xs text-stone-500 tracking-widest uppercase">Initialisiere Spiel...</div>
        </div>
      </div>
    }>
      <PlayContent />
    </Suspense>
  );
}
