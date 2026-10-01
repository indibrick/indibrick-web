'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Expand } from 'lucide-react';

export interface GalleryPhoto {
  src: string;
  caption: string;
}

interface PhotoGalleryProps {
  photos: GalleryPhoto[];
  /** Alt-text prefix, e.g. the street address. */
  subject: string;
  /** How many to show before the "show all" control. */
  initialCount?: number;
}

/**
 * Listing photo grid with a keyboard-navigable lightbox.
 *
 * Deliberately not a carousel: at an open house people scan the grid on a
 * phone and tap the one room they care about. A carousel forces them through
 * 28 photos in a fixed order to reach the basement.
 */
export default function PhotoGallery({ photos, subject, initialCount = 9 }: PhotoGalleryProps) {
  const [expanded, setExpanded] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);

  const shown = expanded ? photos : photos.slice(0, initialCount);
  const remaining = photos.length - shown.length;

  const close = useCallback(() => setLightbox(null), []);
  const prev = useCallback(
    () => setLightbox((i) => (i === null ? null : (i - 1 + photos.length) % photos.length)),
    [photos.length],
  );
  const next = useCallback(
    () => setLightbox((i) => (i === null ? null : (i + 1) % photos.length)),
    [photos.length],
  );

  // Keyboard control + scroll lock while the lightbox is open.
  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [lightbox, close, prev, next]);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {shown.map((photo, i) => (
          <button
            key={photo.src}
            type="button"
            onClick={() => setLightbox(i)}
            className="group relative text-left overflow-hidden rounded-lg bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            aria-label={`View photo ${i + 1} of ${photos.length}: ${photo.caption}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.src}
              alt={`${photo.caption} — ${subject}`}
              loading={i < 6 ? 'eager' : 'lazy'}
              width={1600}
              height={1064}
              className="w-full h-56 object-cover transition duration-300 group-hover:scale-[1.03]"
            />
            <span className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition bg-black/60 text-white rounded-md p-1.5">
              <Expand size={14} />
            </span>
            <span className="block px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-600">
              {photo.caption}
            </span>
          </button>
        ))}
      </div>

      {remaining > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-8 w-full sm:w-auto px-8 py-3.5 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-full hover:bg-slate-700 transition"
        >
          Show all {photos.length} photos
        </button>
      )}

      {lightbox !== null && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
        >
          <div className="flex items-center justify-between px-5 py-4 text-white shrink-0">
            <span className="text-xs font-bold uppercase tracking-widest tabular-nums">
              {lightbox + 1} / {photos.length}
            </span>
            <button
              type="button"
              onClick={close}
              aria-label="Close photo viewer"
              className="p-2 rounded-full hover:bg-white/10 transition"
            >
              <X size={22} />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center min-h-0 px-2">
            <button
              type="button"
              onClick={prev}
              aria-label="Previous photo"
              className="shrink-0 p-3 m-1 rounded-full text-white hover:bg-white/10 transition"
            >
              <ChevronLeft size={28} />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photos[lightbox].src}
              alt={`${photos[lightbox].caption} — ${subject}`}
              className="max-h-full max-w-full object-contain"
            />
            <button
              type="button"
              onClick={next}
              aria-label="Next photo"
              className="shrink-0 p-3 m-1 rounded-full text-white hover:bg-white/10 transition"
            >
              <ChevronRight size={28} />
            </button>
          </div>

          <p className="shrink-0 text-center text-white/80 text-sm px-6 py-5">
            {photos[lightbox].caption}
          </p>
        </div>
      )}
    </>
  );
}
