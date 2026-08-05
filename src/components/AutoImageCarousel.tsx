import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Images } from "lucide-react";

interface AutoImageCarouselProps {
  urls: string[];
  alt?: string;
  caption?: string;
  onZoom?: (url: string, index?: number, allUrls?: string[]) => void;
  intervalMs?: number; // default 5000ms (5 seconds)
  className?: string;
  badgePosition?: "top-left" | "top-right";
  showThumbnails?: boolean;
}

export default function AutoImageCarousel({
  urls,
  alt = "Imagem do carrossel",
  caption,
  onZoom,
  intervalMs = 5000,
  className = "",
  badgePosition = "top-left",
  showThumbnails = true,
}: AutoImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Reset index if urls array changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [urls]);

  // Auto advance every 5 seconds (5000ms) sequentially
  useEffect(() => {
    if (!urls || urls.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % urls.length);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [urls, intervalMs]);

  if (!urls || urls.length === 0) return null;

  const currentUrl = urls[currentIndex] || urls[0];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + urls.length) % urls.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % urls.length);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="aspect-video rounded-md overflow-hidden bg-zinc-950 border border-zinc-800 relative w-full flex items-center justify-center group">
        <img
          key={currentIndex}
          src={currentUrl}
          alt={`${alt} ${currentIndex + 1}`}
          className="w-full h-full object-contain cursor-pointer transition-opacity duration-500 animate-fade-in"
          referrerPolicy="no-referrer"
          onClick={() => onZoom && onZoom(currentUrl, currentIndex, urls)}
        />

        {/* Counter Badge */}
        <div
          className={`absolute top-2 ${
            badgePosition === "top-right" ? "right-2" : "left-2"
          } bg-amber-500 text-zinc-950 px-2 py-0.5 rounded text-[8px] font-mono font-extrabold shadow-md flex items-center gap-1 z-10 pointer-events-none`}
        >
          <Images className="w-2.5 h-2.5" />
          <span>📸 {currentIndex + 1} / {urls.length}</span>
          {urls.length > 1 && (
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-950 animate-ping ml-0.5" />
          )}
        </div>

        {/* Navigation Arrows on Hover */}
        {urls.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-amber-500 hover:text-zinc-950 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition cursor-pointer z-10"
              title="Anterior (Carrossel)"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-amber-500 hover:text-zinc-950 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition cursor-pointer z-10"
              title="Próxima (Carrossel)"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Pagination Dots */}
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10 bg-black/50 px-2 py-0.5 rounded-full backdrop-blur-xs">
              {urls.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(idx);
                  }}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    currentIndex === idx
                      ? "bg-amber-400 w-3.5"
                      : "bg-white/50 hover:bg-white w-1.5"
                  }`}
                  title={`Ir para imagem ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails list */}
      {showThumbnails && urls.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 overflow-x-auto py-1">
          {urls.map((gUrl: string, gIdx: number) => (
            <button
              key={gIdx}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(gIdx);
              }}
              className={`w-10 h-7 rounded border overflow-hidden shrink-0 transition cursor-pointer ${
                currentIndex === gIdx
                  ? "ring-2 ring-amber-500 border-amber-500 scale-105"
                  : "opacity-60 hover:opacity-100"
              }`}
            >
              <img src={gUrl} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {caption && (
        <p className="text-[9px] text-zinc-500 font-serif italic mt-1 text-center leading-relaxed">
          📸 {caption}
        </p>
      )}
    </div>
  );
}
