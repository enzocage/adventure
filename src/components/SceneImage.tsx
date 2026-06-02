import React, { useMemo, useState, useEffect } from 'react';

interface SceneImageProps {
  prompt: string | null;
  location: string;
}

export default function SceneImage({ prompt, location }: SceneImageProps) {
  const [imageLoading, setImageLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (prompt) {
      setImageLoading(true);
      setHasError(false);
    } else {
      setImageLoading(false);
      setHasError(true);
    }
  }, [prompt]);

  // Determine which vector template to render based on the prompt text
  const sceneTemplate = useMemo(() => {
    const p = (prompt || '').toLowerCase();
    const loc = location.toLowerCase();

    if (p.includes('waiting') || p.includes('warte') || loc.includes('warte')) {
      return 'waiting-room';
    }
    if (p.includes('corridor') || p.includes('gang') || p.includes('flur') || loc.includes('untergeschoss') || loc.includes('flur')) {
      return 'corridor';
    }
    if (p.includes('office') || p.includes('büro') || p.includes('raum 4c') || loc.includes('raum')) {
      return 'office';
    }
    if (p.includes('archive') || p.includes('akten') || p.includes('ordner') || p.includes('ornstein') || loc.includes('archiv')) {
      return 'archive';
    }
    return 'brutalist-facade';
  }, [prompt, location]);

  const renderSvgContent = () => {
    switch (sceneTemplate) {
      case 'waiting-room':
        return (
          <svg viewBox="0 0 800 450" className="w-full h-full text-stone-600 fill-current">
            {/* Floor and walls */}
            <path d="M 0 350 L 300 280 L 500 280 L 800 350 L 800 450 L 0 450 Z" fill="#24221E" />
            <line x1="300" y1="280" x2="300" y2="0" stroke="#3D3A32" strokeWidth="2" />
            <line x1="500" y1="280" x2="500" y2="0" stroke="#3D3A32" strokeWidth="2" />
            <line x1="300" y1="280" x2="500" y2="280" stroke="#3D3A32" strokeWidth="2" />
            
            {/* Fluorescent Light Tubes */}
            <rect x="350" y="20" width="100" height="8" rx="4" fill="#E2EDF0" className="animate-pulse" />
            <line x1="350" y1="24" x2="450" y2="24" stroke="#A8D0DB" strokeWidth="4" />
            <circle cx="400" cy="24" r="30" fill="url(#neonGlow)" opacity="0.15" />
            
            {/* Waiting display */}
            <rect x="50" y="40" width="120" height="60" rx="4" fill="#12110E" stroke="#3D3A32" />
            <text x="110" y="80" textAnchor="middle" fill="#E85D44" className="font-sans font-bold text-3xl tracking-widest animate-pulse">D-347</text>
            <text x="110" y="55" textAnchor="middle" fill="#6B624E" className="text-xs">NÄCHSTE NUMMER</text>
            
            {/* Rows of chairs */}
            <g transform="translate(180, 240) scale(0.75)" fill="#423E35">
              <rect x="50" y="40" width="60" height="60" rx="8" />
              <rect x="130" y="40" width="60" height="60" rx="8" />
              <rect x="210" y="40" width="60" height="60" rx="8" />
              <line x1="40" y1="100" x2="280" y2="100" stroke="#24221E" strokeWidth="10" />
              {/* Chair legs */}
              <line x1="60" y1="100" x2="50" y2="140" stroke="#24221E" strokeWidth="4" />
              <line x1="100" y1="100" x2="110" y2="140" stroke="#24221E" strokeWidth="4" />
              <line x1="140" y1="100" x2="130" y2="140" stroke="#24221E" strokeWidth="4" />
              <line x1="180" y1="100" x2="190" y2="140" stroke="#24221E" strokeWidth="4" />
            </g>

            {/* Spooky potted plant */}
            <path d="M 680 250 L 720 250 L 710 320 L 690 320 Z" fill="#1C1A16" />
            <path d="M 700 250 C 660 210, 680 140, 700 130 C 720 140, 740 210, 700 250 Z" fill="#182A1B" />
            <path d="M 690 250 C 650 220, 640 170, 670 150 Z" fill="#142417" />
            <path d="M 710 250 C 750 220, 760 170, 730 150 Z" fill="#142417" />
          </svg>
        );
      case 'corridor':
        return (
          <svg viewBox="0 0 800 450" className="w-full h-full text-stone-600 fill-current">
            {/* Vanishing point hallway */}
            <path d="M 0 0 L 350 180 L 350 270 L 0 450 Z" fill="#24221E" /> {/* Left wall */}
            <path d="M 800 0 L 450 180 L 450 270 L 800 450 Z" fill="#24221E" /> {/* Right wall */}
            <path d="M 350 180 L 450 180 L 450 270 L 350 270 Z" fill="#171614" /> {/* End door wall */}
            <path d="M 0 450 L 350 270 L 450 270 L 800 450 Z" fill="#1C1A16" /> {/* Floor */}
            <path d="M 0 0 L 350 180 L 450 180 L 800 0 Z" fill="#2A2823" /> {/* Ceiling */}

            {/* Fluorescent tubes receding */}
            <line x1="380" y1="160" x2="420" y2="160" stroke="#E2EDF0" strokeWidth="4" />
            <line x1="320" y1="120" x2="480" y2="120" stroke="#E2EDF0" strokeWidth="6" opacity="0.6" />
            <line x1="200" y1="60" x2="600" y2="60" stroke="#E2EDF0" strokeWidth="10" opacity="0.3" />

            {/* Doors on sides */}
            <path d="M 100 80 L 250 140 L 250 310 L 100 380 Z" fill="#1C1A16" stroke="#2B2822" />
            <path d="M 700 80 L 550 140 L 550 310 L 700 380 Z" fill="#1C1A16" stroke="#2B2822" />
            
            {/* Spooky lights under the doors */}
            <polygon points="100,380 250,310 260,313 95,385" fill="#E85D44" opacity="0.4" />
            <polygon points="700,380 550,310 540,313 705,385" fill="#FFB703" opacity="0.3" />

            {/* End door spalt (light glowing through crack) */}
            <rect x="385" y="195" width="30" height="70" fill="#12110F" />
            <line x1="400" y1="195" x2="400" y2="265" stroke="#FFF" strokeWidth="2" className="animate-pulse" />
            <polygon points="400,195 400,265 430,280 435,220" fill="url(#doorGlow)" opacity="0.4" />
          </svg>
        );
      case 'office':
        return (
          <svg viewBox="0 0 800 450" className="w-full h-full text-stone-600 fill-current">
            {/* Bureaucrat desk */}
            <path d="M 100 400 L 700 400 L 650 250 L 150 250 Z" fill="#2D2A24" />
            <rect x="150" y="250" width="500" height="20" fill="#1C1A16" />
            
            {/* Tall stacks of folders/papers */}
            <g transform="translate(180, 100)" fill="#D4CBB3" stroke="#2D2A24">
              <rect x="0" y="110" width="80" height="15" rx="1" fill="#4B5320" />
              <rect x="2" y="95" width="76" height="15" rx="1" fill="#8B5A2B" />
              <rect x="1" y="80" width="78" height="15" rx="1" />
              <rect x="5" y="65" width="74" height="15" rx="1" />
              <rect x="3" y="50" width="75" height="15" rx="1" fill="#708090" />
              <rect x="-1" y="35" width="82" height="15" rx="1" />
              {/* Top folder is slightly askew */}
              <g transform="rotate(3, 40, 25)">
                <rect x="0" y="20" width="80" height="15" rx="1" fill="#C2410C" />
              </g>
            </g>

            {/* Vintage desk lamp glowing warm yellow */}
            <path d="M 520 250 L 530 250 L 530 150 C 530 110, 500 110, 480 120 Z" fill="none" stroke="#12110F" strokeWidth="6" />
            <path d="M 460 110 C 460 90, 500 90, 500 110 Z" fill="#C2410C" />
            {/* Light cone */}
            <polygon points="460,115 500,115 620,250 360,250" fill="url(#lampGlow)" opacity="0.35" />
            
            {/* Typewriter or terminal device */}
            <rect x="320" y="210" width="140" height="50" rx="3" fill="#1E2022" />
            <rect x="340" y="170" width="100" height="40" rx="2" fill="#0D0E0F" stroke="#2A2B2D" />
            <text x="390" y="195" textAnchor="middle" fill="#00FF66" className="text-xs font-mono tracking-widest animate-pulse">U-0 ?</text>
          </svg>
        );
      case 'archive':
        return (
          <svg viewBox="0 0 800 450" className="w-full h-full text-stone-600 fill-current">
            {/* Infinite file shelves */}
            <g fill="#1F1E1B" stroke="#2B2822">
              <rect x="50" y="0" width="100" height="450" />
              <rect x="200" y="0" width="100" height="450" />
              <rect x="350" y="0" width="100" height="450" />
              <rect x="500" y="0" width="100" height="450" />
              <rect x="650" y="0" width="100" height="450" />
            </g>

            {/* Shelf Dividers */}
            <line x1="50" y1="100" x2="750" y2="100" stroke="#3D3A32" strokeWidth="4" />
            <line x1="50" y1="200" x2="750" y2="200" stroke="#3D3A32" strokeWidth="4" />
            <line x1="50" y1="300" x2="750" y2="300" stroke="#3D3A32" strokeWidth="4" />

            {/* Stacks of documents filling shelves */}
            <g fill="#3D3A32">
              {/* Horizontal row of binders */}
              <rect x="60" y="10" width="15" height="80" rx="1" fill="#B45309" />
              <rect x="75" y="15" width="15" height="75" rx="1" />
              <rect x="90" y="10" width="15" height="80" rx="1" />
              <rect x="105" y="20" width="15" height="70" rx="1" fill="#065F46" />
              
              <rect x="210" y="110" width="80" height="80" rx="2" fill="#2E2C27" />
              
              {/* Leaning binders */}
              <g transform="rotate(-15, 360, 80)">
                <rect x="360" y="10" width="18" height="80" rx="1" fill="#C2410C" />
              </g>
              <g transform="rotate(10, 520, 80)">
                <rect x="510" y="15" width="16" height="75" rx="1" fill="#1E3A8A" />
              </g>
            </g>

            {/* Burning Candles on shelf edges (Tomas' craft) */}
            <g transform="translate(220, 185)">
              <rect x="0" y="0" width="8" height="15" fill="#F59E0B" />
              <circle cx="4" cy="-4" r="5" fill="#EF4444" className="animate-ping" opacity="0.5" />
              <path d="M 4 -1 C 2 -5, 4 -10, 4 -10 C 4 -10, 6 -5, 4 -1 Z" fill="#FBBF24" />
            </g>

            <g transform="translate(510, 285)">
              <rect x="0" y="0" width="8" height="15" fill="#F59E0B" />
              <circle cx="4" cy="-4" r="5" fill="#EF4444" className="animate-ping" opacity="0.3" />
              <path d="M 4 -1 C 2 -5, 4 -10, 4 -10 C 4 -10, 6 -5, 4 -1 Z" fill="#FBBF24" />
            </g>
          </svg>
        );
      case 'brutalist-facade':
      default:
        return (
          <svg viewBox="0 0 800 450" className="w-full h-full text-stone-600 fill-current">
            {/* Massive concrete blocks of the building */}
            <rect x="0" y="0" width="800" height="450" fill="#1C1A16" />
            <polygon points="50,0 250,0 200,450 0,450" fill="#2E2C27" />
            <polygon points="750,0 550,0 600,450 800,450" fill="#2E2C27" />
            <rect x="250" y="0" width="300" height="300" fill="#24221E" stroke="#3A372E" strokeWidth="2" />
            
            {/* Ominous logo/seal on the facade */}
            <circle cx="400" cy="120" r="60" fill="none" stroke="#3A372E" strokeWidth="4" />
            <line x1="340" y1="120" x2="460" y2="120" stroke="#3A372E" strokeWidth="4" />
            <line x1="400" y1="60" x2="400" y2="180" stroke="#3A372E" strokeWidth="4" />
            
            {/* Giant Red Stamp silhouette */}
            <g transform="translate(370, 220) scale(1.5)">
              <path d="M 10 30 L 30 30 L 25 10 C 25 5, 15 5, 15 10 Z" fill="#C2410C" />
              <rect x="0" y="30" width="40" height="10" rx="1" fill="#C2410C" />
              <text x="20" y="25" textAnchor="middle" fill="#24221E" className="text-[6px] font-sans font-bold">KVR</text>
            </g>
          </svg>
        );
    }
  };

  return (
    <>
      <div 
        onClick={() => setIsExpanded(true)}
        className="w-full h-full relative overflow-hidden flex items-center justify-center cursor-zoom-in group rounded-sm border border-stone-900 bg-stone-950/40 select-none"
      >
        {/* Uncanny Vignette & Film overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/25 pointer-events-none z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.5))] pointer-events-none z-10" />
        
        {/* Render Scene (Image or Vector) */}
        <div className="w-full h-full relative overflow-hidden flex items-center justify-center">
          {prompt && !hasError ? (
            <>
              {imageLoading && (
                <div className="absolute inset-0 bg-[#12110F] flex flex-col items-center justify-center font-mono text-[#8B8370] gap-3 z-15 select-none">
                  <div className="w-10 h-10 border-2 border-[#8B8370]/30 border-t-[#C2410C] rounded-full animate-spin" />
                  <span className="animate-pulse text-[10px] tracking-[0.2em] uppercase mt-2">Szene wird belichtet ...</span>
                </div>
              )}
              <img
                src={`/api/images?prompt=${encodeURIComponent(prompt)}`}
                alt={location}
                className="w-full h-full object-cover filter contrast-[1.05] brightness-[0.85] saturate-[0.8] transition-all duration-300 group-hover:brightness-[0.9]"
                onLoad={() => setImageLoading(false)}
                onError={() => {
                  console.warn('Imagen generation failed, falling back to SVG.');
                  setHasError(true);
                  setImageLoading(false);
                }}
              />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center p-4">
              <div className="w-full max-h-[85vh] aspect-[16/9] flex items-center justify-center">
                {renderSvgContent()}
              </div>
            </div>
          )}

          {/* Retro crt visual scanline layer */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%)] bg-[size:100%_4px] pointer-events-none z-10" />
        </div>

        {/* Floating administrative label */}
        <div className="absolute bottom-3 left-3 z-20 px-2 py-1 bg-[#0C0B0A]/85 border border-stone-850 text-stone-400 font-mono text-[9px] uppercase tracking-wider rounded-sm select-none">
          LOK: {location} // KVR-GEPRÜFT
        </div>
      </div>

      {isExpanded && (
        <div 
          onClick={() => setIsExpanded(false)}
          className="fixed inset-0 bg-[#0C0B0A]/95 z-50 flex flex-col items-center justify-center p-4 md:p-8 cursor-zoom-out select-none"
        >
          {/* Polaroid Card (Enlarged) */}
          <div 
            className="w-full max-w-5xl bg-[#EBE7DC] border-4 border-[#D4CBB3] p-4 md:p-6 text-[#4A473E] font-mono shadow-2xl rounded-sm relative overflow-hidden flex flex-col justify-between max-h-[90vh] cursor-zoom-out"
          >
            {/* Uncanny Vignette & Film overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-black/5 pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_60%,rgba(0,0,0,0.15))] pointer-events-none" />
            
            <div className="w-full relative overflow-hidden flex items-center justify-center rounded-sm bg-[#1A1916] border border-[#C2BAA6] flex-grow max-h-[70vh] aspect-[16/9]">
              {prompt && !hasError ? (
                <img
                  src={`/api/images?prompt=${encodeURIComponent(prompt)}`}
                  alt={location}
                  className="max-w-full max-h-[68vh] object-contain filter contrast-[1.05] brightness-[0.9] saturate-[0.8] rounded-sm"
                />
              ) : (
                renderSvgContent()
              )}
              {/* Retro crt visual scanline layer */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%)] bg-[size:100%_4px] pointer-events-none" />
            </div>
            
            <div className="mt-4 flex justify-between items-end border-t border-[#D4CBB3]/50 pt-3">
              <div className="flex flex-col">
                <span className="text-[10px] text-[#8B8370] uppercase tracking-wider">LOKALISIERUNG:</span>
                <span className="text-sm font-bold text-[#3D3A32] tracking-wide">{location}</span>
              </div>
              <div className="border-2 border-dashed border-[#C2410C]/40 text-[#C2410C]/70 text-[10px] px-2 py-1 rotate-[-4deg] font-sans font-black tracking-widest rounded-sm uppercase">
                GEPRÜFT (VERGRÖSSERT)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SVG Gradients for effects */}
      <svg className="hidden">
        <defs>
          <radialGradient id="neonGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#A8D0DB" stopOpacity="1" />
            <stop offset="100%" stopColor="#A8D0DB" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="doorGlow" cx="0%" cy="50%" r="100%">
            <stop offset="0%" stopColor="#FFF" stopOpacity="1" />
            <stop offset="50%" stopColor="#FFB703" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#E85D44" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="lampGlow" cx="50%" cy="0%" r="100%">
            <stop offset="0%" stopColor="#FCD34D" stopOpacity="1" />
            <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
    </>
  );
}
