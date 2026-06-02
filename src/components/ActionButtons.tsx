import React from 'react';

interface ActionButtonsProps {
  buttons: string[];
  onSelect: (option: string) => void;
  disabled: boolean;
}

export default function ActionButtons({ buttons, onSelect, disabled }: ActionButtonsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-xs w-full my-2">
      {buttons.map((option, idx) => (
        <button
          key={idx}
          onClick={() => !disabled && onSelect(option)}
          disabled={disabled}
          className={`group flex items-center justify-between border border-stone-800 bg-stone-950 px-3 py-2 text-stone-300 rounded-sm text-left transition-all duration-200 outline-none
            ${disabled 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:bg-stone-900 hover:border-amber-500/50 hover:text-amber-400 focus:border-amber-500/50 focus:text-amber-400 cursor-pointer active:scale-[0.99] shadow-sm hover:shadow-md'
            }`}
        >
          <span className="flex items-center gap-2">
            <span className="text-stone-600 group-hover:text-amber-500/70 group-focus:text-amber-500/70 transition-colors">
              {idx + 1}.
            </span>
            <span className="font-semibold tracking-wide">
              {option}
            </span>
          </span>
          <span className="text-stone-700 group-hover:text-amber-500/60 group-focus:text-amber-500/60 group-hover:translate-x-1 transition-all">
            ➔
          </span>
        </button>
      ))}
    </div>
  );
}
