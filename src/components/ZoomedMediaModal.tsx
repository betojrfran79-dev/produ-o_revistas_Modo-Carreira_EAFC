import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Images, Pause, Play, X } from "lucide-react";
import { getEmbedOrVideoUrl } from "./MagazineReader";

export interface ZoomedMediaData {
  url: string;
  videoUrl?: string;
  videoStartTime?: number;
  videoEndTime?: number;
  type?: "image" | "video";
  title?: string;
  caption?: string;
  galleryUrls?: string[];
  currentIndex?: number;
}

interface ZoomedMediaModalProps {
  media: ZoomedMediaData;
  onClose: () => void;
}

function ZoomedVideoPlayer({
  src,
  startTime,
  endTime,
}: {
  src: string;
  startTime?: number;
  endTime?: number;
}) {
  const [loadError, setLoadError] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const videoInfo = getEmbedOrVideoUrl(src);

  if (videoInfo.type !== "direct") {
    const isYouTube = videoInfo.type === 'youtube';
    const label = isYouTube ? "Abrir no YouTube ↗" : "Abrir Vídeo ↗";
    return (
      <div className="relative flex flex-col items-center select-none">
        <iframe
          src={videoInfo.embedUrl}
          className="w-[85vw] max-w-4xl aspect-video rounded-xl shadow-2xl border border-zinc-800"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="mt-3 px-4 py-2 bg-zinc-900 hover:bg-amber-500 hover:text-zinc-950 text-white rounded-xl text-xs font-bold transition border border-zinc-800 shadow-md flex items-center gap-1.5 cursor-pointer no-underline"
        >
          {label}
        </a>
      </div>
    );
  }

  const handleTimeUpdate = () => {
    if (
      videoRef.current &&
      endTime !== undefined &&
      videoRef.current.currentTime >= endTime
    ) {
      videoRef.current.currentTime = startTime || 0;
    }
  };

  const videoSrc =
    startTime !== undefined && endTime !== undefined
      ? `${src}#t=${startTime},${endTime}`
      : src;

  if (loadError) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl flex flex-col items-center justify-center text-center space-y-3 max-w-sm shadow-xl select-none">
        <span className="text-4xl">⚠️</span>
        <h3 className="text-sm font-bold text-white font-sans">
          Vídeo não pôde ser carregado
        </h3>
        <p className="text-xs text-zinc-400 leading-relaxed font-sans">
          O link de vídeo não está acessível ou não permite reprodução externa.
        </p>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      src={videoSrc}
      controls
      autoPlay
      playsInline
      onTimeUpdate={handleTimeUpdate}
      onError={() => setLoadError(true)}
      className="max-w-full max-h-[70vh] rounded-xl object-contain shadow-2xl border border-zinc-800"
    />
  );
}

