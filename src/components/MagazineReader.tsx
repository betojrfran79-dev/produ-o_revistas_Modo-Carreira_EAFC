import { useState, useEffect, useRef } from "react";
import { Magazine, MagazinePage, JOURNALISTS, TimelineEntry, CareerSettings } from "../types";
import { ChevronLeft, ChevronRight, BookOpen, Quote, Sparkles, Printer, ArrowLeft, Volume2, VolumeX, Pencil, Check, X, Share2, Copy, Download, FileArchive, QrCode, ExternalLink } from "lucide-react";
import Markdown from "react-markdown";
import { PageFlip } from "page-flip";
import SigaLaPelotaLogo from "./SigaLaPelotaLogo";
import { shareMagazine } from "../lib/db";
import { exportMagazineToZip } from "../utils/zipExporter";
import { ScratchCard } from "./ScratchCard";
import AutoImageCarousel from "./AutoImageCarousel";
import ZoomedMediaModal, { ZoomedMediaData } from "./ZoomedMediaModal";

// Helper to check if a URL is a playable video stream/link
export function getPlayableVideoUrl(videoUrl?: string | null, mediaUrl?: string | null): string | null {
  if (videoUrl) {
    if (videoUrl.startsWith('blob:')) return videoUrl;
    if (videoUrl.startsWith('http://') || videoUrl.startsWith('https://')) return videoUrl;
  }
  if (mediaUrl) {
    if (mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://')) {
      if (/youtube\.com|youtu\.be|streamable\.com|vimeo\.com|imgur\.com|\.mp4|\.webm|\.mov|\.m4v|\.gifv/i.test(mediaUrl)) {
        return mediaUrl;
      }
    }
  }
  return null;
}

// Helper to parse embed URLs for video services like YouTube, Streamable, Vimeo, Imgur
export function getEmbedOrVideoUrl(src: string): { type: 'youtube' | 'streamable' | 'vimeo' | 'direct'; embedUrl: string } {
  if (!src) return { type: 'direct', embedUrl: src };

  // YouTube
  const ytMatch = src.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch && ytMatch[1]) {
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`
    };
  }

  // Streamable
  const streamableMatch = src.match(/streamable\.com\/(?:e\/)?([a-zA-Z0-9]+)/);
  if (streamableMatch && streamableMatch[1]) {
    return {
      type: 'streamable',
      embedUrl: `https://streamable.com/e/${streamableMatch[1]}?autoplay=1`
    };
  }

  // Vimeo
  const vimeoMatch = src.match(/vimeo\.com\/(?:video\/)?([0-9]+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      type: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`
    };
  }

  // Imgur gifv / mp4 / post links
  if (src.includes('imgur.com')) {
    if (/\.gifv$/i.test(src)) {
      return { type: 'direct', embedUrl: src.replace(/\.gifv$/i, '.mp4') };
    }
    const imgurMatch = src.match(/(?:imgur\.com\/(?:a\/|gallery\/|v\/)?|i\.imgur\.com\/)([a-zA-Z0-9]+)/);
    if (imgurMatch && imgurMatch[1]) {
      const id = imgurMatch[1];
      if (/\.(mp4|webm)$/i.test(src)) {
        return { type: 'direct', embedUrl: src };
      }
      return { type: 'direct', embedUrl: `https://i.imgur.com/${id}.mp4` };
    }
  }

  return { type: 'direct', embedUrl: src };
}

// Enhanced Video Player component with custom sound toggle and trimming support
function MagazineVideo({ src, startTime, endTime }: { src: string; startTime?: number; endTime?: number }) {
  const [loadError, setLoadError] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Safety fallback: if src is an image data URL, render as img directly
  if (!src || src.startsWith("data:image/")) {
    return (
      <img
        src={src}
        alt="Frame do vídeo"
        className="w-full h-full object-contain rounded-md"
      />
    );
  }

  const videoInfo = getEmbedOrVideoUrl(src);

  if (videoInfo.type !== 'direct') {
    const isYouTube = videoInfo.type === 'youtube';
    const label = isYouTube ? "Abrir no YouTube ↗" : "Abrir Vídeo ↗";
    return (
      <div className="relative w-full h-full overflow-hidden rounded-md bg-zinc-950">
        <iframe
          src={videoInfo.embedUrl}
          className="w-full h-full border-0 rounded-md"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="absolute top-2 right-2 z-10 px-2 py-1 bg-black/85 hover:bg-amber-500 hover:text-zinc-950 text-white rounded text-[9px] font-bold font-mono shadow-md flex items-center gap-1 transition duration-150 no-underline cursor-pointer"
        >
          {label}
        </a>
      </div>
    );
  }

  const toggleMute = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Stop zoom overlay or page turns from firing
    if (videoRef.current) {
      const newMuted = !videoRef.current.muted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && endTime !== undefined && videoRef.current.currentTime >= endTime) {
      videoRef.current.currentTime = startTime || 0;
    }
  };

  const videoSrc = (startTime !== undefined && endTime !== undefined)
    ? `${src}#t=${startTime},${endTime}`
    : src;

  if (loadError) {
    return (
      <div className="w-full h-full bg-zinc-950 flex flex-col items-center justify-center p-4 text-center space-y-1 text-white border border-zinc-800 rounded-lg select-none">
        <span className="text-lg">📺</span>
        <p className="text-[10px] font-bold font-sans">Vídeo indisponível</p>
        <p className="text-[8px] text-zinc-400 font-sans max-w-[200px] leading-tight">
          O arquivo de vídeo original não pôde ser carregado (pode ter expirado).
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full group/video overflow-hidden rounded-md bg-zinc-950">
      <video
        ref={videoRef}
        src={videoSrc}
        controls
        autoPlay
        loop={endTime === undefined}
        muted={isMuted}
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onError={() => setLoadError(true)}
        onVolumeChange={() => {
          if (videoRef.current) {
            setIsMuted(videoRef.current.muted);
          }
        }}
        className="w-full h-full object-contain"
      />
      
      {/* Dynamic Overlay Sound Button */}
      <button
        type="button"
        onClick={toggleMute}
        className="absolute bottom-11 right-2 z-30 p-2 bg-zinc-950/80 hover:bg-zinc-900 text-white rounded-full transition shadow-lg border border-zinc-800/50 flex items-center gap-1 hover:scale-105 active:scale-95"
        title={isMuted ? "Ativar som" : "Desativar som"}
      >
        {isMuted ? (
          <>
            <VolumeX className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-[8px] font-mono font-bold uppercase tracking-wider pr-1 hidden sm:inline">Mudo</span>
          </>
        ) : (
          <>
            <Volume2 className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="text-[8px] font-mono font-bold uppercase tracking-wider pr-1 text-amber-400 hidden sm:inline">Som Ativo</span>
          </>
        )}
      </button>
    </div>
  );
}

// Custom Zoomed Video Player with sound enabled and trimming support
function ZoomedVideo({ src, startTime, endTime }: { src: string; startTime?: number; endTime?: number }) {
  const [loadError, setLoadError] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const videoInfo = getEmbedOrVideoUrl(src);

  if (videoInfo.type !== 'direct') {
    return (
      <iframe
        src={videoInfo.embedUrl}
        className="w-[85vw] max-w-4xl aspect-video rounded-xl shadow-2xl border border-zinc-800"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  const handleTimeUpdate = () => {
    if (videoRef.current && endTime !== undefined && videoRef.current.currentTime >= endTime) {
      videoRef.current.currentTime = startTime || 0;
    }
  };

  const videoSrc = (startTime !== undefined && endTime !== undefined)
    ? `${src}#t=${startTime},${endTime}`
    : src;

  if (loadError) {
    return (
      <div className="bg-zinc-900 border border-zinc-850 p-8 rounded-2xl flex flex-col items-center justify-center text-center space-y-3 max-w-sm shadow-xl select-none">
        <span className="text-4xl">⚠️</span>
        <h3 className="text-sm font-bold text-white font-sans">Vídeo não pôde ser carregado</h3>
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
      loop={endTime === undefined}
      onTimeUpdate={handleTimeUpdate}
      onError={() => setLoadError(true)}
      className="max-w-full max-h-[80vh] rounded-xl shadow-2xl border border-zinc-800"
    />
  );
}

// Helper to extract a storyboard (sequence of frames) from a video blob on the client-side
function extractVideoStoryboard(blob: Blob, frameCount: number = 5): Promise<string[]> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    
    const fileUrl = URL.createObjectURL(blob);
    video.src = fileUrl;
    
    const frames: string[] = [];
    
    const cleanup = () => {
      URL.revokeObjectURL(fileUrl);
      video.remove();
    };

    const timeoutId = setTimeout(() => {
      cleanup();
      resolve(frames);
    }, 15000); // 15 seconds max timeout

    video.onloadedmetadata = async () => {
      try {
        const duration = video.duration || 5;
        const samplePoints: number[] = [];
        // Sample frameCount times evenly across the video duration from 10% to 90%
        for (let i = 0; i < frameCount; i++) {
          const ratio = 0.1 + (0.8 * i) / Math.max(1, frameCount - 1);
          samplePoints.push(ratio * duration);
        }

        const canvas = document.createElement('canvas');
        canvas.width = 480;
        canvas.height = 270;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          cleanup();
          resolve([]);
          return;
        }

        for (const time of samplePoints) {
          await new Promise<void>((seekResolve) => {
            const onSeeked = () => {
              video.removeEventListener('seeked', onSeeked);
              seekResolve();
            };
            video.addEventListener('seeked', onSeeked);
            video.currentTime = time;
          });

          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const base64 = canvas.toDataURL('image/jpeg', 0.35);
          frames.push(base64);
        }

        clearTimeout(timeoutId);
        cleanup();
        resolve(frames);
      } catch (err) {
        console.warn("Error extracting storyboard:", err);
        clearTimeout(timeoutId);
        cleanup();
        resolve(frames);
      }
    };

    video.onerror = () => {
      clearTimeout(timeoutId);
      cleanup();
      resolve([]);
    };
  });
}

