import React, { useState, useEffect, useRef } from 'react';

interface NarratorTextProps {
  text: string;
  className?: string;
}

export default function NarratorText({ text, className }: NarratorTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const textEndRef = useRef<HTMLDivElement>(null);

  // Parse very simple Markdown to HTML (bold, italics, breaks)
  const formatMarkdown = (md: string) => {
    // Escape HTML tags to prevent XSS
    let escaped = md
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Convert **bold** to <strong>
    escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong class="text-stone-100 font-bold">$1</strong>');
    
    // Convert *italic* or _italic_ to <em>
    escaped = escaped.replace(/\*(.*?)\*/g, '<em class="text-stone-300">$1</em>');
    escaped = escaped.replace(/_(.*?)_/g, '<em class="text-stone-300">$1</em>');

    // Convert blockquotes > quote
    escaped = escaped.replace(/^&gt;\s+(.*)$/gm, '<blockquote class="border-l-2 border-amber-500 pl-4 py-1 my-2 bg-stone-900/40 text-amber-100/90 italic">$1</blockquote>');

    // Convert newlines to breaks
    escaped = escaped.replace(/\n/g, '<br />');

    return escaped;
  };

  useEffect(() => {
    // If the text changes, start typing effect
    setIsTyping(true);
    let index = 0;
    setDisplayedText('');

    // Fast typing effect: append chunks of characters or words
    const timer = setInterval(() => {
      if (index < text.length) {
        // Find next whitespace or char
        const nextChunkSize = Math.min(3, text.length - index);
        const chunk = text.slice(index, index + nextChunkSize);
        setDisplayedText(prev => prev + chunk);
        index += nextChunkSize;
      } else {
        clearInterval(timer);
        setIsTyping(false);
      }
    }, 15);

    return () => {
      clearInterval(timer);
    };
  }, [text]);

  // Scroll to bottom when text updates
  useEffect(() => {
    textEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayedText]);

  // Skip typing animation on click
  const handleSkip = () => {
    if (isTyping) {
      setDisplayedText(text);
      setIsTyping(false);
    }
  };

  const formattedHtml = formatMarkdown(displayedText);

  return (
    <div 
      onClick={handleSkip}
      className={className || `border border-stone-800 bg-stone-950 p-6 font-mono text-sm md:text-base leading-relaxed text-stone-300 shadow-inner rounded-sm cursor-pointer select-none min-h-[160px] max-h-[350px] overflow-y-auto ${isTyping ? 'border-dashed border-stone-700' : ''}`}
    >
      <div 
        dangerouslySetInnerHTML={{ __html: formattedHtml }} 
        className="prose prose-invert prose-stone max-w-none text-justify"
      />
      {isTyping && (
        <span className="inline-block w-2 h-4 ml-1 bg-stone-400 animate-pulse" />
      )}
      <div ref={textEndRef} />
    </div>
  );
}