export default function ZoomedMediaModal({
  media,
  onClose,
}: ZoomedMediaModalProps) {
  const gallery =
    media.galleryUrls && media.galleryUrls.length > 0 ? media.galleryUrls : null;
  const [activeIdx, setActiveIdx] = useState(media.currentIndex || 0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [isZoomedIn, setIsZoomedIn] = useState(false);

  // Reset zoom when active image changes
  useEffect(() => {
    setIsZoomedIn(false);
  }, [activeIdx]);

  // Keep activeIdx within range if gallery changes
  useEffect(() => {
    if (gallery && activeIdx >= gallery.length) {
      setActiveIdx(0);
    }
  }, [gallery, activeIdx]);

  // Auto-advance if gallery exists and autoPlay is on (doesn't pause carousel in full screen)
  useEffect(() => {
    if (!isAutoPlay || !gallery || gallery.length <= 1) return;

    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % gallery.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [isAutoPlay, gallery]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (
        e.key === "ArrowLeft" &&
        gallery &&
        gallery.length > 1
      ) {
        setActiveIdx((prev) => (prev - 1 + gallery.length) % gallery.length);
      } else if (
        e.key === "ArrowRight" &&
        gallery &&
        gallery.length > 1
      ) {
        setActiveIdx((prev) => (prev + 1) % gallery.length);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gallery, onClose]);

  const currentImageUrl = gallery ? gallery[activeIdx] || media.url : media.url;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!gallery || gallery.length <= 1) return;
    setActiveIdx((prev) => (prev - 1 + gallery.length) % gallery.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!gallery || gallery.length <= 1) return;
    setActiveIdx((prev) => (prev + 1) % gallery.length);
  };

  return (
    <div
      className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex flex-col justify-between p-4 sm:p-6 transition-all duration-300 animate-fade-in select-none"
      onClick={onClose}
    >
      {/* Top Header Bar */}
      <div
        className="flex items-center justify-between w-full max-w-6xl mx-auto z-20 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          {gallery && gallery.length > 1 && (
            <div className="bg-zinc-900/90 border border-zinc-800 text-amber-400 px-3 py-1.5 rounded-xl text-xs font-mono font-bold shadow-md flex items-center gap-2">
              <Images className="w-4 h-4 text-amber-500" />
              <span>
                📸 {activeIdx + 1} / {gallery.length}
              </span>
              {isAutoPlay && (
                <span className="hidden sm:flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.5 rounded-full ml-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>Carrossel Ativo</span>
                </span>
              )}
            </div>
          )}

          {gallery && gallery.length > 1 && (
            <button
              type="button"
              onClick={() => setIsAutoPlay(!isAutoPlay)}
              className="bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white px-3 py-1.5 rounded-xl text-xs font-semibold border border-zinc-800 transition flex items-center gap-1.5 cursor-pointer"
              title={
                isAutoPlay
                  ? "Pausar rotação automática"
                  : "Ativar rotação automática"
              }
            >
              {isAutoPlay ? (
                <Pause className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Play className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span className="hidden sm:inline">
                {isAutoPlay ? "Pausar Auto" : "Auto-Play"}
              </span>
            </button>
          )}
        </div>

        <button
          onClick={onClose}
          className="px-4 py-2 bg-zinc-900 hover:bg-amber-500 hover:text-zinc-950 text-white rounded-xl text-xs font-bold transition border border-zinc-800 shadow-md flex items-center gap-1.5 cursor-pointer"
        >
          <X className="w-4 h-4 sm:hidden" />
          <span className="hidden sm:inline">Fechar</span>
          <span className="text-[10px] opacity-60 bg-zinc-800/80 px-1.5 py-0.5 rounded hidden sm:inline">
            Esc
          </span>
        </button>
      </div>

      {/* Main Content Area with Navigation Arrows */}
      <div
        className="relative max-w-6xl w-full my-auto flex items-center justify-center min-h-[45vh] max-h-[88vh] mx-auto group px-2 sm:px-12"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Navigation Arrow */}
        {gallery && gallery.length > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-1 sm:left-2 z-30 bg-zinc-900/90 hover:bg-amber-500 hover:text-zinc-950 text-white p-2.5 sm:p-4 rounded-full border border-zinc-700/80 shadow-2xl transition-all hover:scale-110 active:scale-95 cursor-pointer"
            title="Imagem Anterior (Seta Esquerda)"
          >
            <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>
        )}

        {/* Media Display */}
        {media.videoUrl ? (
          <ZoomedVideoPlayer
            src={media.videoUrl}
            startTime={media.videoStartTime}
            endTime={media.videoEndTime}
          />
        ) : (
          <div 
            onClick={(e) => {
              e.stopPropagation();
              setIsZoomedIn(!isZoomedIn);
            }}
            className={`relative flex items-center justify-center max-w-full max-h-[85vh] rounded-2xl border border-zinc-800/40 bg-zinc-950/20 overflow-hidden shadow-2xl transition-all duration-300 select-none ${
              isZoomedIn ? "cursor-zoom-out" : "cursor-zoom-in"
            }`}
          >
            <img
              key={activeIdx}
              src={currentImageUrl}
              alt={media.title || "Zoom"}
              className={`rounded-2xl object-contain transition-all duration-300 animate-fade-in ${
                isZoomedIn 
                  ? "max-w-[180%] max-h-[180vh] scale-150" 
                  : "max-w-full max-h-[85vh]"
              }`}
              referrerPolicy="no-referrer"
            />
            <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[9px] text-zinc-300 font-mono tracking-wider pointer-events-none border border-zinc-800/40">
              {isZoomedIn ? "🔍 CLIQUE PARA NORMAL" : "🔍 CLIQUE PARA AMPLIAR"}
            </div>
          </div>
        )}

        {/* Right Navigation Arrow */}
        {gallery && gallery.length > 1 && (
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-1 sm:right-2 z-30 bg-zinc-900/90 hover:bg-amber-500 hover:text-zinc-950 text-white p-2.5 sm:p-4 rounded-full border border-zinc-700/80 shadow-2xl transition-all hover:scale-110 active:scale-95 cursor-pointer"
            title="Próxima Imagem (Seta Direita)"
          >
            <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>
        )}
      </div>

      {/* Bottom Area: Thumbnails Strip & Title/Caption */}
      <div
        className="w-full max-w-4xl mx-auto space-y-2.5 z-20 shrink-0 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gallery Thumbnails Ribbon */}
        {gallery && gallery.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 overflow-x-auto py-1.5 px-2 max-w-full bg-zinc-900/80 border border-zinc-800/80 rounded-2xl backdrop-blur-md">
            {gallery.map((gUrl, gIdx) => (
              <button
                key={gIdx}
                type="button"
                onClick={() => setActiveIdx(gIdx)}
                className={`w-11 h-8 sm:w-16 sm:h-11 rounded-lg border-2 overflow-hidden shrink-0 transition-all cursor-pointer ${
                  activeIdx === gIdx
                    ? "border-amber-500 ring-2 ring-amber-500/50 scale-105 opacity-100"
                    : "border-transparent opacity-50 hover:opacity-100"
                }`}
              >
                <img
                  src={gUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {(media.title || media.caption) && (
          <div className="px-5 py-2.5 bg-zinc-900/90 rounded-2xl border border-zinc-800/80 backdrop-blur-md shadow-xl max-w-2xl mx-auto space-y-1">
            {media.title && (
              <h3 className="text-xs font-bold text-amber-500 font-sans uppercase tracking-widest">
                {media.title}
              </h3>
            )}
            {media.caption && (
              <p className="text-xs sm:text-sm text-zinc-200 font-serif italic font-medium leading-relaxed">
                "{media.caption}"
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
