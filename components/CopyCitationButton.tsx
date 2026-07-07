'use client';

// Tiny copy-to-clipboard button for the /housing-index citation snippets.
// Isolated as a client component so the rest of the page can stay server-
// rendered (which is what we want for LLM/crawler scraping).

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface Props {
  text: string;
  label?: string;
  className?: string;
}

export default function CopyCitationButton({ text, label = 'Copy', className = '' }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Silently fail — user can still select + copy the visible text.
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md border transition ${
        copied
          ? 'bg-emerald-500/10 border-emerald-400/40 text-emerald-300'
          : 'bg-white/5 border-white/10 text-gray-300 hover:border-white/40 hover:text-white'
      } ${className}`}
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? 'Copied' : label}
    </button>
  );
}
