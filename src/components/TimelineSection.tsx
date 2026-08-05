import { useState, useRef } from "react";
import { TimelineEntry, CareerSettings, EntryType, MONTHS, MediaType } from "../types";
import { generateSampleTimeline, generateSportsGraphic } from "../utils/imageGenerator";
import { Plus, Trash2, Image as ImageIcon, Video as VideoIcon, Film, Calendar, FileText, Sparkles, Upload, GripVertical, ArrowUp, ArrowDown, Pencil, X, Globe, Link as LinkIcon, Check, ExternalLink, Layers, Code, Images } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ScratchCard } from "./ScratchCard";
import AutoImageCarousel from "./AutoImageCarousel";
import ZoomedMediaModal, { ZoomedMediaData } from "./ZoomedMediaModal";

interface TimelineSectionProps {
  entries: TimelineEntry[];
  settings: CareerSettings;
  onAddEntry: (entry: TimelineEntry) => void;
  onDeleteEntry: (id: string) => void;
  onBulkAdd: (entries: TimelineEntry[]) => void;
  onUpdateEntries: (entries: TimelineEntry[]) => void;
}

interface VideoTrimAndFramePickerProps {
  videoUrl: string;
  videoStartTime: number;
  videoEndTime: number;
  videoFrameTime: number;
  onStartTimeChange: (t: number) => void;
  onEndTimeChange: (t: number) => void;
  onFrameTimeChange: (t: number) => void;
  onCaptureFrame: (frameBase64: string, capturedTime: number) => void;
  mediaBase64?: string | null;
}

