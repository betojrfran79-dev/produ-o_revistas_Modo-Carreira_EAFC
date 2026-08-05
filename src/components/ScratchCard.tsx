import React, { useRef, useEffect, useState } from "react";
import { Sparkles, Eye, RotateCcw } from "lucide-react";

interface ScratchCardProps {
  imageUrl: string;
  coverText?: string;
  title?: string;
  caption?: string;
  onFullyRevealed?: () => void;
  className?: string;
}

export const ScratchCard: React.FC<ScratchCardProps> = ({
  imageUrl,
  coverText = "RASPE PARA REVELAR",
  title,
  caption,
  onFullyRevealed,
  className = ""
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [scratchPercent, setScratchPercent] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Initialize overlay canvas
  const initCanvas = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const width = rect.width || 600;
    const height = rect.height || 338; // ~16:9 aspect ratio

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Reset composite operation
    ctx.globalCompositeOperation = "source-over";

    // Draw luxury metallic gold cover background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#b45309"); // amber-700
    gradient.addColorStop(0.3, "#f59e0b"); // amber-500
    gradient.addColorStop(0.5, "#fef08a"); // yellow-200
    gradient.addColorStop(0.7, "#d97706"); // amber-600
    gradient.addColorStop(1, "#78350f"); // amber-900
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Add diagonal metallic pattern lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 2;
    for (let x = -height; x < width + height; x += 15) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + height, height);
      ctx.stroke();
    }

    // Add dark subtle border inside canvas
    ctx.strokeStyle = "rgba(0, 0, 0, 0.25)";
    ctx.lineWidth = 8;
    ctx.strokeRect(0, 0, width, height);

    // Draw central badge/text
    const badgeW = Math.min(width * 0.7, 320);
    const badgeH = 54;
    const badgeX = (width - badgeW) / 2;
    const badgeY = (height - badgeH) / 2;

    // Dark badge pill
    ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 27);
    ctx.fill();

    ctx.strokeStyle = "rgba(245, 158, 11, 0.8)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Text inside badge
    ctx.font = "900 13px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#fef08a";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("✨ " + (coverText || "RASPE PARA REVELAR").toUpperCase() + " 🪙", width / 2, height / 2);

    setIsRevealed(false);
    setScratchPercent(0);
  };

  useEffect(() => {
    initCanvas();
    const handleResize = () => initCanvas();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [coverText, imageUrl]);

  // Scratch action
  const scratch = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || isRevealed) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    const radius = Math.max(22, Math.min(canvas.width, canvas.height) / 12);
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    checkScratchPercentage();
  };

  const checkScratchPercentage = () => {
    const canvas = canvasRef.current;
    if (!canvas || isRevealed) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Sample pixels at low resolution to measure cleared area efficiently
    const w = canvas.width;
    const h = canvas.height;
    const imageData = ctx.getImageData(0, 0, w, h);
    const pixels = imageData.data;
    let transparentPixels = 0;
    const step = 32; // Sample every 8th pixel (4 bytes per pixel * 8 = 32)

    for (let i = 3; i < pixels.length; i += step) {
      if (pixels[i] < 128) {
        transparentPixels++;
      }
    }

    const totalSampled = pixels.length / step;
    const percent = Math.min(100, Math.round((transparentPixels / totalSampled) * 100));
    setScratchPercent(percent);

    if (percent > 45 && !isRevealed) {
      revealAll();
    }
  };

  const revealAll = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.globalCompositeOperation = "destination-out";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setIsRevealed(true);
    setScratchPercent(100);
    if (onFullyRevealed) onFullyRevealed();
  };

  const stopEvents = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    if (e.nativeEvent) {
      e.nativeEvent.stopPropagation();
      if (typeof e.nativeEvent.stopImmediatePropagation === "function") {
        e.nativeEvent.stopImmediatePropagation();
      }
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    stopEvents(e);
    setIsDrawing(true);
    scratch(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    stopEvents(e);
    if (!isDrawing) return;
    scratch(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    stopEvents(e);
    setIsDrawing(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    stopEvents(e);
    if (e.touches && e.touches[0]) {
      setIsDrawing(true);
      scratch(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    stopEvents(e);
    if (isDrawing && e.touches && e.touches[0]) {
      scratch(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    stopEvents(e);
    setIsDrawing(false);
  };

  return (
    <div
      className={`space-y-2 select-none ${className}`}
      onPointerDown={stopEvents}
      onMouseDown={stopEvents}
      onTouchStart={stopEvents}
    >
      <div
        ref={containerRef}
        className="relative aspect-video w-full rounded-xl overflow-hidden bg-zinc-950 border border-amber-500/30 shadow-lg group touch-none"
        style={{ touchAction: "none" }}
      >
        {/* Underneath Revealed Image */}
        <img
          src={imageUrl}
          alt={title || "Revelação"}
          onLoad={() => setImageLoaded(true)}
          className="w-full h-full object-cover select-none pointer-events-none"
          referrerPolicy="no-referrer"
        />

        {/* Top Scratch Canvas */}
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={(e) => { stopEvents(e); setIsDrawing(true); scratch(e.clientX, e.clientY); }}
          onMouseMove={(e) => { stopEvents(e); if (isDrawing) scratch(e.clientX, e.clientY); }}
          onMouseUp={(e) => { stopEvents(e); setIsDrawing(false); }}
          className={`absolute inset-0 w-full h-full cursor-crosshair transition-opacity duration-500 ${
            isRevealed ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
          style={{ touchAction: "none" }}
        />

        {/* Scratch Progress Overlay / Badge */}
        {!isRevealed && scratchPercent > 0 && (
          <div className="absolute top-2 left-2 bg-zinc-950/80 backdrop-blur-md text-amber-400 border border-amber-500/40 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1.5 shadow-md pointer-events-none">
            <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
            <span>{scratchPercent}% Revelado</span>
          </div>
        )}

        {isRevealed && (
          <div className="absolute top-2 right-2 bg-emerald-500/90 text-zinc-950 px-2.5 py-1 rounded-lg text-[10px] font-mono font-black flex items-center gap-1 shadow-md animate-fade-in pointer-events-none">
            ✓ REVELADO!
          </div>
        )}
      </div>

      {/* Control Action Buttons */}
      <div className="flex items-center justify-between gap-2 px-1">
        <p className="text-[10px] text-zinc-400 font-mono italic">
          💡 {isRevealed ? "Fato revelado com sucesso!" : "Passe o cursor ou o dedo sobre a cobertura dourada para raspar e revelar."}
        </p>

        <div className="flex items-center gap-1.5 shrink-0">
          {!isRevealed ? (
            <button
              type="button"
              onClick={revealAll}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-black rounded-lg text-xs transition flex items-center gap-1 shadow-md cursor-pointer active:scale-95"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Revelar Tudo</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={initCanvas}
              className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-lg text-xs transition flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Cubrir Novamente</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