interface MagazineReaderProps {
  magazine: Magazine;
  timelineEntries: TimelineEntry[];
  onBackToList: () => void;
  onUpdateMagazine: (updated: Magazine) => void;
  settings: CareerSettings;
  isSharedView?: boolean;
}

export default function MagazineReader({ magazine, timelineEntries, onBackToList, onUpdateMagazine, settings, isSharedView = false }: MagazineReaderProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [zoomedMedia, setZoomedMedia] = useState<ZoomedMediaData | null>(null);

  // Share states
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Auto-generate share link when modal is opened
  useEffect(() => {
    if (showShareModal && !shareUrl && !isSharing && !shareError) {
      handleShare();
    }
  }, [showShareModal]);

  // ZIP export states
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [exportZipProgress, setExportZipProgress] = useState("");
  const [optimizeForGithub, setOptimizeForGithub] = useState(true);

  const getLargeVideoStats = () => {
    let largeCount = 0;
    let criticalCount = 0;
    let totalSize = 0;
    
    if (magazine && magazine.pages && timelineEntries) {
      magazine.pages.forEach((page, i) => {
        let entry = page.suggestedEntryId 
          ? timelineEntries.find(e => e.id === page.suggestedEntryId)
          : undefined;
          
        if (!entry) {
          const entriesWithMedia = timelineEntries.filter(e => e.mediaUrl || e.videoUrl);
          entry = entriesWithMedia[i] || timelineEntries.find(e => e.mediaUrl || e.videoUrl);
        }
        
        if (entry && entry.mediaType === 'video') {
          const videoBlob = entry.videoBlob;
          if (videoBlob) {
            totalSize += videoBlob.size;
            if (videoBlob.size > 95 * 1024 * 1024) {
              criticalCount++;
            } else if (videoBlob.size > 45 * 1024 * 1024) {
              largeCount++;
            }
          }
        }
      });
    }
    
    return { largeCount, criticalCount, totalSize };
  };

  const handleShare = async () => {
    setIsSharing(true);
    setShareUrl(null);
    setShareError(null);
    setCopied(false);
    try {
      const url = await shareMagazine(magazine, timelineEntries || []);
      setShareUrl(url);
    } catch (err: any) {
      console.error("Erro ao compartilhar revista:", err);
      setShareError(err?.message || "Erro ao conectar à nuvem para gerar o link.");
    } finally {
      setIsSharing(false);
    }
  };

  const handleExportZip = async () => {
    setIsExportingZip(true);
    setExportZipProgress("Preparando arquivos...");
    try {
      const zipBlob = await exportMagazineToZip(
        magazine,
        timelineEntries || [],
        (msg) => {
          setExportZipProgress(msg);
        },
        {
          excludeLargeVideos: optimizeForGithub,
          largeVideoThresholdMB: 95
        }
      );
      
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${magazine.title.toLowerCase().replace(/\s+/g, "_")}_portfolio_web.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Erro ao exportar ZIP:", err);
      alert("Erro ao exportar revista para ZIP: " + (err.message || err));
    } finally {
      setIsExportingZip(false);
      setExportZipProgress("");
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        throw new Error("Clipboard API unavailable");
      }
    } catch (err) {
      // Fallback for iframe restrictions
      const textArea = document.createElement("textarea");
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editTab, setEditTab] = useState<'cover' | 'pages'>('cover');
  const [selectedPageIdx, setSelectedPageIdx] = useState(0);

  const [editTitle, setEditTitle] = useState("");
  const [editSubtitle, setEditSubtitle] = useState("");
  const [editEditorialText, setEditEditorialText] = useState("");
  const [editPages, setEditPages] = useState<MagazinePage[]>([]);

  // AI Page regeneration states
  const [correctionPrompt, setCorrectionPrompt] = useState("");
  const [isRegeneratingPage, setIsRegeneratingPage] = useState(false);
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string | null>(null);

  // Active gallery index state for magazine pages
  const [activeGalleryIndex, setActiveGalleryIndex] = useState<{ [pageIdx: number]: number }>({});

  useEffect(() => {
    setCorrectionPrompt("");
    setAiSuccessMessage(null);
  }, [selectedPageIdx]);

  const handleRegeneratePageWithAI = async (pageIdx: number) => {
    const pageToRegenerate = editPages[pageIdx];
    if (!pageToRegenerate) return;

    setIsRegeneratingPage(true);
    setAiSuccessMessage(null);
    try {
      // Find matching timeline entry
      const entry = timelineEntries.find(e => e.id === pageToRegenerate.suggestedEntryId);
      
      let entryPayload = null;
      if (entry) {
        let videoFrames: string[] = [];
        if (entry.videoBlob) {
          try {
            videoFrames = await extractVideoStoryboard(entry.videoBlob, 5);
          } catch (err) {
            console.warn("Could not extract storyboard from videoBlob for single page payload:", err);
          }
        }
        
        entryPayload = {
          id: entry.id,
          title: entry.title,
          description: entry.description,
          month: entry.month,
          type: entry.type,
          mediaType: entry.mediaType || 'image',
          mediaUrl: entry.mediaUrl || null,
          videoFrames: videoFrames
        };
      }

      const apiBaseUrl = (import.meta as any).env?.VITE_API_URL || "";
      const response = await fetch(`${apiBaseUrl}/api/gemini/regenerate-page`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-key": settings.customApiKey || ""
        },
        body: JSON.stringify({
          journalistId: magazine.journalistId,
          settings,
          page: pageToRegenerate,
          userCorrection: correctionPrompt,
          entry: entryPayload
        })
      });

      if (!response.ok) {
        let errMsg = `Erro do servidor (Código ${response.status})`;
        try {
          const parsed = await response.json();
          if (parsed && parsed.error) errMsg = parsed.error;
        } catch (_) {}
        throw new Error(errMsg);
      }

      const data = await response.json();
      if (!data || !data.content) {
        throw new Error("Resposta inválida do Gemini.");
      }

      // Update local state with the newly generated article
      setEditPages(prev => {
        const copy = [...prev];
        copy[pageIdx] = {
          ...copy[pageIdx],
          title: data.title || copy[pageIdx].title,
          caption: data.caption || copy[pageIdx].caption,
          content: data.content
        };
        return copy;
      });

      setCorrectionPrompt("");
      setAiSuccessMessage("Matéria reescrita com sucesso pela inteligência artificial!");
      setTimeout(() => setAiSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error("Erro ao regenerar com IA:", err);
      alert("Erro ao reescrever matéria com IA: " + (err.message || err));
    } finally {
      setIsRegeneratingPage(false);
    }
  };

  const handleOpenEdit = () => {
    setEditTitle(magazine.title);
    setEditSubtitle(magazine.subtitle);
    setEditEditorialText(magazine.editorialText);
    setEditPages(magazine.pages.map(p => ({ ...p })));
    setEditTab('cover');
    setSelectedPageIdx(0);
    setIsEditing(true);
  };

  const handleSave = () => {
    const updated: Magazine = {
      ...magazine,
      title: editTitle,
      subtitle: editSubtitle,
      editorialText: editEditorialText,
      pages: editPages,
    };
    onUpdateMagazine(updated);
    setIsEditing(false);
  };

  const handlePageFieldChange = (idx: number, field: keyof MagazinePage, value: any) => {
    setEditPages(prev => {
      const copy = [...prev];
      copy[idx] = {
        ...copy[idx],
        [field]: value
      };
      return copy;
    });
  };

  const bookContainerRef = useRef<HTMLDivElement>(null);
  const pageFlipRef = useRef<PageFlip | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setZoomedMedia(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const journalist = JOURNALISTS.find((j) => j.id === magazine.journalistId) || JOURNALISTS[0];

  // Filter timeline entries to those matching the magazine's season if specified
  const seasonEntries = (magazine.season && timelineEntries)
    ? timelineEntries.filter(e => (e.season || settings?.season) === magazine.season)
    : (timelineEntries || []);

  // Helper to fetch matching media from timeline entries or embedded page media
  const getPageMedia = (page: any, pageIdx: number) => {
    let mediaUrl = page.mediaUrl || "";
    let videoUrl = page.videoUrl || null;
    let rawType = page.mediaType;
    let videoStartTime = page.videoStartTime;
    let videoEndTime = page.videoEndTime;
    let htmlCode = page.htmlCode || "";
    let galleryUrls = page.galleryUrls || [];

    // Always look up matching timeline entry to retrieve live video Blob/URL if needed
    let entry: TimelineEntry | undefined = undefined;
    if (page.suggestedEntryId && seasonEntries) {
      entry = seasonEntries.find(e => e.id === page.suggestedEntryId);
    }
    if (!entry && seasonEntries && seasonEntries.length > 0) {
      const entriesWithMedia = seasonEntries.filter(e => e.mediaUrl || e.videoUrl || e.videoBlob || e.htmlCode || (e.galleryUrls && e.galleryUrls.length > 0));
      entry = entriesWithMedia[pageIdx] || seasonEntries.find(e => e.mediaUrl || e.videoUrl || e.videoBlob || e.htmlCode || (e.galleryUrls && e.galleryUrls.length > 0));
    }

    if (entry) {
      if (!mediaUrl) mediaUrl = entry.mediaUrl || "";
      if (!rawType) rawType = entry.mediaType;
      if (!htmlCode && entry.htmlCode) htmlCode = entry.htmlCode;
      if ((!galleryUrls || galleryUrls.length === 0) && entry.galleryUrls) galleryUrls = entry.galleryUrls;
      if (videoStartTime === undefined) videoStartTime = entry.videoStartTime;
      if (videoEndTime === undefined) videoEndTime = entry.videoEndTime;

      // Check if entry has a video Blob or URL
      if (entry.videoBlob || entry.videoUrl || entry.mediaType === 'video') {
        if (entry.videoBlob) {
          if (!entry.videoUrl || entry.videoUrl.startsWith('blob:')) {
            try {
              entry.videoUrl = URL.createObjectURL(entry.videoBlob);
            } catch (e) {
              console.warn("Could not create object URL for videoBlob:", e);
            }
          }
        }
        if (entry.videoUrl) {
          videoUrl = entry.videoUrl;
          rawType = 'video';
        }
      }
    }

    if (rawType === 'scratch') {
      return {
        url: mediaUrl,
        type: 'scratch' as const,
        scratchCoverText: page.scratchCoverText || 'RASPE PARA REVELAR',
        videoUrl: null
      };
    }

    if (rawType === 'html' || htmlCode) {
      return {
        url: '',
        type: 'html' as const,
        htmlCode,
        videoUrl: null
      };
    }

    if (rawType === 'gallery' || (galleryUrls && galleryUrls.length > 0)) {
      return {
        url: galleryUrls[0] || mediaUrl,
        type: 'gallery' as const,
        galleryUrls,
        videoUrl: null
      };
    }

    const playableVideo = getPlayableVideoUrl(videoUrl, mediaUrl);

    if (playableVideo || rawType === 'video') {
      const activeVid = playableVideo || videoUrl;
      if (activeVid) {
        return {
          url: mediaUrl || activeVid,
          type: 'video' as const,
          videoUrl: activeVid,
          videoStartTime,
          videoEndTime,
          isLocalVideoFrame: false
        };
      }
    }

    // If no active/playable video URL is present (e.g. shared magazine with local video record),
    // fallback to displaying the extracted frame picture (mediaUrl) cleanly as an image!
    return {
      url: mediaUrl,
      type: 'image' as const,
      videoUrl: null,
      videoStartTime: undefined,
      videoEndTime: undefined,
      isLocalVideoFrame: rawType === 'video'
    };
  };

  // Find the cover image URL
  const coverImageUrl = magazine.coverImageUrl || 
    (timelineEntries && timelineEntries.length > 0 ? timelineEntries.find(e => e.mediaUrl)?.mediaUrl : null);

  const printMagazine = () => {
    window.print();
  };

  const downloadSocialShareCard = async (targetShareUrl: string) => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 630;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Dark Luxury Background
      const bgGrad = ctx.createLinearGradient(0, 0, 1200, 630);
      bgGrad.addColorStop(0, "#09090b");
      bgGrad.addColorStop(0.5, "#18181b");
      bgGrad.addColorStop(1, "#09090b");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1200, 630);

      // Gold Accent Frames
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 10;
      ctx.strokeRect(20, 20, 1160, 590);

      ctx.strokeStyle = "rgba(245, 158, 11, 0.3)";
      ctx.lineWidth = 2;
      ctx.strokeRect(32, 32, 1136, 566);

      // Header Branding
      ctx.fillStyle = "#f59e0b";
      ctx.font = "900 28px system-ui, -apple-system, sans-serif";
      ctx.fillText("⚽ SIGA LA PELOTA • EDIÇÃO ESPECIAL DE COLECIONADOR", 60, 75);

      // Title
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 46px system-ui, -apple-system, sans-serif";
      const title = (magazine.title || "Revista Especial").toUpperCase();
      ctx.fillText(title.length > 30 ? title.substring(0, 30) + "..." : title, 60, 135);

      // Subtitle
      ctx.fillStyle = "#d4d4d8";
      ctx.font = "italic 22px Georgia, serif";
      const subtitle = magazine.subtitle ? `"${magazine.subtitle}"` : "Crônicas e análises da jornada no futebol";
      ctx.fillText(subtitle.length > 60 ? subtitle.substring(0, 60) + "..." : subtitle, 60, 175);

      // Draw Cover Thumbnail on Left
      if (coverImageUrl) {
        try {
          const img = new Image();
          img.crossOrigin = "anonymous";
          await new Promise<void>((res) => {
            img.onload = () => res();
            img.onerror = () => res();
            img.src = coverImageUrl;
          });
          if (img.complete && img.naturalWidth > 0) {
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(60, 210, 420, 320, 16);
            ctx.clip();
            ctx.drawImage(img, 60, 210, 420, 320);
            ctx.restore();

            ctx.strokeStyle = "#f59e0b";
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.roundRect(60, 210, 420, 320, 16);
            ctx.stroke();
          }
        } catch (e) {
          console.warn("Cover image load error on card canvas:", e);
        }
      }

      // Large Right Panel: Call to Action Box (No QR Code)
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.roundRect(510, 210, 630, 320, 20);
      ctx.fill();

      // Inner Border
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(510, 210, 630, 320, 20);
      ctx.stroke();

      // CTA Header inside box
      ctx.fillStyle = "#09090b";
      ctx.font = "900 28px system-ui, sans-serif";
      ctx.fillText("📖 LER REVISTA NA NUVEM", 540, 265);

      ctx.fillStyle = "#d97706";
      ctx.font = "900 20px system-ui, sans-serif";
      ctx.fillText("CLIQUE NO LINK DA PUBLICAÇÃO PARA ABRIR!", 540, 300);

      // Feature bullet points
      ctx.fillStyle = "#3f3f46";
      ctx.font = "16px system-ui, sans-serif";
      ctx.fillText("• Edição interativa completa com virada de páginas 📖", 540, 350);
      ctx.fillText("• Raspadinha interativa de fatos secretos 🪙", 540, 380);
      ctx.fillText("• Fotos de campo, crônicas e áudio dos bastidores 🎙️", 540, 410);

      // Gold Action Banner at the bottom of the white card
      ctx.fillStyle = "#f59e0b";
      ctx.beginPath();
      ctx.roundRect(540, 435, 570, 65, 12);
      ctx.fill();

      ctx.fillStyle = "#09090b";
      ctx.font = "900 18px system-ui, sans-serif";
      ctx.fillText("🔗 " + (targetShareUrl.length > 38 ? targetShareUrl.substring(0, 35) + "..." : targetShareUrl), 555, 474);

      // Footer
      ctx.fillStyle = "#a1a1aa";
      ctx.font = "900 15px system-ui, sans-serif";
      ctx.fillText("⚽ SIGA LA PELOTA • CLIQUE NO LINK DA PUBLICAÇÃO PARA ABRIR A REVISTA COMPLETA NA NUVEM", 60, 580);

      // Download trigger
      const link = document.createElement("a");
      link.download = `revista-${magazine.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-capa-share.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Error generating social card PNG:", err);
    }
  };

  const getDynamicFontSize = (text: string) => {
    if (!text) return "text-[13px]";
    const len = text.length;
    if (len > 1800) return "text-[10px] leading-relaxed";
    if (len > 1200) return "text-[11.5px] leading-relaxed";
    return "text-[13px] leading-relaxed";
  };

  const convertRawUrlsToMarkdownLinks = (text: string): string => {
    if (!text) return "";
    const urlRegex = /(?<![\]\(\"'])(https?:\/\/[^\s\)\>]+)/g;
    return text.replace(urlRegex, (url) => {
      let cleanUrl = url;
      let suffix = "";
      if (/[.,;:!?]$/.test(cleanUrl)) {
        suffix = cleanUrl.slice(-1);
        cleanUrl = cleanUrl.slice(0, -1);
      }
      return `[Assista ao Vídeo](${cleanUrl})${suffix}`;
    });
  };

  // Extract first letter for drop cap (Capitular) styling
  const renderDropCapText = (text: string) => {
    if (!text) return "";
    const processedText = convertRawUrlsToMarkdownLinks(text);
    const fontSizeClass = getDynamicFontSize(processedText);

    const markdownComponents = {
      a: ({ node, ...props }: any) => (
        <a
          {...props}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-amber-600 hover:text-amber-700 underline font-bold transition"
        />
      )
    };

    if (processedText.startsWith("#") || processedText.startsWith("*") || processedText.startsWith(">")) {
      return (
        <div className={`prose prose-zinc max-w-none text-zinc-900 font-serif text-justify ${fontSizeClass}`}>
          <Markdown components={markdownComponents}>{processedText}</Markdown>
        </div>
      );
    }
    const cleanText = processedText.replace(/^[\s\n\r]+/, "");
    const firstLetter = cleanText.charAt(0);
    const restOfText = cleanText.substring(1);

    const len = processedText.length;
    const dropCapClass = len > 1800 
      ? "text-2xl" 
      : len > 1200 
        ? "text-3xl" 
        : "text-4xl";

    return (
      <div className={`prose prose-zinc max-w-none text-zinc-900 font-serif text-justify ${fontSizeClass}`}>
        <span className={`float-left font-bold font-sans text-sports-red mr-2 mt-0.5 select-none leading-[0.8] drop-shadow-sm ${dropCapClass}`}>
          {firstLetter}
        </span>
        <Markdown components={markdownComponents}>{restOfText}</Markdown>
      </div>
    );
  };

  const totalPages = 4 + (magazine.pages.length * 2);

  // Global DOM helper to play all video elements inside the book container
  // (This handles original as well as cloned nodes created by the page-flip library)
  useEffect(() => {
    const playAllVideos = () => {
      if (!bookContainerRef.current) return;
      const videos = bookContainerRef.current.querySelectorAll("video");
      videos.forEach((video) => {
        // Enforce loop & playsInline to satisfy browser autoplay policies
        if (!video.loop) video.loop = true;
        if (!video.playsInline) video.playsInline = true;

        if (video.paused) {
          video.play().catch((err) => {
            // Programmatic play can fail before user gesture. That is fine, we listen to clicks too!
            console.log("Programmatic video play failed/awaiting user gesture:", err);
          });
        }
      });
    };

    // Run immediately when current page changes
    playAllVideos();

    // Set an interval to continuously play videos (as page-flip lazy-loads, clones, or moves nodes in the viewport)
    const interval = setInterval(playAllVideos, 400);

    // Capture user clicks or touches inside the book container to unlock autoplay immediately
    const container = bookContainerRef.current;
    if (container) {
      container.addEventListener("click", playAllVideos);
      container.addEventListener("touchstart", playAllVideos);
    }

    return () => {
      clearInterval(interval);
      if (container) {
        container.removeEventListener("click", playAllVideos);
        container.removeEventListener("touchstart", playAllVideos);
      }
    };
  }, [currentPage, isInitialized]);

  // Initialize page-flip library
  useEffect(() => {
    let flipInstance: PageFlip | null = null;

    // Small delay to ensure React finishes mounting DOM nodes
    const timer = setTimeout(() => {
      if (bookContainerRef.current) {
        try {
          const pages = bookContainerRef.current.querySelectorAll(".page-item");
          if (pages.length === 0) return;

          flipInstance = new PageFlip(bookContainerRef.current, {
            width: 450,
            height: 600,
            size: "stretch",
            minWidth: 280,
            maxWidth: 700,
            minHeight: 360,
            maxHeight: 930,
            showCover: true,
            drawShadow: true,
            maxShadowOpacity: 0.25,
            usePortrait: false,
            flippingTime: 800,
            mobileScrollSupport: true,
            disableFlipByClick: true,
            showPageCorners: true,
            clickEventForward: true,
          });

          flipInstance.loadFromHTML(pages);
          pageFlipRef.current = flipInstance;
          setIsInitialized(true);

          flipInstance.on("flip", (e) => {
            setCurrentPage(e.data as number);

            // Immediate programmatic play of videos right on page turn
            setTimeout(() => {
              if (bookContainerRef.current) {
                const videos = bookContainerRef.current.querySelectorAll("video");
                videos.forEach((video) => {
                  if (!video.loop) video.loop = true;
                  if (!video.playsInline) video.playsInline = true;
                  video.play().catch(() => {});
                });
              }
            }, 50);
          });
        } catch (error) {
          console.error("Error initializing PageFlip:", error);
        }
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      if (flipInstance) {
        try {
          flipInstance.destroy();
        } catch (err) {
          console.error("Error destroying PageFlip instance:", err);
        }
      }
      pageFlipRef.current = null;
      setIsInitialized(false);
    };
  }, [magazine.id]); // Re-initialize only if magazine ID changes

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") pageFlipRef.current?.flipNext();
      if (e.key === "ArrowLeft") pageFlipRef.current?.flipPrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleNext = () => {
    pageFlipRef.current?.flipNext();
  };

  const handlePrev = () => {
    pageFlipRef.current?.flipPrev();
  };

  const handleGoToPage = (index: number) => {
    pageFlipRef.current?.turnToPage(index);
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6 print:py-0 print:px-0" id="magazine-reader">
      {/* Dynamic CSS styles for PageFlip wrapper and layout styling */}
      <style>{`
        .stPageFlip {
          background: transparent;
          margin: 0 auto;
        }
        
        .page-item {
          background-color: #FAF6F0;
          color: #18181b;
          width: 450px;
          height: 600px;
          box-sizing: border-box;
          padding: 28px;
          border: 1px solid #e4e4e7;
          box-shadow: inset 0 0 30px rgba(0,0,0,0.03);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          overflow: hidden;
          position: relative;
        }
        
        .page-item.--hard {
          background-color: #09090b;
          color: white;
          border: 1px solid #18181b;
          box-shadow: inset 0 0 50px rgba(0,0,0,0.6);
          padding: 36px;
        }
        
        /* Drop shadow and depth for PageFlip book container */
        .stPageFlip-container {
          box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.4);
          border-radius: 12px;
          background: #09090b;
          overflow: hidden;
          transition: opacity 0.3s ease;
        }

        /* Styling scrollbars for text-rich columns inside pages */
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: rgba(0, 0, 0, 0.1);
          border-radius: 20px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background-color: rgba(0, 0, 0, 0.2);
        }

        @media print {
          body, #magazine-reader {
            background: white !important;
            color: black !important;
          }
          .stPageFlip-container {
            box-shadow: none !important;
            background: transparent !important;
            border: none !important;
          }
          .stPageFlip {
            display: block !important;
            opacity: 1 !important;
            width: auto !important;
            height: auto !important;
          }
          .page-item {
            display: block !important;
            width: 100% !important;
            height: auto !important;
            min-height: auto !important;
            page-break-after: always !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
            padding: 20px 0 !important;
            overflow: visible !important;
          }
          .page-item.--hard {
            background: white !important;
            color: black !important;
            border: none !important;
            box-shadow: none !important;
          }
          .flex-1.overflow-y-auto {
            overflow: visible !important;
            height: auto !important;
          }
          video, .video-container {
            display: none !important;
          }
        }
      `}</style>

      {/* Editorial Bar */}
      <div className="flex items-center justify-between bg-zinc-900 text-white px-6 py-3 rounded-2xl border border-zinc-800 shadow-lg print:hidden">
        <div className="flex items-center gap-3">
          {isSharedView ? (
            <button
              onClick={() => window.location.href = window.location.origin}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-zinc-950 rounded-xl transition text-xs font-black shadow-md shadow-amber-500/10 animate-pulse cursor-pointer"
              title="Crie sua própria revista de carreira!"
            >
              <Sparkles className="w-4 h-4" />
              <span>Criar Minha Revista</span>
            </button>
          ) : (
            <button
              onClick={onBackToList}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-zinc-200 transition text-xs font-semibold shadow-sm cursor-pointer"
              title="Voltar para a tela de início"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar ao Início</span>
            </button>
          )}
          <div>
            <span className="text-[10px] font-mono tracking-widest text-amber-500 block uppercase font-black">
              {magazine.period.toUpperCase()}
            </span>
            <h1 className="text-xs font-bold font-sans text-zinc-100">{magazine.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <span className="text-xs font-mono text-zinc-400 hidden lg:inline">
            Página <span className="text-white font-bold">
              {currentPage === 0 ? "CAPA" : currentPage === totalPages - 1 ? "FIM" : `${currentPage} / ${totalPages - 2}`}
            </span>
          </span>
          
          {!isSharedView && (
            <>
              <button
                onClick={() => { setShowShareModal(true); setShareUrl(null); setShareError(null); }}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-md"
                title="Compartilhar revista publicamente"
              >
                <Share2 className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Compartilhar</span>
                <span className="inline sm:hidden">Share</span>
              </button>
              
              <button
                onClick={handleOpenEdit}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/10 transition hover:scale-105 active:scale-95 cursor-pointer"
                title="Editar textos das matérias"
              >
                <Pencil className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Editar Matérias</span>
                <span className="inline sm:hidden">Editar</span>
              </button>
            </>
          )}

          <button
            onClick={printMagazine}
            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 transition flex items-center gap-1 text-xs font-semibold cursor-pointer"
            title="Imprimir revista"
          >
            <Printer className="w-3.5 h-3.5" /> <span className="hidden md:inline">Imprimir</span>
          </button>
        </div>
      </div>

      {/* Book Navigation Tabs */}
      <div className="flex flex-wrap justify-center gap-2 print:hidden">
        <button
          onClick={() => handleGoToPage(0)}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
            currentPage === 0
              ? "bg-amber-500 text-zinc-950 shadow-md"
              : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
          }`}
        >
          Capa
        </button>
        <button
          onClick={() => handleGoToPage(1)}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
            currentPage === 1 || currentPage === 2
              ? "bg-amber-500 text-zinc-950 shadow-md"
              : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
          }`}
        >
          Editorial
        </button>
        {magazine.pages.map((_, pIdx) => {
          const pageIndex = 3 + (pIdx * 2);
          const isCurrent = currentPage === pageIndex || currentPage === pageIndex + 1;
          return (
            <button
              key={pIdx}
              onClick={() => handleGoToPage(pageIndex)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                isCurrent
                  ? "bg-amber-500 text-zinc-950 shadow-md"
                  : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
              }`}
            >
              Matéria {pIdx + 1}
            </button>
          );
        })}
        <button
          onClick={() => handleGoToPage(totalPages - 1)}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
            currentPage === totalPages - 1
              ? "bg-amber-500 text-zinc-950 shadow-md"
              : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
          }`}
        >
          Contra-Capa
        </button>
      </div>

      {/* Magazine Stage */}
      <div className="relative bg-[#faf6f0]/40 dark:bg-zinc-900/10 rounded-[2.5rem] border border-zinc-200/50 dark:border-zinc-800/50 p-1 md:p-6 shadow-2xl backdrop-blur-sm overflow-hidden min-h-[500px] md:min-h-[600px] flex flex-col justify-between print:bg-transparent print:border-none print:shadow-none print:p-0">
        
        {/* Soft layout page flip effect container */}
        <div className="w-full max-w-4xl mx-auto flex-1 flex items-center justify-center relative min-h-[460px] md:min-h-[550px]">
          
          <div 
            key={magazine.id} 
            ref={bookContainerRef} 
            className="stPageFlip"
            style={{ opacity: isInitialized ? 1 : 0 }}
          >
            {/* ================= PAGE 1: COVER (HARD) ================= */}
            <div className="page-item --hard" data-density="hard">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(40,40,40,0.2)_0%,transparent_80%)] pointer-events-none" />
              
              {/* Cover Top Header */}
              <div className="relative z-10 border-b border-zinc-800 pb-3 flex items-center justify-between w-full">
                <div>
                  <span className="text-sports-red font-bold tracking-widest text-[8px] font-mono block uppercase">EDIÇÃO ESPECIAL</span>
                  <div className="text-sm font-black tracking-tighter uppercase font-sans mt-0.5 flex items-center gap-1 text-zinc-100">
                    ⚽ <span className="text-amber-500 font-extrabold">SIGA LA PELOTA</span>
                  </div>
                </div>
                <div className="text-right flex items-center gap-2">
                  <div className="text-right">
                    <span className="block text-[7px] font-mono text-zinc-500">AUTOR DA EDIÇÃO:</span>
                    <span className="text-[9px] font-bold text-amber-500 font-mono uppercase bg-amber-500/10 px-1.5 py-0.5 border border-amber-500/20 rounded">
                      {journalist.name}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cover Center Layout */}
              <div className="relative z-10 flex flex-col gap-3 my-auto w-full">
                {/* SVG Logo Embedded on Cover */}
                <div className="flex justify-center -my-2">
                  <SigaLaPelotaLogo className="w-24 h-24" showFrame={false} />
                </div>

                <div className="space-y-1.5 text-center">
                  <span className="inline-flex items-center gap-1 text-[8px] font-mono font-black bg-amber-500 text-zinc-950 px-2 py-0.5 rounded-full uppercase">
                    🏆 {magazine.period}
                  </span>
                  <h1 className="text-xl md:text-2xl font-black font-sans leading-tight tracking-tight text-white uppercase break-words">
                    {magazine.title}
                  </h1>
                  <p className="text-zinc-300 text-xs font-serif italic border-l-2 border-amber-500 pl-2 leading-relaxed inline-block max-w-[90%] text-left">
                    "{magazine.subtitle}"
                  </p>
                </div>

                {/* Cover Main Illustration Frame */}
                {coverImageUrl && (
                  <div 
                    onClick={() => setZoomedMedia({
                      url: coverImageUrl,
                      type: 'image',
                      title: magazine.title,
                      caption: "Capa da Revista"
                    })}
                    className="aspect-video bg-zinc-950 border border-zinc-800 rounded-lg shadow-lg overflow-hidden relative w-full flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-amber-500/50 transition group"
                  >
                    <img 
                      src={coverImageUrl} 
                      alt="Cover highlight" 
                      className="w-full h-full object-contain group-hover:scale-[1.02] transition duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1 px-2 pt-4 pointer-events-none" />
                    <span className="absolute bottom-1 right-2 text-[8px] text-zinc-300 font-mono truncate max-w-[95%]">
                      📸 Clique para zoom
                    </span>
                  </div>
                )}
              </div>

              {/* Cover Footer */}
              <div className="relative z-10 border-t border-zinc-800 pt-3 flex justify-between items-center w-full text-zinc-500 text-[8px]">
                <span className="font-mono tracking-wider uppercase">© SIGA LA PELOTA</span>
                <span className="bg-sports-red/10 border border-sports-red/20 text-sports-red font-bold px-1.5 py-0.5 rounded">
                  ANÁLISE REALISTA
                </span>
              </div>

              {/* Top Right Corner Turn Hotspot */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                className="absolute top-3 right-3 z-30 px-2 py-1 bg-amber-500/90 hover:bg-amber-400 text-zinc-950 rounded-bl-lg text-[9px] font-black font-mono shadow-md flex items-center gap-0.5 hover:scale-105 active:scale-95 transition cursor-pointer"
                title="Virar para Próxima Página (Canto Superior)"
              >
                <span>Virar</span>
                <ChevronRight className="w-3 h-3" />
              </button>

              {/* Bottom Right Corner Turn Hotspot */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                className="absolute bottom-3 right-3 z-30 px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-lg text-[10px] font-black font-mono shadow-lg flex items-center gap-1 hover:scale-105 active:scale-95 transition cursor-pointer"
                title="Abrir Revista"
              >
                <span>Abrir Revista</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* ================= PAGE 2: EDITORIAL COLUMN LEFT ================= */}
            <div className="page-item">
              {/* Top Left Corner Turn Hotspot */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                className="absolute top-2 left-2 z-30 px-2 py-1 bg-zinc-800/90 hover:bg-zinc-800 text-zinc-100 rounded-br-lg text-[9px] font-black font-mono shadow-md flex items-center gap-0.5 hover:scale-105 active:scale-95 transition cursor-pointer border border-zinc-700/50"
                title="Voltar para a Capa (Canto Superior)"
              >
                <ChevronLeft className="w-3 h-3 text-amber-400" />
                <span>Capa</span>
              </button>

              <div className="border-b-2 border-zinc-950 pb-2 flex justify-between items-end w-full">
                <div>
                  <span className="text-[8px] font-mono font-bold tracking-widest text-sports-red uppercase block">OPINIÃO & CRÔNICA</span>
                  <h2 className="text-xs font-black font-sans uppercase">A VOZ DO CRONISTA</h2>
                </div>
                <div className="text-right font-mono text-[8px] text-zinc-400">
                  <span>SEÇÃO DO EDITOR</span>
                </div>
              </div>

              {/* Column layout for Editorial Spread */}
              <div className="flex flex-col justify-center items-center my-auto w-full space-y-4 py-2">
                <div className="text-center space-y-2 w-full max-w-xs">
                  <div className="text-3xl mx-auto p-2 bg-white shadow-sm border border-zinc-200 rounded-full w-12 h-12 flex items-center justify-center">
                    {journalist.avatar}
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-900 text-xs leading-tight">{journalist.name}</h3>
                    <span className="text-[7px] text-zinc-500 font-mono uppercase tracking-wider block mt-0.5">Colunista Convidado</span>
                  </div>
                  <p className="text-[10px] text-zinc-600 leading-relaxed italic border-t border-zinc-200 pt-2">
                    "{journalist.bio}"
                  </p>
                </div>

                <div className="border-t border-zinc-200 pt-2 text-center w-full">
                  <span className="text-[8px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">ASSINATURA DO AUTOR</span>
                  <span className="font-serif italic text-zinc-800 text-sm mt-1 block">
                    🖋️ {journalist.name}
                  </span>
                </div>
              </div>

              <div className="border-t border-zinc-200 pt-2 text-center w-full">
                <span className="font-mono text-[8px] text-zinc-400 uppercase">EDIÇÃO DE COLECIONADOR • PÁGINA 1</span>
              </div>

              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                className="absolute bottom-2 left-2 z-30 px-2 py-1 bg-zinc-800/90 hover:bg-zinc-800 text-zinc-100 rounded-lg text-[9px] font-black font-mono shadow-md flex items-center gap-1 hover:scale-105 active:scale-95 transition cursor-pointer border border-zinc-700/50"
                title="Voltar para a Capa"
              >
                <ChevronLeft className="w-3 h-3 text-amber-400" />
                <span>Capa</span>
              </button>
            </div>

            {/* ================= PAGE 3: EDITORIAL COLUMN RIGHT ================= */}
            <div className="page-item">
              {/* Top Right Corner Turn Hotspot */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                className="absolute top-2 right-2 z-30 px-2 py-1 bg-amber-500/90 hover:bg-amber-600 text-zinc-950 rounded-bl-lg text-[9px] font-black font-mono shadow-md flex items-center gap-0.5 hover:scale-105 active:scale-95 transition cursor-pointer"
                title="Ir para a Matéria 1 (Canto Superior)"
              >
                <span>Virar</span>
                <ChevronRight className="w-3 h-3" />
              </button>

              <div className="border-b-2 border-zinc-950 pb-2 flex justify-between items-end w-full">
                <div className="flex items-center gap-1 text-sports-red">
                  <Quote className="w-4 h-4 opacity-40" />
                  <span className="font-mono text-[8px] font-black tracking-wider uppercase">Editorial Editorializado</span>
                </div>
                <span className="font-mono text-[8px] text-zinc-400">PÁGINA 2</span>
              </div>

              <div className="flex-1 overflow-y-auto pr-1 my-auto scrollbar-thin text-justify py-3">
                {renderDropCapText(magazine.editorialText)}
              </div>

              <div className="border-t border-zinc-200 pt-2 text-center w-full">
                <span className="font-mono text-[8px] text-zinc-400 uppercase">CRÔNICA DA SEMANA • IMPRESSO NO BRASIL</span>
              </div>

              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                className="absolute bottom-2 right-2 z-30 px-2 py-1 bg-amber-500 hover:bg-amber-600 text-zinc-950 rounded-lg text-[9px] font-black font-mono shadow-md flex items-center gap-1 hover:scale-105 active:scale-95 transition cursor-pointer"
                title="Ir para a Matéria 1"
              >
                <span>Matéria 1</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* ================= PAGES 4+ : ARTICLES SPREADS (INTERLEAVED TEXT & MEDIA) ================= */}
            {magazine.pages.flatMap((page, pageIdx) => {
              const pageMedia = getPageMedia(page, pageIdx);
              return [
                // Left page: Text Content
                <div key={`page-text-${pageIdx}`} className="page-item" data-density="soft">
                  {/* Top Left Corner Turn Hotspot */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                    className="absolute top-2 left-2 z-30 px-2 py-1 bg-zinc-800/90 hover:bg-zinc-800 text-zinc-100 rounded-br-lg text-[9px] font-black font-mono shadow-md flex items-center gap-0.5 hover:scale-105 active:scale-95 transition cursor-pointer border border-zinc-700/50"
                    title="Página Anterior (Canto Superior)"
                  >
                    <ChevronLeft className="w-3 h-3 text-amber-400" />
                    <span>Voltar</span>
                  </button>

                  <div className="border-b border-zinc-300 pb-2 flex justify-between items-end w-full">
                    <div>
                      <span className="text-[8px] font-mono font-bold tracking-widest text-zinc-500 uppercase block">
                        REPORTE DE CAMPO
                      </span>
                      <h2 className="text-xs font-black font-sans tracking-tight text-zinc-950 uppercase line-clamp-1">
                        {page.title}
                      </h2>
                    </div>
                    <div className="text-right font-mono text-[8px] text-zinc-400">
                      <span>MATÉRIA {pageIdx + 1}</span>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-1 my-auto scrollbar-thin py-3 text-justify">
                    {renderDropCapText(page.content)}
                  </div>

                  <div className="border-t border-zinc-200 pt-2 flex justify-between text-[7px] font-mono text-zinc-400 w-full">
                    <span>SIGA LA PELOTA COMPANION</span>
                    <span>PÁGINA {3 + (pageIdx * 2)}</span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                    className="absolute bottom-2 left-2 z-30 px-2 py-1 bg-zinc-800/90 hover:bg-zinc-800 text-zinc-100 rounded-lg text-[9px] font-black font-mono shadow-md flex items-center gap-1 hover:scale-105 active:scale-95 transition cursor-pointer border border-zinc-700/50"
                    title="Página Anterior"
                  >
                    <ChevronLeft className="w-3 h-3 text-amber-400" />
                    <span>Anterior</span>
                  </button>
                </div>,

                // Right page: Media Showcase matching the text on the left
                <div key={`page-visual-${pageIdx}`} className="page-item" data-density="soft">
                  {/* Top Right Corner Turn Hotspot */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleNext(); }}
                    className="absolute top-2 right-2 z-30 px-2 py-1 bg-amber-500/90 hover:bg-amber-600 text-zinc-950 rounded-bl-lg text-[9px] font-black font-mono shadow-md flex items-center gap-0.5 hover:scale-105 active:scale-95 transition cursor-pointer"
                    title="Próxima Página (Canto Superior)"
                  >
                    <span>Virar</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>

                  <div className="border-b border-zinc-300 pb-2 flex justify-between items-end w-full">
                    <span className="text-[8px] font-mono font-bold tracking-widest text-zinc-500 uppercase">
                      REGISTRO ILUSTRADO
                    </span>
                    <span className="font-mono text-[8px] text-zinc-400">PÁGINA {4 + (pageIdx * 2)}</span>
                  </div>

                  <div className="flex-1 flex flex-col justify-center gap-3 my-auto py-2 w-full">
                    {pageMedia && (
                      <div className="bg-white p-2 rounded-lg border border-zinc-200 shadow-sm w-full">
                        {pageMedia.type === 'scratch' ? (
                          <ScratchCard
                            imageUrl={pageMedia.url}
                            coverText={pageMedia.scratchCoverText || 'RASPE PARA REVELAR'}
                            title={page.title}
                            caption={page.caption}
                          />
                        ) : pageMedia.type === 'html' ? (
                          <div className="aspect-video rounded-md overflow-hidden bg-white border border-zinc-300 relative w-full shadow-inner">
                            <iframe
                              srcDoc={pageMedia.htmlCode}
                              title="Embed Canvas / HTML"
                              className="w-full h-full border-0"
                              sandbox="allow-scripts allow-same-origin allow-popups"
                            />
                          </div>
                        ) : pageMedia.type === 'gallery' ? (
                          <AutoImageCarousel
                            urls={pageMedia.galleryUrls}
                            alt={page.title}
                            caption={page.caption}
                            intervalMs={5000}
                            onZoom={(url, index, allUrls) => setZoomedMedia({
                              url,
                              type: 'image',
                              title: page.title,
                              caption: page.caption,
                              galleryUrls: allUrls || pageMedia.galleryUrls,
                              currentIndex: index || 0,
                            })}
                          />
                        ) : (
                          <div 
                            onClick={() => setZoomedMedia({
                              url: pageMedia.url,
                              videoUrl: pageMedia.videoUrl,
                              videoStartTime: pageMedia.videoStartTime,
                              videoEndTime: pageMedia.videoEndTime,
                              type: pageMedia.videoUrl ? 'video' : 'image',
                              title: page.title,
                              caption: page.caption,
                              galleryUrls: pageMedia.galleryUrls,
                            })}
                            className="aspect-video rounded-md overflow-hidden bg-zinc-950 border border-zinc-800 relative w-full flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-amber-500/50 transition group"
                          >
                            {pageMedia.videoUrl ? (
                              <div className="w-full h-full relative">
                                <MagazineVideo 
                                  src={pageMedia.videoUrl} 
                                  startTime={pageMedia.videoStartTime}
                                  endTime={pageMedia.videoEndTime}
                                />
                                <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded text-[8px] text-zinc-300 font-mono tracking-wider pointer-events-none">
                                  ZOOM CONTROLES 🔍
                                </div>
                              </div>
                            ) : (
                              <img 
                                src={pageMedia.url} 
                                alt={page.title} 
                                className="w-full h-full object-contain group-hover:scale-[1.02] transition duration-300"
                                referrerPolicy="no-referrer"
                              />
                            )}
                            {!pageMedia.videoUrl && (
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px] font-mono tracking-wider">
                                VER EM TELA CHEIA 🔍
                              </div>
                            )}
                          </div>
                        )}
                        {page.caption && (
                          <p className="text-[9px] text-zinc-500 font-serif italic mt-1.5 text-center leading-relaxed">
                            📸 {page.caption}
                          </p>
                        )}
                      </div>
                    )}
                    
                    <div className="bg-zinc-100/80 p-2.5 rounded-lg border border-zinc-200/50 font-mono text-[8px] text-zinc-500 w-full">
                      <span className="font-bold text-zinc-700 block uppercase mb-0.5">🔍 Nota da Redação:</span>
                      <p className="leading-relaxed">Registro extraído em tempo real do banco de dados táticos de seu personagem.</p>
                    </div>
                  </div>

                  <div className="border-t border-zinc-200 pt-2 text-center w-full">
                    <span className="font-mono text-[8px] text-zinc-400 uppercase">IMAGENS EXCLUSIVAS DA JORNADA</span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleNext(); }}
                    className="absolute bottom-2 right-2 z-30 px-2 py-1 bg-amber-500 hover:bg-amber-600 text-zinc-950 rounded-lg text-[9px] font-black font-mono shadow-md flex items-center gap-1 hover:scale-105 active:scale-95 transition cursor-pointer"
                    title="Próxima Página"
                  >
                    <span>Próxima</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              ];
            })}

            {/* ================= LAST PAGE: BACK COVER (HARD) ================= */}
            <div className="page-item --hard" data-density="hard">
              {/* Top Left Corner Turn Hotspot */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                className="absolute top-3 left-3 z-30 px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-br-lg text-[9px] font-black font-mono shadow-md flex items-center gap-0.5 hover:scale-105 active:scale-95 transition cursor-pointer border border-zinc-700"
                title="Voltar Revista (Canto Superior)"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-amber-400" />
                <span>Voltar</span>
              </button>

              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(20,20,20,0.1)_0%,transparent_90%)] pointer-events-none" />
              
              <div className="text-center">
                <span className="text-amber-500 text-[8px] font-mono tracking-widest block uppercase font-bold">ARQUIVO DIGITAL</span>
                <h2 className="text-base font-black mt-1 font-sans tracking-wider text-zinc-100 uppercase">SIGA LA PELOTA</h2>
                <div className="w-10 h-0.5 bg-amber-500 mx-auto mt-1 rounded"></div>
              </div>

              <div className="my-auto space-y-3 max-w-[240px] mx-auto w-full text-center">
                {/* SVG Logo on Back Cover */}
                <div className="flex justify-center -my-1">
                  <SigaLaPelotaLogo className="w-24 h-24" showFrame={true} />
                </div>

                <div className="p-2.5 bg-zinc-900/80 rounded-xl border border-zinc-800/80 text-center">
                  <span className="text-[9px] font-serif italic text-zinc-300 block leading-relaxed">
                    "O futebol é o esporte mais bonito do mundo, e cada carreira merece ter sua crônica arquivada na eternidade."
                  </span>
                  <span className="text-[8px] font-mono text-amber-500 font-bold block mt-1.5 uppercase">Siga La Pelota</span>
                </div>

                <div className="bg-white p-1.5 rounded-lg inline-block shadow-md">
                  <div className="w-28 h-6 bg-repeating-linear-gradient-barcode mb-1 mx-auto" style={{
                    background: "repeating-linear-gradient(90deg, #000, #000 2px, #fff 2px, #fff 4px, #000 4px, #000 7px, #fff 7px, #fff 9px)"
                  }}></div>
                  <div className="text-black text-[7px] font-mono font-bold tracking-[2px]">7891026008105</div>
                </div>
              </div>

              <div className="border-t border-zinc-800 pt-3 text-zinc-600 text-[7px] font-mono space-y-0.5 w-full text-center">
                <p>DESENVOLVIDO POR SIGA LA PELOTA PARA AMANTES DO MODO CARREIRA</p>
                <p>SIGA LA PELOTA CAREER COMPANION</p>
              </div>

              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                className="absolute bottom-3 left-3 z-30 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-lg text-[10px] font-black font-mono shadow-lg flex items-center gap-1 hover:scale-105 active:scale-95 transition cursor-pointer border border-zinc-700"
                title="Voltar Revista"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-amber-400" />
                <span>Voltar Revista</span>
              </button>
            </div>

          </div>

          {/* Loading placeholders if not initialized yet */}
          {!isInitialized && (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
              <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs text-zinc-500 font-mono">Preparando encadernação e páginas físicas...</span>
            </div>
          )}

        </div>

        {/* Navigation Controls in Stage */}
        <div className="flex items-center justify-between mt-4 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 shadow-sm print:hidden">
          <button
            onClick={handlePrev}
            disabled={currentPage === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-transparent transition text-zinc-700 dark:text-zinc-300"
          >
            <ChevronLeft className="w-4 h-4" /> Anterior
          </button>

          <span className="text-xs font-mono font-medium text-zinc-500">
            Folheando: <span className="text-zinc-950 dark:text-zinc-100 font-black">{currentPage === 0 ? "Capa" : currentPage === totalPages - 1 ? "Contra-capa" : `Pág. ${currentPage}`}</span> / <span className="text-zinc-500">{totalPages - 1}</span>
          </span>

          <button
            onClick={handleNext}
            disabled={currentPage === totalPages - 1}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-transparent transition text-zinc-700 dark:text-zinc-300"
          >
            Próximo <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Zoom Media Modal Overlay */}
      {zoomedMedia && (
        <ZoomedMediaModal
          media={zoomedMedia}
          onClose={() => setZoomedMedia(null)}
        />
      )}

      {/* Edit Magazine Modal Overlay */}
      {isEditing && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 transition-all duration-300 overflow-y-auto"
          onClick={() => setIsEditing(false)}
        >
          <div 
            className="bg-zinc-900 border border-zinc-800 text-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-amber-500 block uppercase font-bold">
                  Redação de Matérias
                </span>
                <h2 className="text-lg font-bold font-sans">Editar Textos da Edição</h2>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs Selector */}
            <div className="flex border-b border-zinc-800 my-4">
              <button
                onClick={() => setEditTab('cover')}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
                  editTab === 'cover'
                    ? "border-amber-500 text-amber-500"
                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Capa & Editorial
              </button>
              <button
                onClick={() => setEditTab('pages')}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
                  editTab === 'pages'
                    ? "border-amber-500 text-amber-500"
                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Páginas das Matérias
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4 py-2 scrollbar-thin">
              {editTab === 'cover' ? (
                <div className="space-y-4">
                  {/* Title */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">
                      Título da Revista
                    </label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 font-sans"
                      placeholder="Ex: Noite de Glória na Libertadores"
                    />
                  </div>

                  {/* Subtitle */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">
                      Subtítulo da Capa
                    </label>
                    <input
                      type="text"
                      value={editSubtitle}
                      onChange={(e) => setEditSubtitle(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 font-sans"
                      placeholder="Ex: Uma campanha histórica selada com superação..."
                    />
                  </div>

                  {/* Editorial Text */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">
                      Texto da Coluna Editorial (Markdown disponível)
                    </label>
                    <textarea
                      value={editEditorialText}
                      onChange={(e) => setEditEditorialText(e.target.value)}
                      rows={8}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 font-serif leading-relaxed"
                      placeholder="Escreva a coluna de abertura da revista..."
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row gap-6 min-h-[350px]">
                  {/* Left list of pages */}
                  <div className="w-full md:w-1/3 flex flex-row md:flex-col gap-1.5 overflow-x-auto md:overflow-y-auto pr-1 border-b md:border-b-0 md:border-r border-zinc-800 pb-3 md:pb-0 h-fit md:max-h-[350px]">
                    {editPages.map((page, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => setSelectedPageIdx(pIdx)}
                        className={`flex-shrink-0 text-left px-4 py-3 rounded-xl transition text-xs font-semibold flex items-center justify-between gap-2 border w-full ${
                          selectedPageIdx === pIdx
                            ? "bg-amber-500 text-zinc-950 border-amber-400"
                            : "bg-zinc-950 hover:bg-zinc-850 text-zinc-300 border-zinc-800/80"
                        }`}
                      >
                        <span className="truncate max-w-[150px]">
                          Pág {3 + pIdx * 2}: {page.title || `Matéria ${pIdx + 1}`}
                        </span>
                        <Pencil className="w-3 h-3 opacity-60" />
                      </button>
                    ))}
                  </div>

                  {/* Right form fields */}
                  <div className="flex-1 space-y-4">
                    {editPages[selectedPageIdx] ? (
                      <>
                        {/* Page Title */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">
                            Título da Matéria (Página {3 + selectedPageIdx * 2})
                          </label>
                          <input
                            type="text"
                            value={editPages[selectedPageIdx].title}
                            onChange={(e) => handlePageFieldChange(selectedPageIdx, 'title', e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 font-sans"
                            placeholder="Ex: O Gol de Placa de Bicicleta"
                          />
                        </div>

                        {/* Page Caption */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">
                            Legenda da Imagem/Cena (Página {4 + selectedPageIdx * 2})
                          </label>
                          <input
                            type="text"
                            value={editPages[selectedPageIdx].caption || ""}
                            onChange={(e) => handlePageFieldChange(selectedPageIdx, 'caption', e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 font-sans"
                            placeholder="Ex: Momento exato da finalização que estufou as redes."
                          />
                        </div>

                        {/* AI Page Rewrite Card */}
                        <div className="bg-zinc-950/60 border border-amber-500/30 rounded-2xl p-4 space-y-3 shadow-lg shadow-amber-500/5 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                          <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider font-mono">
                              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                              <span>Reescrever Matéria com Inteligência Artificial</span>
                            </div>
                            <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-mono uppercase font-black">
                              Persona Ativa
                            </span>
                          </div>
                          
                          <p className="text-[11px] text-zinc-400 leading-relaxed relative z-10">
                            Houve alucinação na matéria? Escreva abaixo o contexto real do jogo (quem ganhou, detalhes táticos, placar real) e o jornalista reescreverá a matéria inteira no estilo dele.
                          </p>

                          <div className="flex flex-col sm:flex-row gap-2 relative z-10">
                            <input
                              type="text"
                              value={correctionPrompt}
                              onChange={(e) => setCorrectionPrompt(e.target.value)}
                              disabled={isRegeneratingPage}
                              placeholder="Ex: Perdemos esse jogo de 2x0 devido a expulsão no início. Destaque o drama tático."
                              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder-zinc-600 font-sans"
                            />
                            <button
                              type="button"
                              onClick={() => handleRegeneratePageWithAI(selectedPageIdx)}
                              disabled={isRegeneratingPage || !correctionPrompt.trim()}
                              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-600 text-zinc-950 font-black rounded-xl text-xs transition duration-200 flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/10 cursor-pointer disabled:cursor-not-allowed shrink-0"
                            >
                              {isRegeneratingPage ? (
                                <>
                                  <div className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                                  <span>Reescrevendo...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3.5 h-3.5" />
                                  <span>Corrigir com IA</span>
                                </>
                              )}
                            </button>
                          </div>

                          {aiSuccessMessage && (
                            <div className="text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl font-medium animate-fade-in flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5" />
                              <span>{aiSuccessMessage}</span>
                            </div>
                          )}
                        </div>

                        {/* Page Content */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">
                            Conteúdo da Matéria (Markdown disponível)
                          </label>
                          <textarea
                            value={editPages[selectedPageIdx].content}
                            onChange={(e) => handlePageFieldChange(selectedPageIdx, 'content', e.target.value)}
                            rows={10}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 font-serif leading-relaxed"
                            placeholder="Escreva a crônica da partida..."
                          />
                        </div>
                      </>
                    ) : (
                      <div className="text-zinc-500 text-xs text-center py-12">
                        Selecione uma matéria à esquerda para editá-la.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-zinc-800 pt-4 mt-4">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 rounded-xl text-xs font-bold transition shadow-md shadow-amber-500/10 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Salvar Alterações</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in print:hidden" id="share-modal">
          <div className="relative w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4 text-zinc-100">
            <button
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
              <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <Share2 className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-bold font-sans">Compartilhar & Exportar Revista</h3>
                <p className="text-xs text-zinc-400 leading-normal">Escolha abaixo como deseja salvar ou divulgar esta edição especial.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Option A: Firebase Dynamic Link */}
              <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider font-mono">
                    <Share2 className="w-4 h-4" />
                    <span>Link Dinâmico (Online)</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-normal">
                    Gera um link rápido hospedado na nuvem. As fotos serão otimizadas e comprimidas na hora. Vídeos serão exibidos com suas imagens de miniatura estáticas.
                  </p>
                </div>

                {isSharing ? (
                  <div className="flex items-center gap-2 py-3 px-3 bg-zinc-900 border border-amber-500/30 rounded-xl">
                    <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin shrink-0" />
                    <span className="text-[11px] text-amber-400 font-mono font-bold">Gerando e publicando revista na nuvem...</span>
                  </div>
                ) : shareUrl ? (
                  <div className="space-y-2">
                    <div className="bg-zinc-900 border border-amber-500/40 rounded-xl p-3 flex items-center justify-between gap-2 overflow-hidden shadow-lg shadow-amber-500/5">
                      <span className="text-[11px] text-amber-300 font-mono select-all truncate">
                        {shareUrl}
                      </span>
                      <button
                        onClick={handleCopyLink}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 rounded-lg transition flex items-center gap-1.5 text-xs font-black shrink-0 cursor-pointer shadow-md"
                        title="Copiar link para a área de transferência"
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4 text-zinc-950" />
                            <span>Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Copiar Link</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-[10px] text-emerald-400 font-mono">
                      ✓ Link público gerado! Qualquer pessoa com este link poderá ler sua revista.
                    </p>
                  </div>
                ) : shareError ? (
                  <div className="space-y-2">
                    <div className="bg-rose-950/40 border border-rose-500/30 rounded-xl p-3 text-rose-300 text-[11px]">
                      <p className="font-bold">Não foi possível gerar o link:</p>
                      <p className="text-[10px] text-rose-400 mt-0.5">{shareError}</p>
                    </div>
                    <button
                      onClick={handleShare}
                      className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Tentar Novamente</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleShare}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Gerar Link de Nuvem</span>
                  </button>
                )}
              </div>

              {/* Option B: Self-contained ZIP */}
              <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">
                    <FileArchive className="w-4 h-4" />
                    <span>Pasta Autônoma (ZIP)</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-normal">
                    Excelente para vídeos! Cria uma pasta com um arquivo <strong>index.html</strong> e todas as fotos e vídeos em alta definição. Perfeito para rodar offline ou publicar gratuitamente no <strong>GitHub Pages / Netlify</strong>!
                  </p>
                </div>

                {/* Large Video Warning & Option */}
                {(() => {
                  const { largeCount, criticalCount, totalSize } = getLargeVideoStats();
                  if (criticalCount > 0 || largeCount > 0) {
                    return (
                      <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-3 space-y-2 text-[11px] text-amber-200">
                        <div className="flex items-start gap-1.5">
                          <span className="text-sm">⚠️</span>
                          <div>
                            <p className="font-bold">Vídeos Pesados Detectados!</p>
                            <p className="text-zinc-400 mt-0.5 leading-normal">
                              Você tem <b>{criticalCount + largeCount}</b> vídeo(s) na revista que somam <b>{(totalSize / (1024 * 1024)).toFixed(0)}MB</b>.
                              {criticalCount > 0 && ` O GitHub bloqueia arquivos maiores que 100MB.`}
                            </p>
                          </div>
                        </div>
                        
                        <label className="flex items-start gap-2 bg-zinc-950/40 border border-zinc-800 rounded-lg p-2 hover:bg-zinc-950/60 transition cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={optimizeForGithub}
                            onChange={(e) => setOptimizeForGithub(e.target.checked)}
                            className="rounded border-zinc-700 text-emerald-500 focus:ring-emerald-500 bg-zinc-900 w-3.5 h-3.5 cursor-pointer mt-0.5"
                          />
                          <span className="text-[10px] text-zinc-300 font-sans leading-tight">
                            <b>Otimizar para o GitHub Pages</b> (substitui vídeos &gt;95MB por frames estáticos para caber sem erro).
                          </span>
                        </label>
                      </div>
                    );
                  }
                  return null;
                })()}

                {isExportingZip ? (
                  <div className="flex flex-col gap-1 py-1">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-[10px] text-zinc-400 font-mono font-black">Exportando...</span>
                    </div>
                    <span className="text-[9px] text-zinc-500 font-mono truncate">{exportZipProgress}</span>
                  </div>
                ) : (
                  <button
                    onClick={handleExportZip}
                    className="w-full py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-zinc-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md shadow-emerald-500/10"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar Pasta ZIP</span>
                  </button>
                )}
              </div>
            </div>

            {/* Option C: Clickable Social Media Cover Card & Sharing Methods */}
            {shareUrl && (
              <div className="bg-zinc-950 border border-amber-500/40 rounded-2xl p-4 space-y-3 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-black text-amber-400 font-mono uppercase tracking-wider">
                    <Share2 className="w-4 h-4 text-amber-400" />
                    <span>Card de Capa & Compartilhamento na Nuvem</span>
                  </div>
                  <span className="text-[9px] bg-amber-500/20 text-amber-300 font-mono font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                    Siga La Pelota Cloud
                  </span>
                </div>

                {/* Clickable Social Share Card Banner - Preview */}
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 border-2 border-amber-500/60 hover:border-amber-400 rounded-xl p-4 transition transform hover:scale-[1.01] active:scale-[0.99] shadow-2xl relative group overflow-hidden no-underline cursor-pointer"
                  title="Clique em qualquer lugar do card para testar a abertura da revista!"
                >
                  <div className="absolute top-2 right-2 bg-amber-500 text-zinc-950 text-[9px] font-black font-mono px-2 py-0.5 rounded-md shadow flex items-center gap-1 z-10 group-hover:bg-amber-400">
                    <ExternalLink className="w-3 h-3" />
                    <span>Abrir Revista ➔</span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 items-center">
                    {/* Cover Thumbnail */}
                    {coverImageUrl && (
                      <div className="w-28 h-36 shrink-0 bg-zinc-950 border border-amber-500/40 rounded-lg overflow-hidden shadow-lg relative">
                        <img src={coverImageUrl} alt={magazine.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition" />
                      </div>
                    )}

                    {/* Details */}
                    <div className="flex-1 space-y-2 text-center sm:text-left">
                      <span className="text-[9px] font-mono font-black text-amber-500 uppercase tracking-widest block">
                        ⚽ SIGA LA PELOTA • EDIÇÃO DE COLECIONADOR
                      </span>
                      <h4 className="text-base font-black text-white uppercase font-sans line-clamp-2 leading-tight">
                        {magazine.title}
                      </h4>
                      <p className="text-[12px] text-zinc-300 font-serif italic line-clamp-1">
                        "{magazine.subtitle || magazine.period}"
                      </p>

                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-2 flex items-center justify-between gap-2 mt-2">
                        <span className="text-[11px] text-amber-300 font-mono font-bold truncate">
                          🔗 {shareUrl}
                        </span>
                        <span className="text-[10px] font-black text-amber-950 bg-amber-400 px-2.5 py-1 rounded-lg uppercase tracking-wider shrink-0 font-mono shadow">
                          Testar Link ➔
                        </span>
                      </div>
                    </div>
                  </div>
                </a>

                {/* Important Explanation Box */}
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-[11px] text-amber-200 leading-relaxed space-y-2 font-sans">
                  <p className="font-bold text-amber-300 flex items-center gap-1.5">
                    <span>💬 Como enviar no WhatsApp para criar o Card Clicável com Foto:</span>
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-zinc-300">
                    <li>
                      <strong>Por que fotos soltas (PNG) não abrem links no WhatsApp?</strong> Arquivos de imagem enviados como anexo de foto são tratados pelo WhatsApp como fotografias estáticas (apenas para zoom). O WhatsApp não aceita links clicáveis dentro dos pixels de um arquivo PNG.
                    </li>
                    <li>
                      <strong>Como o WhatsApp gera o Card Clicável da Capa:</strong> Clique no botão verde <strong className="text-emerald-400">"🟢 Compartilhar no WhatsApp"</strong> abaixo. O WhatsApp lerá o link e gerará <strong>automaticamente o Card Clicável com a Foto da Capa</strong> na conversa! Quem tocar no card dentro do chat abrirá a revista na nuvem na hora!
                    </li>
                  </ul>
                </div>

                {/* Share Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`⚽ Confira a edição especial "${magazine.title}" da revista Siga La Pelota:\n\n${shareUrl}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 min-w-[200px] py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>🟢 Compartilhar no WhatsApp (Gera Card)</span>
                  </a>

                  {navigator.share && (
                    <button
                      onClick={async () => {
                        try {
                          await navigator.share({
                            title: `⚽ Revista Siga La Pelota - ${magazine.title}`,
                            text: `Confira a edição especial de colecionador "${magazine.title}"!`,
                            url: shareUrl,
                          });
                        } catch (e) {
                          console.log("Share canceled or failed", e);
                        }
                      }}
                      className="py-2.5 px-3 bg-zinc-800 hover:bg-zinc-700 text-amber-400 font-black rounded-xl text-xs transition flex items-center justify-center gap-1.5 border border-amber-500/40 cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Menu Nativo do Celular</span>
                    </button>
                  )}

                  <button
                    onClick={() => downloadSocialShareCard(shareUrl)}
                    className="py-2.5 px-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-zinc-950 font-black rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/10 cursor-pointer"
                    title="Baixa a imagem em HD para divulgar (Sem QR Code)"
                  >
                    <Download className="w-4 h-4" />
                    <span>Baixar Banner HD (PNG)</span>
                  </button>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(shareUrl);
                      alert("Link da revista copiado para a área de transferência!");
                    }}
                    className="py-2.5 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 border border-zinc-700 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5 text-amber-400" />
                    <span>Copiar Link</span>
                  </button>
                </div>
              </div>
            )}

            <div className="bg-zinc-950/40 border border-zinc-850 rounded-xl p-3 text-[10px] text-zinc-400 leading-relaxed space-y-1">
              <p>📌 <strong>Como colocar no GitHub Pages de graça?</strong></p>
              <ol className="list-decimal pl-4 space-y-0.5">
                <li>Baixe o arquivo ZIP acima e extraia o conteúdo em seu computador.</li>
                <li>Crie um repositório público no GitHub (ex: <i>minha-revista-fc</i>).</li>
                <li>Envie a pasta extraída (que contém o <b>index.html</b> e a pasta <b>assets</b>) para lá.</li>
                <li>Nas configurações do seu repositório, ative o <b>GitHub Pages</b> a partir da branch principal.</li>
              </ol>
              <div className="border-t border-zinc-800/60 mt-2 pt-2 text-[9px] text-zinc-500 space-y-1">
                <p>💡 <b>Quer usar os vídeos gigantes no GitHub?</b> Seus vídeos originais são gravações pesadas do navegador. Para subir arquivos maiores que 100MB no GitHub, você deve configurar o <a href="https://git-lfs.com" target="_blank" className="text-emerald-400 hover:underline">Git LFS</a> ou usar um compressor de vídeo gratuito (como <a href="https://handbrake.fr" target="_blank" className="text-emerald-400 hover:underline">HandBrake</a>) para reduzir os arquivos MP4 abaixo de 50MB antes de adicioná-los no Siga La Pelota.</p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-zinc-800">
              <button
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