function VideoTrimAndFramePicker({
  videoUrl,
  videoStartTime,
  videoEndTime,
  videoFrameTime,
  onStartTimeChange,
  onEndTimeChange,
  onFrameTimeChange,
  onCaptureFrame,
  mediaBase64
}: VideoTrimAndFramePickerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState<number>(0);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [captureMsg, setCaptureMsg] = useState<string | null>(null);

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration || 0;
      setDuration(dur);
      if (videoEndTime === 0 || videoEndTime > dur) {
        onEndTimeChange(dur);
      }
    }
  };

  const [isTrimActive, setIsTrimActive] = useState<boolean>(() => {
    return videoStartTime > 0 || (videoEndTime > 0 && duration > 0 && Math.abs(videoEndTime - duration) > 1.5);
  });

  const handleToggleTrim = (active: boolean) => {
    setIsTrimActive(active);
    if (!active) {
      onStartTimeChange(0);
      onEndTimeChange(duration || 0);
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
      }
    }
  };

  const handleTimeUpdate = () => {
    if (isTrimActive && videoRef.current && videoEndTime > 0) {
      if (videoRef.current.currentTime >= videoEndTime) {
        videoRef.current.currentTime = videoStartTime;
      }
    }
  };

  const handleStartTimeInput = (val: number) => {
    const newStart = Math.max(0, Math.min(val, (duration || 600) - 0.5));
    onStartTimeChange(newStart);
    if (videoEndTime <= newStart) {
      onEndTimeChange(Math.min(duration || 600, newStart + 1));
    }
    if (videoRef.current) {
      videoRef.current.currentTime = newStart;
    }
  };

  const handleEndTimeInput = (val: number) => {
    const newEnd = Math.min(duration || 600, Math.max(val, videoStartTime + 0.5));
    onEndTimeChange(newEnd);
    if (videoRef.current) {
      videoRef.current.currentTime = newEnd;
    }
  };

  const captureCurrentFrame = (targetTime?: number, labelMsg?: string) => {
    if (!videoRef.current) return;
    setIsCapturing(true);
    const vid = videoRef.current;
    const timeToCapture = targetTime !== undefined ? targetTime : vid.currentTime;

    const doCanvasCapture = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 640;
        canvas.height = 360;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
          const base64 = canvas.toDataURL("image/jpeg", 0.85);
          onCaptureFrame(base64, timeToCapture);
          onFrameTimeChange(timeToCapture);
          setCaptureMsg(labelMsg || `✅ Capa atualizada com o frame do segundo ${timeToCapture.toFixed(1)}s!`);
          setTimeout(() => setCaptureMsg(null), 3500);
        }
      } catch (err) {
        console.warn("Failed frame capture:", err);
      } finally {
        setIsCapturing(false);
      }
    };

    if (Math.abs(vid.currentTime - timeToCapture) > 0.1) {
      const onSeeked = () => {
        vid.removeEventListener("seeked", onSeeked);
        doCanvasCapture();
      };
      vid.addEventListener("seeked", onSeeked);
      vid.currentTime = Math.min(duration || vid.duration || 0, Math.max(0, timeToCapture));
    } else {
      doCanvasCapture();
    }
  };

  const handleScrubFrame = (time: number) => {
    onFrameTimeChange(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const trimDuration = Math.max(0, videoEndTime - videoStartTime);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-zinc-100 space-y-4 shadow-xl my-2">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-amber-500" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 font-sans">
            Edição de Vídeo: Capa e Corte Opcional
          </h4>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
          {isTrimActive ? '✂️ Corte Ativado' : '🎥 Vídeo Completo'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        {/* Video Player */}
        <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-zinc-800 flex items-center justify-center group">
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            muted
            playsInline
            onLoadedMetadata={handleLoadedMetadata}
            onTimeUpdate={handleTimeUpdate}
            className="w-full h-full object-contain"
          />
          <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md px-2 py-1 rounded-md text-[9px] font-mono text-amber-400 border border-zinc-700">
            {isTrimActive ? `${videoStartTime.toFixed(1)}s ➔ ${videoEndTime.toFixed(1)}s (${trimDuration.toFixed(1)}s)` : `Sem corte (${(duration || 0).toFixed(1)}s)`}
          </div>
        </div>

        {/* Thumbnail Preview */}
        <div className="flex flex-col items-center justify-center bg-zinc-950/80 p-3 rounded-xl border border-zinc-800 space-y-2">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-bold">
            🖼️ Capa Selecionada para a Revista
          </span>
          <div className="aspect-video w-full max-w-[240px] bg-zinc-900 rounded-lg overflow-hidden border border-zinc-700 relative shadow-inner">
            {mediaBase64 ? (
              <img src={mediaBase64} alt="Capa Selecionada" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-500">
                Nenhum frame capturado
              </div>
            )}
            <div className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-[8px] font-mono text-amber-400">
              {videoFrameTime.toFixed(1)}s
            </div>
          </div>
          {captureMsg && (
            <span className="text-[10px] text-emerald-400 font-medium font-mono animate-fade-in text-center">
              {captureMsg}
            </span>
          )}
        </div>
      </div>

      {/* 1. Optional Video Trimming Controls */}
      <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isTrimActive}
              onChange={(e) => handleToggleTrim(e.target.checked)}
              className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500 bg-zinc-900 border-zinc-700"
            />
            <span className="text-xs font-bold text-zinc-200 font-sans">
              ✂️ Ativar corte de trecho do vídeo (Opcional)
            </span>
          </label>
          <span className="font-mono text-xs font-bold text-amber-400">
            {isTrimActive ? `Trecho: ${trimDuration.toFixed(1)}s` : `Duração Total: ${(duration || 0).toFixed(1)}s`}
          </span>
        </div>

        {isTrimActive ? (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-[10px] text-zinc-400 block mb-1 font-sans">Início do Corte (segundos)</label>
              <input
                type="number"
                step="0.5"
                min={0}
                max={Math.max(0, (duration || 600) - 0.5)}
                value={Number(videoStartTime.toFixed(1))}
                onChange={(e) => handleStartTimeInput(parseFloat(e.target.value) || 0)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-400 block mb-1 font-sans">Fim do Corte (segundos)</label>
              <input
                type="number"
                step="0.5"
                min={videoStartTime + 0.5}
                max={duration || 600}
                value={Number(videoEndTime.toFixed(1))}
                onChange={(e) => handleEndTimeInput(parseFloat(e.target.value) || 0)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>
        ) : (
          <p className="text-[11px] text-zinc-400 font-sans italic">
            O vídeo será executado do início ao fim sem nenhum corte de tempo.
          </p>
        )}
      </div>

      {/* 2. Intelligent Frame Picker */}
      <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 space-y-3">
        <span className="font-bold text-xs text-zinc-200 block font-sans">
          🎯 Escolha Inteligente da Capa / Thumbnail da Matéria
        </span>
        <p className="text-[11px] text-zinc-400 leading-tight font-sans">
          A Inteligência Artificial lê essa imagem para analisar o jogo. Selecione de forma ideal a **tela do resultado final da partida (com o placar)** ou a **comemoração do gol**.
        </p>

        {/* Quick Preset Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => captureCurrentFrame(Math.min(duration - 0.5, Math.max(1, duration * 0.85)), "🏆 Capa atualizada com a Tela de Resultado Final!")}
            disabled={isCapturing || duration === 0}
            className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer font-sans"
          >
            🏆 Resultado Final do Jogo
          </button>
          <button
            type="button"
            onClick={() => captureCurrentFrame(Math.min(duration - 0.5, Math.max(1, duration * 0.55)), "⚽ Capa atualizada com a Comemoração do Gol!")}
            disabled={isCapturing || duration === 0}
            className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer font-sans"
          >
            ⚽ Comemoração do Gol
          </button>
          <button
            type="button"
            onClick={() => captureCurrentFrame(undefined, "📸 Capa atualizada com o ponto atual do vídeo!")}
            disabled={isCapturing}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer font-sans"
          >
            📸 Capturar Ponto Atual
          </button>
        </div>

        {/* Scrub Slider */}
        <div className="space-y-1 pt-1">
          <div className="flex justify-between text-[10px] font-mono text-zinc-400">
            <span>Navegar no Vídeo para Escolher Frame:</span>
            <span className="text-amber-400 font-bold">{videoFrameTime.toFixed(1)}s</span>
          </div>
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={videoFrameTime}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              handleScrubFrame(val);
            }}
            onMouseUp={() => captureCurrentFrame(videoFrameTime)}
            onTouchEnd={() => captureCurrentFrame(videoFrameTime)}
            className="w-full accent-amber-500 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}

export default function TimelineSection({ entries, settings, onAddEntry, onDeleteEntry, onBulkAdd, onUpdateEntries }: TimelineSectionProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [month, setMonth] = useState("Janeiro (Pré-temporada)");
  const [season, setSeason] = useState(settings.season || "2024/2025");
  const [type, setType] = useState<EntryType>("match");
  const [activeSeasonTab, setActiveSeasonTab] = useState<string>(settings.season || "all");

  const [mediaBase64, setMediaBase64] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<MediaType | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);

  // Video trimming & frame selector states
  const [videoStartTime, setVideoStartTime] = useState<number>(0);
  const [videoEndTime, setVideoEndTime] = useState<number>(0);
  const [videoFrameTime, setVideoFrameTime] = useState<number>(0);

  const [dragActive, setDragActive] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const editPreviewVideoRef = useRef<HTMLVideoElement>(null);

  // Editing state variables
  const [editingEntry, setEditingEntry] = useState<TimelineEntry | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editMonth, setEditMonth] = useState("Janeiro (Pré-temporada)");
  const [editSeason, setEditSeason] = useState(settings.season || "2024/2025");
  const [editType, setEditType] = useState<EntryType>("match");
  const [editMediaBase64, setEditMediaBase64] = useState<string | null>(null);
  const [editMediaType, setEditMediaType] = useState<MediaType | null>(null);
  const [editVideoUrl, setEditVideoUrl] = useState<string | null>(null);
  const [editVideoBlob, setEditVideoBlob] = useState<Blob | null>(null);

  // Edit video trimming & frame selector states
  const [editVideoStartTime, setEditVideoStartTime] = useState<number>(0);
  const [editVideoEndTime, setEditVideoEndTime] = useState<number>(0);
  const [editVideoFrameTime, setEditVideoFrameTime] = useState<number>(0);

  const [isProcessingEditFile, setIsProcessingEditFile] = useState(false);
  const [editDragActive, setEditDragActive] = useState(false);

  // Media source tab states: upload | gallery | url | html | scratch
  const [mediaSourceTab, setMediaSourceTab] = useState<'upload' | 'gallery' | 'url' | 'html' | 'scratch'>('upload');
  const [externalUrlInput, setExternalUrlInput] = useState<string>('');
  const [externalUrlType, setExternalUrlType] = useState<MediaType>('video');
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [galleryUrlInput, setGalleryUrlInput] = useState<string>('');
  const [htmlCode, setHtmlCode] = useState<string>('');
  const [scratchCoverText, setScratchCoverText] = useState<string>('RASPE PARA REVELAR');

  const [editMediaSourceTab, setEditMediaSourceTab] = useState<'upload' | 'gallery' | 'url' | 'html' | 'scratch'>('upload');
  const [editExternalUrlInput, setEditExternalUrlInput] = useState<string>('');
  const [editExternalUrlType, setEditExternalUrlType] = useState<MediaType>('video');
  const [editGalleryUrls, setEditGalleryUrls] = useState<string[]>([]);
  const [editGalleryUrlInput, setEditGalleryUrlInput] = useState<string>('');
  const [editHtmlCode, setEditHtmlCode] = useState<string>('');
  const [editScratchCoverText, setEditScratchCoverText] = useState<string>('RASPE PARA REVELAR');

  const [notification, setNotification] = useState<{ type: 'error' | 'success' | 'info'; message: string } | null>(null);
  const [zoomedMedia, setZoomedMedia] = useState<ZoomedMediaData | null>(null);

  const showNotification = (message: string, type: 'error' | 'success' | 'info' = 'error') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(prev => prev && prev.message === message ? null : prev);
    }, 6000);
  };

  const applyExternalUrl = (isEdit: boolean = false) => {
    const inputUrl = (isEdit ? editExternalUrlInput : externalUrlInput).trim();
    const mediaTypeToApply = isEdit ? editExternalUrlType : externalUrlType;

    if (!inputUrl) {
      showNotification("Por favor, cole um link de vídeo ou imagem válido.", "error");
      return;
    }

    const isVideoLink = mediaTypeToApply === 'video' || /youtube\.com|youtu\.be|streamable\.com|vimeo\.com|\.mp4|\.webm|\.mov|\.m4v/i.test(inputUrl);

    if (isEdit) {
      if (isVideoLink) {
        setEditVideoUrl(inputUrl);
        setEditVideoBlob(null);
        setEditMediaType('video');
        if (!editMediaBase64 || editMediaBase64.length < 50) {
          const frameBase64 = generateSportsGraphic(
            'fc_card',
            editTitle.trim() || "Vídeo da Web",
            "Lance de Vídeo Externo",
            settings.teamName,
            settings.characterName
          );
          setEditMediaBase64(frameBase64);
        }
      } else {
        setEditMediaBase64(inputUrl);
        setEditMediaType('image');
        setEditVideoUrl(null);
        setEditVideoBlob(null);
      }
      showNotification("Link de mídia externo aplicado com sucesso!", "success");
    } else {
      if (isVideoLink) {
        setVideoUrl(inputUrl);
        setVideoBlob(null);
        setMediaType('video');
        if (!mediaBase64 || mediaBase64.length < 50) {
          const frameBase64 = generateSportsGraphic(
            'fc_card',
            title.trim() || "Vídeo da Web",
            "Lance de Vídeo Externo",
            settings.teamName,
            settings.characterName
          );
          setMediaBase64(frameBase64);
        }
      } else {
        setMediaBase64(inputUrl);
        setMediaType('image');
        setVideoUrl(null);
        setVideoBlob(null);
      }
      showNotification("Link de mídia externo aplicado com sucesso!", "success");
    }
  };

  const handleStartEdit = (entry: TimelineEntry) => {
    setEditingEntry(entry);
    setEditTitle(entry.title);
    setEditDescription(entry.description);
    setEditMonth(entry.month);
    setEditSeason(entry.season || settings.season || "2024/2025");
    setEditType(entry.type);
    setEditMediaBase64(entry.mediaUrl || null);
    setEditMediaType(entry.mediaType || null);
    setEditVideoUrl(entry.videoUrl || null);
    setEditVideoBlob(entry.videoBlob || null);
    setEditVideoStartTime(entry.videoStartTime !== undefined ? entry.videoStartTime : 0);
    setEditVideoEndTime(entry.videoEndTime !== undefined ? entry.videoEndTime : 0);
    setEditVideoFrameTime(entry.videoFrameTime !== undefined ? entry.videoFrameTime : 0);
    setEditGalleryUrls(entry.galleryUrls || []);
    setEditHtmlCode(entry.htmlCode || '');

    if (entry.mediaType === 'html' || entry.htmlCode) {
      setEditMediaSourceTab('html');
    } else if (entry.mediaType === 'gallery' || (entry.galleryUrls && entry.galleryUrls.length > 0)) {
      setEditMediaSourceTab('gallery');
    } else {
      const urlToSet = entry.videoUrl || (entry.mediaUrl?.startsWith('http') ? entry.mediaUrl : '');
      if (urlToSet && (urlToSet.startsWith('http://') || urlToSet.startsWith('https://'))) {
        setEditMediaSourceTab('url');
        setEditExternalUrlInput(urlToSet);
        setEditExternalUrlType(entry.mediaType === 'video' || entry.videoUrl ? 'video' : 'image');
      } else {
        setEditMediaSourceTab('upload');
        setEditExternalUrlInput('');
      }
    }
  };

  const handleGalleryFiles = (files: FileList | File[], isEdit: boolean = false) => {
    const validFiles = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (validFiles.length === 0) {
      showNotification("Por favor, selecione arquivos de imagem válidos para o carrossel.", "error");
      return;
    }
    const promises = validFiles.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises).then(newImages => {
      if (isEdit) {
        setEditGalleryUrls(prev => [...prev, ...newImages]);
        setEditMediaType('gallery');
      } else {
        setGalleryUrls(prev => [...prev, ...newImages]);
        setMediaType('gallery');
      }
      showNotification(`${newImages.length} foto(s) adicionada(s) ao carrossel!`, "success");
    });
  };

  const handleAddGalleryUrl = (isEdit: boolean = false) => {
    const input = isEdit ? editGalleryUrlInput.trim() : galleryUrlInput.trim();
    if (!input || (!input.startsWith("http://") && !input.startsWith("https://"))) {
      showNotification("Informe uma URL de imagem válida (começando com http:// ou https://).", "error");
      return;
    }
    if (isEdit) {
      setEditGalleryUrls(prev => [...prev, input]);
      setEditGalleryUrlInput('');
      setEditMediaType('gallery');
    } else {
      setGalleryUrls(prev => [...prev, input]);
      setGalleryUrlInput('');
      setMediaType('gallery');
    }
    showNotification("Imagem adicionada à galeria!", "success");
  };

  const handleRemoveGalleryImage = (index: number, isEdit: boolean = false) => {
    if (isEdit) {
      setEditGalleryUrls(prev => prev.filter((_, i) => i !== index));
    } else {
      setGalleryUrls(prev => prev.filter((_, i) => i !== index));
    }
  };

  // Video Frame extractor
  const extractVideoFrame = (file: File | Blob, targetTime?: number): Promise<{ base64: string; duration: number; frameTime: number }> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      
      const fileUrl = typeof file === 'string' ? file : URL.createObjectURL(file);
      
      const timeoutId = setTimeout(() => {
        if (typeof file !== 'string') URL.revokeObjectURL(fileUrl);
        reject(new Error("Timeout ao processar miniatura do vídeo."));
      }, 8000); // 8 seconds for large files

      video.src = fileUrl;
      
      video.onloadedmetadata = () => {
        const dur = video.duration || 5;
        let seekTo = targetTime;
        if (seekTo === undefined) {
          seekTo = Math.min(dur - 0.5, Math.max(0.5, dur * 0.7)); // Default seek ~70% into clip (usually end game screen or celebration)
        }
        video.currentTime = Math.min(dur - 0.1, Math.max(0, seekTo));
      };

      video.onseeked = () => {
        clearTimeout(timeoutId);
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 640;
          canvas.height = 360;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const base64 = canvas.toDataURL('image/jpeg', 0.85);
            resolve({
              base64,
              duration: video.duration || 0,
              frameTime: video.currentTime || 0
            });
          } else {
            reject(new Error("Não foi possível obter o contexto do canvas."));
          }
        } catch (err) {
          reject(err);
        } finally {
          if (typeof file !== 'string') URL.revokeObjectURL(fileUrl);
        }
      };

      video.onerror = () => {
        clearTimeout(timeoutId);
        if (typeof file !== 'string') URL.revokeObjectURL(fileUrl);
        reject(new Error("Erro ao abrir ou decodificar arquivo de vídeo."));
      };
    });
  };

  const handleEditFile = async (file: File) => {
    setIsProcessingEditFile(true);
    try {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setEditMediaBase64(e.target?.result as string);
          setEditMediaType('image');
          setEditVideoUrl(null);
          setIsProcessingEditFile(false);
        };
        reader.readAsDataURL(file);
      } else if (file.type.startsWith("video/")) {
        const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB
        if (file.size > MAX_VIDEO_SIZE) {
          showNotification("O arquivo de vídeo é muito grande (máximo 500MB). Por favor, selecione um clipe menor ou mais curto.", "error");
          setIsProcessingEditFile(false);
          return;
        }

        const objectUrl = URL.createObjectURL(file);
        setEditVideoUrl(objectUrl);
        setEditVideoBlob(file);

        let frameBase64 = "";
        let dur = 20;
        let frameT = 0;
        try {
          const res = await extractVideoFrame(file);
          frameBase64 = res.base64;
          dur = res.duration;
          frameT = res.frameTime;
        } catch (e) {
          console.warn("Failed to extract video frame, falling back to generated sports graphic:", e);
          frameBase64 = generateSportsGraphic(
            'fc_card',
            editTitle.trim() || "Destaque de Vídeo",
            "Lance de vídeo gravado da partida",
            settings.teamName,
            settings.characterName
          );
        }
        setEditMediaBase64(frameBase64);
        setEditMediaType('video');
        setEditVideoStartTime(0);
        setEditVideoEndTime(dur);
        setEditVideoFrameTime(frameT);
        setIsProcessingEditFile(false);
      } else {
        showNotification("Formato de arquivo não suportado. Por favor, envie uma Imagem ou Vídeo.", "error");
        setIsProcessingEditFile(false);
      }
    } catch (err: any) {
      showNotification("Erro ao processar arquivo: " + err.message, "error");
      setIsProcessingEditFile(false);
    }
  };

  const handleEditDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setEditDragActive(true);
    } else if (e.type === "dragleave") {
      setEditDragActive(false);
    }
  };

  const handleEditDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleEditFile(e.dataTransfer.files[0]);
    }
  };

  const handleEditFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleEditFile(e.target.files[0]);
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;
    if (!editTitle.trim() || !editDescription.trim()) {
      showNotification("Por favor, preencha o título e a descrição da postagem.", "error");
      return;
    }

    let finalMediaType: MediaType | undefined = editMediaType || undefined;
    let finalMediaUrl = editMediaBase64 || undefined;
    let finalGalleryUrls: string[] | undefined = undefined;
    let finalHtmlCode: string | undefined = undefined;

    if (editMediaSourceTab === 'html') {
      finalMediaType = 'html';
      finalHtmlCode = editHtmlCode.trim() || undefined;
    } else if (editMediaSourceTab === 'gallery') {
      finalMediaType = 'gallery';
      finalGalleryUrls = editGalleryUrls.length > 0 ? editGalleryUrls : undefined;
      finalMediaUrl = editGalleryUrls.length > 0 ? editGalleryUrls[0] : undefined;
    }

    const updatedEntry: TimelineEntry = {
      ...editingEntry,
      title: editTitle.trim(),
      description: editDescription.trim(),
      month: editMonth,
      season: editSeason.trim() || settings.season || "2024/2025",
      type: editType,
      mediaUrl: finalMediaUrl,
      mediaType: finalMediaType,
      galleryUrls: finalGalleryUrls,
      htmlCode: finalHtmlCode,
      videoUrl: editVideoUrl || undefined,
      videoBlob: editVideoBlob || undefined,
      videoStartTime: editMediaType === 'video' ? editVideoStartTime : undefined,
      videoEndTime: editMediaType === 'video' ? editVideoEndTime : undefined,
      videoFrameTime: editMediaType === 'video' ? editVideoFrameTime : undefined,
    };

    const updatedAllEntries = entries.map(item => item.id === editingEntry.id ? updatedEntry : item);
    onUpdateEntries(updatedAllEntries);
    setEditingEntry(null);
    showNotification("Destaque da linha do tempo atualizado com sucesso!", "success");
  };

  const handleFile = async (file: File) => {
    setIsProcessingFile(true);
    try {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setMediaBase64(e.target?.result as string);
          setMediaType('image');
          setVideoUrl(null);
          setIsProcessingFile(false);
        };
        reader.readAsDataURL(file);
      } else if (file.type.startsWith("video/")) {
        const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB
        if (file.size > MAX_VIDEO_SIZE) {
          showNotification("O arquivo de vídeo é muito grande (máximo 500MB). Por favor, selecione um clipe menor ou mais curto.", "error");
          setIsProcessingFile(false);
          return;
        }

        const objectUrl = URL.createObjectURL(file);
        setVideoUrl(objectUrl);
        setVideoBlob(file);

        let frameBase64 = "";
        let dur = 20;
        let frameT = 0;
        try {
          const res = await extractVideoFrame(file);
          frameBase64 = res.base64;
          dur = res.duration;
          frameT = res.frameTime;
        } catch (e) {
          console.warn("Failed to extract video frame, falling back to generated sports graphic:", e);
          frameBase64 = generateSportsGraphic(
            'fc_card',
            title.trim() || "Destaque de Vídeo",
            "Lance de vídeo gravado da partida",
            settings.teamName,
            settings.characterName
          );
        }
        setMediaBase64(frameBase64);
        setMediaType('video');
        setVideoStartTime(0);
        setVideoEndTime(dur);
        setVideoFrameTime(frameT);
        setIsProcessingFile(false);
      } else {
        showNotification("Formato de arquivo não suportado. Por favor, envie uma Imagem ou Vídeo.", "error");
        setIsProcessingFile(false);
      }
    } catch (err: any) {
      showNotification("Erro ao processar arquivo: " + err.message, "error");
      setIsProcessingFile(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      showNotification("Por favor, preencha o título e a descrição da postagem.", "error");
      return;
    }

    let finalMediaType: MediaType | undefined = mediaType || undefined;
    let finalMediaUrl = mediaBase64 || undefined;
    let finalGalleryUrls: string[] | undefined = undefined;
    let finalHtmlCode: string | undefined = undefined;

    if (mediaSourceTab === 'html') {
      finalMediaType = 'html';
      finalHtmlCode = htmlCode.trim() || undefined;
    } else if (mediaSourceTab === 'gallery') {
      finalMediaType = 'gallery';
      finalGalleryUrls = galleryUrls.length > 0 ? galleryUrls : undefined;
      finalMediaUrl = galleryUrls.length > 0 ? galleryUrls[0] : undefined;
    }

    const newEntry: TimelineEntry = {
      id: "entry_" + Math.random().toString(36).substr(2, 9),
      title: title.trim(),
      description: description.trim(),
      month,
      season: season.trim() || settings.season || "2024/2025",
      type,
      mediaUrl: finalMediaUrl,
      mediaType: finalMediaType,
      galleryUrls: finalGalleryUrls,
      htmlCode: finalHtmlCode,
      videoUrl: videoUrl || undefined,
      videoBlob: videoBlob || undefined,
      videoStartTime: mediaType === 'video' ? videoStartTime : undefined,
      videoEndTime: mediaType === 'video' ? videoEndTime : undefined,
      videoFrameTime: mediaType === 'video' ? videoFrameTime : undefined,
      createdAt: Date.now()
    };

    onAddEntry(newEntry);
    
    // Reset Form
    setTitle("");
    setDescription("");
    setMediaBase64(null);
    setMediaType(null);
    setVideoUrl(null);
    setVideoBlob(null);
    setVideoStartTime(0);
    setVideoEndTime(0);
    setVideoFrameTime(0);
    setGalleryUrls([]);
    setGalleryUrlInput("");
    setHtmlCode("");
    setShowAddForm(false);
    showNotification("Novo fato adicionado com sucesso!", "success");
  };

  const handleGenerateSample = () => {
    const targetSeason = activeSeasonTab !== 'all' ? activeSeasonTab : settings.season || "2024/2025";
    if (confirm(`Gostaria de carregar uma temporada de exemplo autocompletada para a temporada ${targetSeason}? Isso adicionará 5 destaques realistas (jogos, premiações, lesões) com imagens esportivas temáticas!`)) {
      const samples = generateSampleTimeline(settings.teamName, settings.characterName, targetSeason);
      onBulkAdd(samples);
    }
  };

  const getTypeIcon = (type: EntryType) => {
    switch (type) {
      case 'match': return "⚽";
      case 'transfer': return "🤝";
      case 'injury': return "🏥";
      case 'training': return "🏃";
      case 'award': return "🏆";
      default: return "📝";
    }
  };

  const getTypeNamePT = (type: EntryType) => {
    switch (type) {
      case 'match': return "Partida";
      case 'transfer': return "Transferência";
      case 'injury': return "Lesão";
      case 'training': return "Treino";
      case 'award': return "Premiação";
      default: return "Outro";
    }
  };

  // Get list of unique seasons from entries + active settings.season
  const availableSeasons = Array.from(
    new Set([
      ...(settings.season ? [settings.season] : []),
      ...entries.map(e => e.season || settings.season || "2024/2025")
    ].filter(Boolean))
  ).sort();

  // Filter entries based on activeSeasonTab
  const filteredEntries = activeSeasonTab === 'all'
    ? entries
    : entries.filter(e => (e.season || settings.season || "2024/2025") === activeSeasonTab);

  // Sort entries chronologically based on MONTHS indices, and order within same month
  const sortedEntries = [...filteredEntries].sort((a, b) => {
    const idxA = MONTHS.indexOf(a.month);
    const idxB = MONTHS.indexOf(b.month);
    if (idxA !== idxB) return idxA - idxB;
    
    const orderA = a.sortOrder !== undefined ? a.sortOrder : a.createdAt;
    const orderB = b.sortOrder !== undefined ? b.sortOrder : b.createdAt;
    return orderA - orderB; // Oldest or lowest custom order first so it reads chronologically
  });

  // Drag and Drop handlers for Timeline events
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggingId || draggingId === targetId) return;

    const draggingEntry = entries.find(item => item.id === draggingId);
    const targetEntry = entries.find(item => item.id === targetId);

    if (!draggingEntry || !targetEntry) return;

    // Only allow dragging/reordering within the same month!
    if (draggingEntry.month === targetEntry.month) {
      setDragOverId(targetId);
    }
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleElementDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOverId(null);
    if (!draggingId || draggingId === targetId) {
      setDraggingId(null);
      return;
    }

    const draggingEntry = entries.find(item => item.id === draggingId);
    const targetEntry = entries.find(item => item.id === targetId);

    if (!draggingEntry || !targetEntry || draggingEntry.month !== targetEntry.month) {
      setDraggingId(null);
      return;
    }

    // Get all entries for this specific month
    const monthEntries = sortedEntries.filter(item => item.month === draggingEntry.month);
    
    const draggingIdx = monthEntries.findIndex(item => item.id === draggingId);
    const targetIdx = monthEntries.findIndex(item => item.id === targetId);

    if (draggingIdx === -1 || targetIdx === -1) {
      setDraggingId(null);
      return;
    }

    // Reorder the month entries array
    const reorderedMonthEntries = [...monthEntries];
    const [removed] = reorderedMonthEntries.splice(draggingIdx, 1);
    reorderedMonthEntries.splice(targetIdx, 0, removed);

    // Update their sortOrder based on their index in the reordered array
    const updatedMonthEntries = reorderedMonthEntries.map((item, index) => ({
      ...item,
      sortOrder: index * 10
    }));

    // Build the new overall entries list
    const updatedAllEntries = entries.map(item => {
      const match = updatedMonthEntries.find(u => u.id === item.id);
      return match ? match : item;
    });

    onUpdateEntries(updatedAllEntries);
    setDraggingId(null);
  };

  const moveEntry = (id: string, direction: 'up' | 'down') => {
    const entry = entries.find(item => item.id === id);
    if (!entry) return;

    // Get all sorted entries for this month
    const monthEntries = sortedEntries.filter(item => item.month === entry.month);
    const idx = monthEntries.findIndex(item => item.id === id);
    if (idx === -1) return;

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= monthEntries.length) return; // Out of bounds

    const reorderedMonthEntries = [...monthEntries];
    const [removed] = reorderedMonthEntries.splice(idx, 1);
    reorderedMonthEntries.splice(targetIdx, 0, removed);

    const updatedMonthEntries = reorderedMonthEntries.map((item, index) => ({
      ...item,
      sortOrder: index * 10
    }));

    const updatedAllEntries = entries.map(item => {
      const match = updatedMonthEntries.find(u => u.id === item.id);
      return match ? match : item;
    });

    onUpdateEntries(updatedAllEntries);
  };

  return (
    <div className="space-y-6">
      {/* Floating Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
          >
            <div className={`p-4 rounded-xl border shadow-lg flex items-start gap-3 backdrop-blur-md ${
              notification.type === 'error' 
                ? 'bg-red-500/10 border-red-500/20 text-red-950' 
                : notification.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-950'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-950'
            }`}>
              <span className="text-lg">
                {notification.type === 'error' ? '❌' : notification.type === 'success' ? '✅' : '⚠️'}
              </span>
              <div className="flex-1">
                <p className="text-xs font-semibold leading-relaxed">
                  {notification.message}
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setNotification(null)}
                className="text-zinc-400 hover:text-zinc-600 transition text-xs font-bold px-1"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timeline Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-zinc-950 flex items-center gap-2">
            📂 Repositório da Temporada
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Aqui ficam salvos os registros da temporada do seu personagem ({settings.characterName} no {settings.teamName}). O Gemini consultará esse repositório para escrever as revistas.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleGenerateSample}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-amber-700 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 rounded-xl transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" /> Temporada de Exemplo
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-zinc-950 hover:bg-zinc-900 rounded-xl transition shadow-md shadow-zinc-950/10 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Novo Registro
          </button>
        </div>
      </div>

      {/* Season Tabs Navigation Bar */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-3 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-mono mr-1 flex items-center gap-1 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-amber-500" /> Temporadas:
          </span>

          <button
            type="button"
            onClick={() => setActiveSeasonTab("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeSeasonTab === "all"
                ? "bg-zinc-950 text-white shadow-md shadow-zinc-950/20"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900"
            }`}
          >
            <span>Todas as Temporadas</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold ${
              activeSeasonTab === "all" ? "bg-amber-400 text-zinc-950" : "bg-zinc-200 text-zinc-700"
            }`}>
              {entries.length}
            </span>
          </button>

          {availableSeasons.map((s) => {
            const seasonEntriesCount = entries.filter(e => (e.season || settings.season || "2024/2025") === s).length;
            const isCurrentActiveSetting = s === settings.season;
            return (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setActiveSeasonTab(s);
                  setSeason(s);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  activeSeasonTab === s
                    ? "bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20 font-black"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900"
                }`}
              >
                <span>Temporada {s}</span>
                {isCurrentActiveSetting && (
                  <span className={`text-[9px] uppercase px-1 py-0.2 rounded font-black ${
                    activeSeasonTab === s ? "bg-zinc-950/20 text-zinc-950" : "bg-amber-500/20 text-amber-800"
                  }`}>
                    Ativa
                  </span>
                )}
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold ${
                  activeSeasonTab === s ? "bg-zinc-950 text-amber-400" : "bg-zinc-200 text-zinc-700"
                }`}>
                  {seasonEntriesCount}
                </span>
              </button>
            );
          })}
        </div>

        {/* Quick Season Indicator / Active Tab Status */}
        <div className="text-[11px] font-medium text-zinc-500 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-100 flex items-center justify-between sm:justify-end gap-2">
          <span>Exibindo: <strong className="text-zinc-900">{activeSeasonTab === 'all' ? 'Todas as Temporadas' : `Temporada ${activeSeasonTab}`}</strong></span>
          <span className="text-zinc-400 font-mono text-[10px]">({sortedEntries.length} {sortedEntries.length === 1 ? 'fato' : 'fatos'})</span>
        </div>
      </div>

      {/* Add New Entry Form Drawer */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleAddSubmit} className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-md space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <h3 className="font-bold text-zinc-900 text-sm">Adicionar Novo Destaque da Carreira</h3>
                <button 
                  type="button" 
                  onClick={() => setShowAddForm(false)} 
                  className="text-xs text-zinc-400 hover:text-zinc-600"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Form Text Inputs */}
                <div className="md:col-span-2 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Season */}
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-zinc-600">Temporada</label>
                      <input
                        type="text"
                        value={season}
                        onChange={(e) => setSeason(e.target.value)}
                        placeholder="ex: 2024/2025"
                        className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 text-sm outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                      />
                    </div>

                    {/* Month */}
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-zinc-600">Calendário (Mês)</label>
                      <select
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 text-sm outline-none focus:ring-1 focus:ring-amber-500"
                      >
                        {MONTHS.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>

                    {/* Category Type */}
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-zinc-600">Tipo de Destaque</label>
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value as EntryType)}
                        className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 text-sm outline-none focus:ring-1 focus:ring-amber-500"
                      >
                        <option value="match">⚽ Partida (Gols, Assistências, Atuação)</option>
                        <option value="transfer">🤝 Transferência / Renovação</option>
                        <option value="injury">🏥 Lesão / Recuperação</option>
                        <option value="training">🏃 Treino / Evolução de Atributos</option>
                        <option value="award">🏆 Premiação (Título, Seleção da Semana)</option>
                        <option value="other">📝 Outro Evento da Carreira</option>
                      </select>
                    </div>
                  </div>

                  {/* Title */}
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-zinc-600">Título do Evento</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Hat-trick contra o Arsenal ou Campeão da Copa do Rei"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 text-sm outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-zinc-600">O que aconteceu? (Descrição Detalhada)</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Descreva a partida ou evento com os seus detalhes! Quem fez os gols? Como foi a jogada? Que minuto aconteceu? O jornalista utilizará essa riqueza de detalhes na narrativa."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 text-sm outline-none focus:ring-1 focus:ring-amber-500 resize-none"
                    />
                  </div>
                </div>

                {/* Media Uploader Box */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="block text-xs font-medium text-zinc-600 flex items-center gap-1 font-sans">
                      <ImageIcon className="w-3.5 h-3.5 text-zinc-500" /> Mídia Anexa do Fato
                    </label>

                    {/* Source Tabs */}
                    <div className="flex flex-wrap bg-zinc-100 p-0.5 rounded-lg text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => setMediaSourceTab('upload')}
                        className={`px-2 py-1 rounded-md transition flex items-center gap-1 cursor-pointer ${
                          mediaSourceTab === 'upload' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-500 hover:text-zinc-800'
                        }`}
                      >
                        <Upload className="w-3 h-3" />
                        <span>Arquivo Local</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setMediaSourceTab('gallery')}
                        className={`px-2 py-1 rounded-md transition flex items-center gap-1 cursor-pointer ${
                          mediaSourceTab === 'gallery' ? 'bg-amber-500 text-zinc-950 shadow-xs font-black' : 'text-zinc-500 hover:text-zinc-800'
                        }`}
                      >
                        <Images className="w-3 h-3" />
                        <span>Carrossel ({galleryUrls.length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setMediaSourceTab('url')}
                        className={`px-2 py-1 rounded-md transition flex items-center gap-1 cursor-pointer ${
                          mediaSourceTab === 'url' ? 'bg-amber-500 text-zinc-950 shadow-xs font-black' : 'text-zinc-500 hover:text-zinc-800'
                        }`}
                      >
                        <Globe className="w-3 h-3" />
                        <span>Link Web</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setMediaSourceTab('html')}
                        className={`px-2 py-1 rounded-md transition flex items-center gap-1 cursor-pointer ${
                          mediaSourceTab === 'html' ? 'bg-blue-600 text-white shadow-xs font-black' : 'text-zinc-500 hover:text-zinc-800'
                        }`}
                      >
                        <Code className="w-3 h-3" />
                        <span>HTML / Canvas</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setMediaSourceTab('scratch');
                          if (!mediaBase64) {
                            // Generate sample graphic if no image uploaded yet
                            setMediaBase64(generateSportsGraphic('fc_card', title || 'Contratação Bombástica', 'Anúncio Secreto de Elenco', settings.teamName, settings.characterName));
                          }
                          setMediaType('scratch');
                        }}
                        className={`px-2 py-1 rounded-md transition flex items-center gap-1 cursor-pointer ${
                          mediaSourceTab === 'scratch' ? 'bg-amber-500 text-zinc-950 shadow-xs font-black ring-1 ring-amber-400' : 'text-amber-600 font-bold hover:text-amber-800'
                        }`}
                      >
                        <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
                        <span>Raspadinha 🪙</span>
                      </button>
                    </div>
                  </div>
                  
                  {mediaSourceTab === 'upload' && (
                    <div
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center h-[210px] relative overflow-hidden ${
                        dragActive 
                          ? "border-amber-500 bg-amber-500/5" 
                          : "border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 bg-zinc-50"
                      }`}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileInputChange}
                        accept="image/*,video/*"
                        className="hidden"
                      />

                      {isProcessingFile ? (
                        <div className="space-y-2">
                          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                          <p className="text-xs text-zinc-500 font-mono">Processando arquivo...</p>
                        </div>
                      ) : mediaBase64 ? (
                        <div className="absolute inset-0 group">
                          <img 
                            src={mediaBase64} 
                            alt="Thumbnail" 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-sans">
                            <Upload className="w-4 h-4 mr-1" /> Substituir arquivo
                          </div>
                          {mediaType === 'video' && (
                            <div className="absolute top-2 right-2 bg-zinc-950/80 px-2 py-0.5 rounded text-[9px] text-white font-mono flex items-center gap-1">
                              <Film className="w-2.5 h-2.5 text-amber-400" /> VÍDEO
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="p-3 bg-white border border-zinc-100 rounded-full shadow-sm max-w-max mx-auto text-zinc-400 group-hover:text-amber-500 transition">
                            <Upload className="w-6 h-6" />
                          </div>
                          <p className="text-xs font-semibold text-zinc-800">Arraste ou clique para enviar</p>
                          <p className="text-[10px] text-zinc-400">Suporta Imagem única ou Vídeo (MP4, WEBM, até 500MB)</p>
                        </div>
                      )}
                    </div>
                  )}

                  {mediaSourceTab === 'gallery' && (
                    <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 space-y-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-zinc-700 flex items-center gap-1 font-sans">
                          <Images className="w-3.5 h-3.5 text-amber-500" />
                          <span>Carrossel de Fotos do Fato ({galleryUrls.length} imagens):</span>
                        </label>
                        <p className="text-[10px] text-zinc-500">
                          Envie múltiplas fotos em lote ou cole links de imagens da internet para criar um carrossel interativo na matéria!
                        </p>
                      </div>

                      {/* Multiple Files Upload Input */}
                      <div className="flex gap-2">
                        <label className="flex-1 border-2 border-dashed border-zinc-300 hover:border-amber-500 bg-white hover:bg-amber-50/20 rounded-xl p-3 text-center cursor-pointer transition flex items-center justify-center gap-2 text-xs font-bold text-zinc-700">
                          <Upload className="w-4 h-4 text-amber-500" />
                          <span>Adicionar fotos do computador</span>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files) handleGalleryFiles(e.target.files, false);
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {/* Add Image URL to Gallery */}
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={galleryUrlInput}
                          onChange={(e) => setGalleryUrlInput(e.target.value)}
                          placeholder="Ou cole a URL de uma foto (https://...)"
                          className="flex-1 px-3 py-2 text-xs bg-white border border-zinc-200 rounded-lg outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddGalleryUrl(false)}
                          className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded-lg transition shrink-0 flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 text-amber-400" />
                          <span>Adicionar URL</span>
                        </button>
                      </div>

                      {/* Gallery Grid */}
                      {galleryUrls.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-2 border-t border-zinc-200">
                          {galleryUrls.map((url, idx) => (
                            <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-zinc-300 group bg-black/10">
                              <img src={url} alt={`Slide ${idx + 1}`} className="w-full h-full object-cover" />
                              <span className="absolute top-1 left-1 bg-black/70 text-white text-[9px] font-mono px-1 rounded">
                                #{idx + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveGalleryImage(idx, false)}
                                className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition cursor-pointer"
                                title="Remover foto"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-xs text-zinc-400 border border-dashed border-zinc-200 rounded-lg bg-white">
                          Nenhuma foto adicionada ao carrossel ainda.
                        </div>
                      )}
                    </div>
                  )}

                  {mediaSourceTab === 'url' && (
                    <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-zinc-700 flex items-center gap-1 font-sans">
                          <LinkIcon className="w-3 h-3 text-amber-500" />
                          <span>Cole a URL do Vídeo ou Imagem:</span>
                        </label>
                        
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={externalUrlInput}
                            onChange={(e) => setExternalUrlInput(e.target.value)}
                            placeholder="Ex: https://streamable.com/xyz, https://youtu.be/... ou https://i.imgur.com/foto.jpg"
                            className="flex-1 px-3 py-2 text-xs bg-white border border-zinc-200 rounded-lg outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => applyExternalUrl(false)}
                            className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded-lg transition shrink-0 flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5 text-amber-400" />
                            <span>Aplicar Link</span>
                          </button>
                        </div>
                      </div>

                      {/* Type toggle selector */}
                      <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-zinc-200/60 text-xs">
                        <span className="text-[10px] text-zinc-500 font-medium font-sans">Tipo do link:</span>
                        <label className="flex items-center gap-1.5 text-zinc-700 text-[11px] cursor-pointer select-none">
                          <input
                            type="radio"
                            name="addUrlType"
                            checked={externalUrlType === 'video'}
                            onChange={() => setExternalUrlType('video')}
                            className="text-amber-500 focus:ring-amber-500"
                          />
                          <Film className="w-3 h-3 text-amber-600" />
                          <span>Vídeo (Streamable, YouTube, MP4, Vimeo)</span>
                        </label>
                        <label className="flex items-center gap-1.5 text-zinc-700 text-[11px] cursor-pointer select-none">
                          <input
                            type="radio"
                            name="addUrlType"
                            checked={externalUrlType === 'image'}
                            onChange={() => setExternalUrlType('image')}
                            className="text-amber-500 focus:ring-amber-500"
                          />
                          <ImageIcon className="w-3 h-3 text-blue-600" />
                          <span>Imagem (Imgur, Postimages, PNG/JPG)</span>
                        </label>
                      </div>

                      {/* Video Hosting Suggestions */}
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 text-[10px] text-zinc-700 space-y-1">
                        <p className="font-bold text-amber-900 flex items-center gap-1">
                          💡 Onde salvar vídeos gratuitamente para usar o link:
                        </p>
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          <a href="https://streamable.com" target="_blank" rel="noreferrer" className="bg-white hover:bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded text-zinc-800 font-mono flex items-center gap-1 transition">
                            <span>Streamable (Recomendado)</span> <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                          </a>
                          <a href="https://youtube.com" target="_blank" rel="noreferrer" className="bg-white hover:bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded text-zinc-800 font-mono flex items-center gap-1 transition">
                            <span>YouTube / Shorts</span> <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                          </a>
                          <a href="https://imgur.com" target="_blank" rel="noreferrer" className="bg-white hover:bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded text-zinc-800 font-mono flex items-center gap-1 transition">
                            <span>Imgur</span> <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {mediaSourceTab === 'scratch' && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 space-y-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-amber-950 flex items-center gap-1 font-sans">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                          <span>Efeito Raspadinha Interativa (Revelação Surpresa):</span>
                        </label>
                        <p className="text-[10px] text-zinc-600 leading-relaxed">
                          Ideal para criar expectativa! O leitor da matéria precisará passar o cursor/dedo para raspar a cobertura dourada e descobrir a imagem secreta por trás (ex: reforço bombástico, placar, troféu).
                        </p>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-700">
                          Texto da Cobertura Dourada:
                        </label>
                        <input
                          type="text"
                          value={scratchCoverText}
                          onChange={(e) => setScratchCoverText(e.target.value)}
                          placeholder="Ex: RASPE PARA REVELAR O NOVO CAMISA 10"
                          className="w-full px-3 py-1.5 text-xs bg-white border border-amber-300 rounded-lg font-bold text-amber-900 outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>

                      {/* Image selector for background */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-700 block">
                          Imagem Oculta por Trás da Cobertura:
                        </label>
                        <div className="flex gap-2">
                          <label className="flex-1 border-2 border-dashed border-amber-300 hover:border-amber-500 bg-white hover:bg-amber-50/50 rounded-lg p-2 text-center cursor-pointer transition flex items-center justify-center gap-1.5 text-xs font-bold text-amber-900">
                            <Upload className="w-3.5 h-3.5 text-amber-600" />
                            <span>{mediaBase64 ? 'Trocar Imagem Oculta' : 'Enviar Imagem para Ocultar'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  const reader = new FileReader();
                                  reader.onload = (ev) => {
                                    setMediaBase64(ev.target?.result as string);
                                    setMediaType('scratch');
                                  };
                                  reader.readAsDataURL(e.target.files[0]);
                                }
                              }}
                              className="hidden"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setMediaBase64(generateSportsGraphic('fc_card', title || 'Contratação Bombástica', 'Anúncio Secreto de Elenco', settings.teamName, settings.characterName));
                              setMediaType('scratch');
                            }}
                            className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-extrabold text-xs rounded-lg transition shrink-0 flex items-center gap-1 cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3 text-zinc-950" />
                            <span>Gerar Card Esportivo IA</span>
                          </button>
                        </div>
                      </div>

                      {/* Live ScratchCard Preview */}
                      {mediaBase64 && (
                        <div className="space-y-1 pt-2 border-t border-amber-300/50">
                          <span className="text-[10px] font-bold text-amber-900 uppercase font-mono block">
                            🪙 Teste a Raspadinha Aqui:
                          </span>
                          <ScratchCard
                            imageUrl={mediaBase64}
                            coverText={scratchCoverText || 'RASPE PARA REVELAR'}
                            title={title || 'Revelação'}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {(mediaBase64 || videoUrl) && (
                    <div className="flex items-center justify-between bg-zinc-100 px-3 py-1.5 rounded-lg text-xs font-sans">
                      <span className="text-zinc-600 font-medium text-[11px] truncate max-w-[280px]">
                        {mediaType === 'video' ? '📹 Vídeo Vinculado' : '🖼️ Imagem Vinculada'} {videoUrl && videoUrl.startsWith('http') ? `(${videoUrl})` : ''}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setMediaBase64(null);
                          setMediaType(null);
                          setVideoUrl(null);
                          setVideoBlob(null);
                          setExternalUrlInput("");
                        }}
                        className="text-red-500 hover:text-red-700 text-[11px] font-bold cursor-pointer"
                      >
                        Remover Mídia
                      </button>
                    </div>
                  )}

                  {mediaType === 'video' && videoUrl && (
                    <VideoTrimAndFramePicker
                      videoUrl={videoUrl}
                      videoStartTime={videoStartTime}
                      videoEndTime={videoEndTime}
                      videoFrameTime={videoFrameTime}
                      onStartTimeChange={setVideoStartTime}
                      onEndTimeChange={setVideoEndTime}
                      onFrameTimeChange={setVideoFrameTime}
                      onCaptureFrame={(frameBase64, frameTime) => {
                        setMediaBase64(frameBase64);
                        setVideoFrameTime(frameTime);
                      }}
                      mediaBase64={mediaBase64}
                    />
                  )}
                </div>
              </div>

              {/* Form Actions Footer */}
              <div className="border-t border-zinc-100 pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-zinc-200 rounded-xl text-zinc-600 font-medium text-xs hover:bg-zinc-50 transition"
                >
                  Fechar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-zinc-950 hover:bg-zinc-900 text-white font-medium text-xs rounded-xl transition"
                >
                  Salvar Destaque ⚽
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timeline List / Grid Display */}
      {sortedEntries.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-zinc-200/80 shadow-sm p-8 max-w-2xl mx-auto">
          <div className="p-4 bg-zinc-50 rounded-full max-w-max mx-auto text-zinc-400 text-4xl mb-4">
            📖
          </div>
          <h3 className="font-bold text-zinc-900 text-base">Sua linha do tempo está vazia!</h3>
          <p className="text-xs text-zinc-500 mt-2 max-w-md mx-auto">
            Adicione registros das suas partidas, gols, contratações ou lesões do seu modo carreira no EA FC para criar o seu diário.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={handleGenerateSample}
              className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-700 font-semibold text-xs px-4 py-2.5 rounded-xl hover:bg-amber-500/20 transition"
            >
              <Sparkles className="w-3.5 h-3.5" /> Carregar Temporada de Exemplo
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-1 bg-zinc-950 text-white font-semibold text-xs px-4 py-2.5 rounded-xl hover:bg-zinc-900 transition"
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar Primeiro Registro
            </button>
          </div>
        </div>
      ) : (
        <div className="relative border-l border-zinc-200 pl-6 ml-4 space-y-6">
          {sortedEntries.map((entry: TimelineEntry, idx: number) => {
            const monthEntries = sortedEntries.filter(item => item.month === entry.month);
            const entryIdxInMonth = monthEntries.findIndex(item => item.id === entry.id);
            const isFirstInMonth = entryIdxInMonth === 0;
            const isLastInMonth = entryIdxInMonth === monthEntries.length - 1;

            return (
              <div 
                key={entry.id} 
                className={`relative group transition-all duration-200 ${
                  draggingId === entry.id ? "opacity-30 scale-95" : ""
                } ${
                  dragOverId === entry.id ? "ring-2 ring-amber-500/50 rounded-2xl bg-amber-500/5" : ""
                }`}
                draggable
                onDragStart={(e) => handleDragStart(e, entry.id)}
                onDragOver={(e) => handleDragOver(e, entry.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleElementDrop(e, entry.id)}
              >
                {/* Timeline Pin Node */}
                <div className="absolute -left-[31px] top-5 w-4 h-4 rounded-full bg-white border-2 border-zinc-950 flex items-center justify-center shadow-sm z-10 transition group-hover:scale-110">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                </div>

                {/* Entry Card */}
                <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-sm hover:shadow-md transition flex flex-col md:flex-row gap-5 items-stretch">
                  
                  {/* Left Column: Drag Handle (Desktop only, visible on hover) */}
                  <div className="hidden md:flex flex-col items-center justify-center gap-1 shrink-0 select-none opacity-0 group-hover:opacity-100 transition duration-150 border-r border-zinc-100 pr-3">
                    <div 
                      className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-zinc-600 transition"
                      title="Segure e arraste para reordenar dentro do mesmo mês"
                    >
                      <GripVertical className="w-4 h-4" />
                    </div>
                    <span className="text-[8px] font-mono font-bold text-zinc-400 uppercase tracking-wider">Mês</span>
                  </div>

                  {/* Media Thumbnail Container */}
                  {(entry.mediaUrl || entry.videoUrl || entry.htmlCode || (entry.galleryUrls && entry.galleryUrls.length > 0)) && (
                    <div className="md:w-64 shrink-0 rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200 relative group/preview">
                      {entry.mediaType === 'scratch' && entry.mediaUrl ? (
                        <ScratchCard
                          imageUrl={entry.mediaUrl}
                          coverText={entry.scratchCoverText || 'RASPE PARA REVELAR'}
                          title={entry.title}
                        />
                      ) : entry.mediaType === 'html' || entry.htmlCode ? (
                        <div className="w-full h-full bg-zinc-950 flex flex-col items-center justify-center relative overflow-hidden">
                          <iframe
                            srcDoc={entry.htmlCode}
                            title="Embedded Canvas/HTML"
                            className="w-full h-full border-0 pointer-events-none opacity-80"
                            sandbox="allow-scripts allow-same-origin"
                          />
                          <div className="absolute top-2 left-2 bg-blue-600/90 text-white px-2 py-0.5 rounded text-[9px] font-mono font-bold flex items-center gap-1 shadow-sm">
                            <Code className="w-2.5 h-2.5" /> HTML / CANVAS
                          </div>
                        </div>
                      ) : entry.mediaType === 'gallery' || (entry.galleryUrls && entry.galleryUrls.length > 0) ? (
                        <div className="w-full h-full relative bg-zinc-950 overflow-hidden rounded-lg">
                          <AutoImageCarousel
                            urls={entry.galleryUrls || (entry.mediaUrl ? [entry.mediaUrl] : [])}
                            alt={entry.title}
                            showThumbnails={false}
                            intervalMs={5000}
                            onZoom={(url, index, allUrls) => setZoomedMedia({
                              url,
                              type: 'image',
                              title: entry.title,
                              caption: entry.description,
                              galleryUrls: allUrls || entry.galleryUrls,
                              currentIndex: index || 0,
                            })}
                          />
                        </div>
                      ) : entry.videoUrl ? (
                        <video 
                          src={`${entry.videoUrl}#t=${entry.videoStartTime || 0},${entry.videoEndTime || 20}`} 
                          className="w-full h-full object-cover"
                          controls
                          preload="metadata"
                        />
                      ) : (
                        <img 
                          src={entry.mediaUrl} 
                          alt={entry.title} 
                          className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition"
                          onClick={() => setZoomedMedia({
                            url: entry.mediaUrl,
                            type: 'image',
                            title: entry.title,
                            caption: entry.description,
                            galleryUrls: entry.galleryUrls,
                          })}
                        />
                      )}

                      {entry.mediaType === 'video' && (
                        <div className="absolute bottom-2 left-2 bg-black/85 px-2 py-0.5 rounded text-[8px] text-zinc-100 font-mono flex items-center gap-1 shadow-sm border border-zinc-800">
                          <Film className="w-2.5 h-2.5 text-amber-500" />
                          <span>Vídeo {entry.videoStartTime !== undefined ? `(${entry.videoStartTime.toFixed(1)}s - ${entry.videoEndTime?.toFixed(1)}s)` : ''}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Entry Meta & Body */}
                  <div className="flex-1 space-y-2 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs bg-amber-500/10 text-amber-900 border border-amber-500/20 font-bold px-2 py-0.5 rounded-md font-mono flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-amber-600" /> Temp. {entry.season || settings.season || "2024/2025"}
                          </span>
                          <span className="text-xs bg-zinc-100 text-zinc-700 font-bold px-2 py-0.5 rounded-md font-mono flex items-center gap-1">
                            {entry.month}
                          </span>
                          <span className="text-xs border border-zinc-200 text-zinc-600 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <span>{getTypeIcon(entry.type)}</span>
                            <span>{getTypePTDesc(entry.type)}</span>
                          </span>
                        </div>

                        {/* Control Actions (Delete & Move) */}
                        <div className="flex items-center gap-1">
                          {/* Reordering buttons (Available both mobile and desktop) */}
                          <div className="flex items-center gap-0.5 border border-zinc-200/60 rounded-xl p-0.5 bg-zinc-50" title="Mudar ordem deste fato">
                            <button
                              type="button"
                              disabled={isFirstInMonth}
                              onClick={() => moveEntry(entry.id, 'up')}
                              className={`p-1 rounded-lg transition ${
                                isFirstInMonth 
                                  ? 'text-zinc-300 cursor-not-allowed' 
                                  : 'text-zinc-500 hover:text-zinc-850 hover:bg-white active:scale-95'
                              }`}
                              title="Subir na ordem"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={isLastInMonth}
                              onClick={() => moveEntry(entry.id, 'down')}
                              className={`p-1 rounded-lg transition ${
                                isLastInMonth 
                                  ? 'text-zinc-300 cursor-not-allowed' 
                                  : 'text-zinc-500 hover:text-zinc-850 hover:bg-white active:scale-95'
                              }`}
                              title="Descer na ordem"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleStartEdit(entry)}
                            className="text-zinc-300 hover:text-amber-600 transition p-1.5 rounded-xl hover:bg-amber-50"
                            title="Editar destaque"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeleteEntry(entry.id)}
                            className="text-zinc-300 hover:text-red-500 transition p-1.5 rounded-xl hover:bg-red-50"
                            title="Excluir destaque"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <h3 className="font-bold text-zinc-950 text-base leading-tight">
                        {entry.title}
                      </h3>
                      
                      <p className="text-xs text-zinc-600 leading-relaxed line-clamp-3 md:line-clamp-none">
                        {entry.description}
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Entry Modal Overlay */}
      <AnimatePresence>
        {editingEntry && (
          <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-2xl w-full border border-zinc-200 shadow-2xl space-y-5 my-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <h3 className="font-bold text-zinc-900 text-base flex items-center gap-2">
                  ✏️ Editar Registro da Linha do Tempo
                </h3>
                <button 
                  type="button" 
                  onClick={() => setEditingEntry(null)} 
                  className="text-zinc-400 hover:text-zinc-650 transition text-sm font-semibold p-1"
                >
                  Cancelar
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Season */}
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-zinc-600 font-sans">Temporada</label>
                    <input
                      type="text"
                      value={editSeason}
                      onChange={(e) => setEditSeason(e.target.value)}
                      placeholder="ex: 2024/2025"
                      className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 text-sm outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                    />
                  </div>

                  {/* Month */}
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-zinc-600 font-sans">Calendário (Mês)</label>
                    <select
                      value={editMonth}
                      onChange={(e) => setEditMonth(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 text-sm outline-none focus:ring-1 focus:ring-amber-500 font-sans"
                    >
                      {MONTHS.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  {/* Category Type */}
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-zinc-600 font-sans">Tipo de Destaque</label>
                    <select
                      value={editType}
                      onChange={(e) => setEditType(e.target.value as EntryType)}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 text-sm outline-none focus:ring-1 focus:ring-amber-500 font-sans"
                    >
                      <option value="match">⚽ Partida (Gols, Assistências, Atuação)</option>
                      <option value="transfer">🤝 Transferência / Renovação</option>
                      <option value="injury">🏥 Lesão / Recuperação</option>
                      <option value="training">🏃 Treino / Evolução de Atributos</option>
                      <option value="award">🏆 Premiação (Título, Seleção da Semana)</option>
                      <option value="other">📝 Outro Evento da Carreira</option>
                    </select>
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-zinc-600 font-sans">Título do Evento</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Hat-trick contra o Arsenal ou Campeão da Copa do Rei"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 text-sm outline-none focus:ring-1 focus:ring-amber-500 font-sans"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-zinc-600 font-sans">O que aconteceu? (Descrição Detalhada)</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Descreva a partida ou evento com riqueza de detalhes."
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 text-sm outline-none focus:ring-1 focus:ring-amber-500 resize-none font-sans"
                  />
                </div>

                {/* Media Uploader Box */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="block text-xs font-medium text-zinc-600 flex items-center gap-1 font-sans">
                      <ImageIcon className="w-3.5 h-3.5 text-zinc-500" /> Alterar Mídia Anexa
                    </label>

                    {/* Source Tabs */}
                    <div className="flex flex-wrap bg-zinc-100 p-0.5 rounded-lg text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => setEditMediaSourceTab('upload')}
                        className={`px-2 py-1 rounded-md transition flex items-center gap-1 cursor-pointer ${
                          editMediaSourceTab === 'upload' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-500 hover:text-zinc-800'
                        }`}
                      >
                        <Upload className="w-3 h-3" />
                        <span>Arquivo Local</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditMediaSourceTab('gallery')}
                        className={`px-2 py-1 rounded-md transition flex items-center gap-1 cursor-pointer ${
                          editMediaSourceTab === 'gallery' ? 'bg-amber-500 text-zinc-950 shadow-xs font-black' : 'text-zinc-500 hover:text-zinc-800'
                        }`}
                      >
                        <Images className="w-3 h-3" />
                        <span>Carrossel ({editGalleryUrls.length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditMediaSourceTab('url')}
                        className={`px-2 py-1 rounded-md transition flex items-center gap-1 cursor-pointer ${
                          editMediaSourceTab === 'url' ? 'bg-amber-500 text-zinc-950 shadow-xs font-black' : 'text-zinc-500 hover:text-zinc-800'
                        }`}
                      >
                        <Globe className="w-3 h-3" />
                        <span>Link Web</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditMediaSourceTab('html')}
                        className={`px-2 py-1 rounded-md transition flex items-center gap-1 cursor-pointer ${
                          editMediaSourceTab === 'html' ? 'bg-blue-600 text-white shadow-xs font-black' : 'text-zinc-500 hover:text-zinc-800'
                        }`}
                      >
                        <Code className="w-3 h-3" />
                        <span>HTML / Canvas</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditMediaSourceTab('scratch');
                          if (!editMediaBase64) {
                            setEditMediaBase64(generateSportsGraphic('fc_card', editTitle || 'Contratação Bombástica', 'Anúncio Secreto de Elenco', settings.teamName, settings.characterName));
                          }
                          setEditMediaType('scratch');
                        }}
                        className={`px-2 py-1 rounded-md transition flex items-center gap-1 cursor-pointer ${
                          editMediaSourceTab === 'scratch' ? 'bg-amber-500 text-zinc-950 shadow-xs font-black ring-1 ring-amber-400' : 'text-amber-600 font-bold hover:text-amber-800'
                        }`}
                      >
                        <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
                        <span>Raspadinha 🪙</span>
                      </button>
                    </div>
                  </div>
                  
                  {editMediaSourceTab === 'upload' && (
                    <div
                      onDragEnter={handleEditDrag}
                      onDragLeave={handleEditDrag}
                      onDragOver={handleEditDrag}
                      onDrop={handleEditDrop}
                      onClick={() => editFileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center h-[180px] relative overflow-hidden ${
                        editDragActive 
                          ? "border-amber-500 bg-amber-500/5" 
                          : "border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 bg-zinc-50"
                      }`}
                    >
                      <input
                        type="file"
                        ref={editFileInputRef}
                        onChange={handleEditFileInputChange}
                        accept="image/*,video/*"
                        className="hidden"
                      />

                      {isProcessingEditFile ? (
                        <div className="space-y-2">
                          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                          <p className="text-xs text-zinc-500 font-mono">Processando arquivo...</p>
                        </div>
                      ) : editMediaBase64 ? (
                        <div className="absolute inset-0 group">
                          <img 
                            src={editMediaBase64} 
                            alt="Thumbnail" 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-sans">
                            <Upload className="w-4 h-4 mr-1" /> Substituir arquivo
                          </div>
                          {editMediaType === 'video' && (
                            <div className="absolute top-2 right-2 bg-zinc-950/80 px-2 py-0.5 rounded text-[9px] text-white font-mono flex items-center gap-1">
                              <Film className="w-2.5 h-2.5 text-amber-400" /> VÍDEO
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="p-3 bg-white border border-zinc-100 rounded-full shadow-sm max-w-max mx-auto text-zinc-400 group-hover:text-amber-500 transition">
                            <Upload className="w-6 h-6" />
                          </div>
                          <p className="text-xs font-semibold text-zinc-800 font-sans">Arraste ou clique para enviar</p>
                          <p className="text-[10px] text-zinc-400 font-sans">Substitua a captura de imagem ou clipe de vídeo antigo</p>
                        </div>
                      )}
                    </div>
                  )}

                  {editMediaSourceTab === 'gallery' && (
                    <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 space-y-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-zinc-700 flex items-center gap-1 font-sans">
                          <Images className="w-3.5 h-3.5 text-amber-500" />
                          <span>Carrossel de Fotos do Fato ({editGalleryUrls.length} imagens):</span>
                        </label>
                        <p className="text-[10px] text-zinc-500">
                          Adicione novas fotos ao carrossel deste destaque da carreira!
                        </p>
                      </div>

                      {/* Multiple Files Upload Input */}
                      <div className="flex gap-2">
                        <label className="flex-1 border-2 border-dashed border-zinc-300 hover:border-amber-500 bg-white hover:bg-amber-50/20 rounded-xl p-3 text-center cursor-pointer transition flex items-center justify-center gap-2 text-xs font-bold text-zinc-700">
                          <Upload className="w-4 h-4 text-amber-500" />
                          <span>Adicionar mais fotos</span>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files) handleGalleryFiles(e.target.files, true);
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {/* Add Image URL */}
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={editGalleryUrlInput}
                          onChange={(e) => setEditGalleryUrlInput(e.target.value)}
                          placeholder="Ou cole a URL de uma foto (https://...)"
                          className="flex-1 px-3 py-2 text-xs bg-white border border-zinc-200 rounded-lg outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddGalleryUrl(true)}
                          className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded-lg transition shrink-0 flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 text-amber-400" />
                          <span>Adicionar URL</span>
                        </button>
                      </div>

                      {/* Gallery Grid */}
                      {editGalleryUrls.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-2 border-t border-zinc-200">
                          {editGalleryUrls.map((url, idx) => (
                            <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-zinc-300 group bg-black/10">
                              <img src={url} alt={`Slide ${idx + 1}`} className="w-full h-full object-cover" />
                              <span className="absolute top-1 left-1 bg-black/70 text-white text-[9px] font-mono px-1 rounded">
                                #{idx + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveGalleryImage(idx, true)}
                                className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition cursor-pointer"
                                title="Remover foto"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-xs text-zinc-400 border border-dashed border-zinc-200 rounded-lg bg-white">
                          Nenhuma foto no carrossel.
                        </div>
                      )}
                    </div>
                  )}

                  {editMediaSourceTab === 'url' && (
                    <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-zinc-700 flex items-center gap-1 font-sans">
                          <LinkIcon className="w-3 h-3 text-amber-500" />
                          <span>Cole a URL do Vídeo ou Imagem:</span>
                        </label>
                        
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={editExternalUrlInput}
                            onChange={(e) => setEditExternalUrlInput(e.target.value)}
                            placeholder="Ex: https://streamable.com/xyz, https://youtu.be/... ou https://i.imgur.com/foto.jpg"
                            className="flex-1 px-3 py-2 text-xs bg-white border border-zinc-200 rounded-lg outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => applyExternalUrl(true)}
                            className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded-lg transition shrink-0 flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5 text-amber-400" />
                            <span>Aplicar Link</span>
                          </button>
                        </div>
                      </div>

                      {/* Type toggle selector */}
                      <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-zinc-200/60 text-xs">
                        <span className="text-[10px] text-zinc-500 font-medium font-sans">Tipo do link:</span>
                        <label className="flex items-center gap-1.5 text-zinc-700 text-[11px] cursor-pointer select-none">
                          <input
                            type="radio"
                            name="editUrlType"
                            checked={editExternalUrlType === 'video'}
                            onChange={() => setEditExternalUrlType('video')}
                            className="text-amber-500 focus:ring-amber-500"
                          />
                          <Film className="w-3 h-3 text-amber-600" />
                          <span>Vídeo (Streamable, YouTube, MP4, Vimeo)</span>
                        </label>
                        <label className="flex items-center gap-1.5 text-zinc-700 text-[11px] cursor-pointer select-none">
                          <input
                            type="radio"
                            name="editUrlType"
                            checked={editExternalUrlType === 'image'}
                            onChange={() => setEditExternalUrlType('image')}
                            className="text-amber-500 focus:ring-amber-500"
                          />
                          <ImageIcon className="w-3 h-3 text-blue-600" />
                          <span>Imagem (Imgur, Postimages, PNG/JPG)</span>
                        </label>
                      </div>

                      {/* Video Hosting Suggestions */}
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 text-[10px] text-zinc-700 space-y-1 font-sans">
                        <p className="font-bold text-amber-900 flex items-center gap-1">
                          💡 Onde salvar vídeos gratuitamente para usar o link:
                        </p>
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          <a href="https://streamable.com" target="_blank" rel="noreferrer" className="bg-white hover:bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded text-zinc-800 font-mono flex items-center gap-1 transition">
                            <span>Streamable (Recomendado)</span> <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                          </a>
                          <a href="https://youtube.com" target="_blank" rel="noreferrer" className="bg-white hover:bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded text-zinc-800 font-mono flex items-center gap-1 transition">
                            <span>YouTube / Shorts</span> <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                          </a>
                          <a href="https://imgur.com" target="_blank" rel="noreferrer" className="bg-white hover:bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded text-zinc-800 font-mono flex items-center gap-1 transition">
                            <span>Imgur</span> <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {editMediaSourceTab === 'scratch' && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 space-y-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-amber-950 flex items-center gap-1 font-sans">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                          <span>Efeito Raspadinha Interativa (Revelação Surpresa):</span>
                        </label>
                        <p className="text-[10px] text-zinc-600 leading-relaxed">
                          O leitor precisará raspar a cobertura dourada para descobrir a imagem secreta!
                        </p>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-700">
                          Texto da Cobertura Dourada:
                        </label>
                        <input
                          type="text"
                          value={editScratchCoverText}
                          onChange={(e) => setEditScratchCoverText(e.target.value)}
                          placeholder="Ex: RASPE PARA REVELAR O NOVO CAMISA 10"
                          className="w-full px-3 py-1.5 text-xs bg-white border border-amber-300 rounded-lg font-bold text-amber-900 outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>

                      {/* Image selector for background */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-700 block">
                          Imagem Oculta por Trás da Cobertura:
                        </label>
                        <div className="flex gap-2">
                          <label className="flex-1 border-2 border-dashed border-amber-300 hover:border-amber-500 bg-white hover:bg-amber-50/50 rounded-lg p-2 text-center cursor-pointer transition flex items-center justify-center gap-1.5 text-xs font-bold text-amber-900">
                            <Upload className="w-3.5 h-3.5 text-amber-600" />
                            <span>{editMediaBase64 ? 'Trocar Imagem Oculta' : 'Enviar Imagem para Ocultar'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  const reader = new FileReader();
                                  reader.onload = (ev) => {
                                    setEditMediaBase64(ev.target?.result as string);
                                    setEditMediaType('scratch');
                                  };
                                  reader.readAsDataURL(e.target.files[0]);
                                }
                              }}
                              className="hidden"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setEditMediaBase64(generateSportsGraphic('fc_card', editTitle || 'Contratação Bombástica', 'Anúncio Secreto de Elenco', settings.teamName, settings.characterName));
                              setEditMediaType('scratch');
                            }}
                            className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-extrabold text-xs rounded-lg transition shrink-0 flex items-center gap-1 cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3 text-zinc-950" />
                            <span>Gerar Card IA</span>
                          </button>
                        </div>
                      </div>

                      {/* Live ScratchCard Preview */}
                      {editMediaBase64 && (
                        <div className="space-y-1 pt-2 border-t border-amber-300/50">
                          <span className="text-[10px] font-bold text-amber-900 uppercase font-mono block">
                            🪙 Teste a Raspadinha Aqui:
                          </span>
                          <ScratchCard
                            imageUrl={editMediaBase64}
                            coverText={editScratchCoverText || 'RASPE PARA REVELAR'}
                            title={editTitle || 'Revelação'}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {(editMediaBase64 || editVideoUrl) && (
                    <div className="flex items-center justify-between bg-zinc-100 px-3 py-1.5 rounded-lg text-xs font-sans">
                      <span className="text-zinc-600 font-medium text-[11px] truncate max-w-[280px]">
                        {editMediaType === 'video' ? '📹 Vídeo Vinculado' : '🖼️ Imagem Vinculada'} {editVideoUrl && editVideoUrl.startsWith('http') ? `(${editVideoUrl})` : ''}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditMediaBase64(null);
                          setEditMediaType(null);
                          setEditVideoUrl(null);
                          setEditVideoBlob(null);
                          setEditExternalUrlInput("");
                        }}
                        className="text-red-500 hover:text-red-700 text-[11px] font-bold cursor-pointer"
                      >
                        Remover Mídia
                      </button>
                    </div>
                  )}

                  {editMediaType === 'video' && editVideoUrl && (
                    <VideoTrimAndFramePicker
                      videoUrl={editVideoUrl}
                      videoStartTime={editVideoStartTime}
                      videoEndTime={editVideoEndTime}
                      videoFrameTime={editVideoFrameTime}
                      onStartTimeChange={setEditVideoStartTime}
                      onEndTimeChange={setEditVideoEndTime}
                      onFrameTimeChange={setEditVideoFrameTime}
                      onCaptureFrame={(frameBase64, frameTime) => {
                        setEditMediaBase64(frameBase64);
                        setEditVideoFrameTime(frameTime);
                      }}
                      mediaBase64={editMediaBase64}
                    />
                  )}
                </div>

                {/* Form Actions Footer */}
                <div className="border-t border-zinc-100 pt-4 flex justify-end gap-3 font-sans">
                  <button
                    type="button"
                    onClick={() => setEditingEntry(null)}
                    className="px-4 py-2 border border-zinc-200 rounded-xl text-zinc-600 font-semibold text-xs hover:bg-zinc-50 transition"
                  >
                    Fechar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition shadow-sm"
                  >
                    Salvar Alterações 💾
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {zoomedMedia && (
        <ZoomedMediaModal
          media={zoomedMedia}
          onClose={() => setZoomedMedia(null)}
        />
      )}

    </div>
  );
}

function getTypePTDesc(type: EntryType): string {
  switch (type) {
    case 'match': return "Partida";
    case 'transfer': return "Negociação";
    case 'injury': return "Lesão";
    case 'training': return "Treino";
    case 'award': return "Prêmio";
    default: return "Geral";
  }
}
