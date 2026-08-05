import { useState, useEffect } from "react";
import { CareerSettings, TimelineEntry, Magazine, MagazinePage, JOURNALISTS } from "./types";
import { 
  getSettings, 
  saveSettings, 
  getTimelineEntries, 
  addTimelineEntry, 
  deleteTimelineEntry, 
  getMagazines, 
  saveMagazine, 
  deleteMagazine, 
  clearAllDB,
  setupFirebaseSync,
  getSharedMagazine,
  compressBase64Image
} from "./lib/db";
import SettingsWizard from "./components/SettingsWizard";
import TimelineSection from "./components/TimelineSection";
import MagazineList from "./components/MagazineList";
import MagazineReader from "./components/MagazineReader";
import SigaLaPelotaLogo from "./components/SigaLaPelotaLogo";
import HelpModal from "./components/HelpModal";
import ApiKeyModal from "./components/ApiKeyModal";
import BackupModal from "./components/BackupModal";
import { Trophy, Settings, RefreshCw, Key, Shield, User, Calendar, BookOpen, AlertCircle, Pencil, HelpCircle, Laptop } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Helper to extract a storyboard (sequence of frames) from a video blob or URL on the client-side
function extractVideoStoryboard(blob?: Blob | null, videoUrl?: string | null, frameCount: number = 5): Promise<string[]> {
  return new Promise((resolve) => {
    if (!blob && !videoUrl) {
      resolve([]);
      return;
    }

    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    if (videoUrl && !blob) {
      video.crossOrigin = 'anonymous';
    }
    
    let fileUrl = '';
    if (blob) {
      fileUrl = URL.createObjectURL(blob);
      video.src = fileUrl;
    } else if (videoUrl) {
      video.src = videoUrl;
    }
    
    const frames: string[] = [];
    
    const cleanup = () => {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }
      video.remove();
    };

    const timeoutId = setTimeout(() => {
      cleanup();
      resolve(frames);
    }, 12000); // 12 seconds max timeout

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

export default function App() {
  const [settings, setSettings] = useState<CareerSettings | null>(null);
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [magazines, setMagazines] = useState<Magazine[]>([]);
  const [activeMagazine, setActiveMagazine] = useState<Magazine | null>(null);
  const [activeTab, setActiveTab] = useState<"timeline" | "magazines">("timeline");
  const [isLoaded, setIsLoaded] = useState(false);
  const [showEditSettingsModal, setShowEditSettingsModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"connecting" | "connected" | "offline">("connecting");
  const [syncedCount, setSyncedCount] = useState(0);
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Shared view states
  const [sharedMagazine, setSharedMagazine] = useState<Magazine | null>(null);
  const [isViewingShared, setIsViewingShared] = useState(false);
  const [loadingShared, setLoadingShared] = useState(false);

  // Custom visual Toast notification state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
  };

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Load persistent DB data on component mount
  useEffect(() => {
    async function loadData() {
      try {
        const params = new URLSearchParams(window.location.search);
        const sharedMagId = params.get("shared_mag");

        if (sharedMagId) {
          setLoadingShared(true);
          setIsViewingShared(true);
          try {
            const mag = await getSharedMagazine(sharedMagId);
            if (mag) {
              setSharedMagazine(mag);
            } else {
              showToast("Revista compartilhada não encontrada.", "error");
              setIsViewingShared(false);
            }
          } catch (err: any) {
            console.error("Erro ao carregar revista compartilhada:", err);
            showToast("Erro ao carregar revista compartilhada.", "error");
            setIsViewingShared(false);
          } finally {
            setLoadingShared(false);
            setIsLoaded(true);
          }
          return;
        }

        // Run initial background sync with Firebase Firestore
        const syncResult = await setupFirebaseSync();
        setSyncStatus(syncResult.status);
        setSyncedCount(syncResult.syncedItemsCount);

        const storedSettings = await getSettings();
        const storedEntries = await getTimelineEntries();
        const storedMagazines = await getMagazines();
        
        // Dynamically recreate object URLs for persistent binary video blobs
        const processedEntries = storedEntries.map(entry => {
          if (entry.videoBlob) {
            try {
              return {
                ...entry,
                videoUrl: URL.createObjectURL(entry.videoBlob),
                mediaType: entry.mediaType || 'video'
              };
            } catch (err) {
              console.error("Erro ao recriar URL do blob de vídeo:", err);
            }
          }
          return entry;
        });

        if (storedSettings) setSettings(storedSettings);
        setEntries(processedEntries);
        setMagazines(storedMagazines);
      } catch (err) {
        console.error("Erro ao ler banco de dados local ou sincronizar:", err);
        setSyncStatus("offline");
      } finally {
        setIsLoaded(true);
      }
    }
    loadData();
  }, []);

  const handleReloadData = async () => {
    try {
      const storedSettings = await getSettings();
      const storedEntries = await getTimelineEntries();
      const storedMagazines = await getMagazines();
      
      const processedEntries = storedEntries.map(entry => {
        if (entry.videoBlob) {
          try {
            return {
              ...entry,
              videoUrl: URL.createObjectURL(entry.videoBlob),
              mediaType: entry.mediaType || 'video'
            };
          } catch (err) {
            console.error("Erro ao recriar URL do blob de vídeo:", err);
          }
        }
        return entry;
      });

      setSettings(storedSettings);
      setEntries(processedEntries);
      setMagazines(storedMagazines);
    } catch (err) {
      console.error("Erro ao recarregar dados do banco de dados:", err);
    }
  };

  const handleSaveSettings = async (newSettings: CareerSettings) => {
    try {
      await saveSettings(newSettings);
      setSettings(newSettings);
      setShowEditSettingsModal(false);
      showToast("Configurações salvas com sucesso!", "success");
    } catch (err) {
      showToast("Erro ao salvar configurações da carreira.", "error");
    }
  };

  const handleSaveApiKey = async (
    provider: 'gemini' | 'openai' | 'anthropic',
    geminiKey: string,
    openaiKey: string,
    anthropicKey: string
  ) => {
    if (!settings) return;
    const updatedSettings: CareerSettings = {
      ...settings,
      aiProvider: provider,
      customApiKey: geminiKey || undefined,
      openaiApiKey: openaiKey || undefined,
      anthropicApiKey: anthropicKey || undefined
    };
    try {
      await saveSettings(updatedSettings);
      setSettings(updatedSettings);
      setShowApiKeyModal(false);
      showToast("Configurações de IA e chaves atualizadas!", "success");
    } catch (err) {
      showToast("Erro ao atualizar as chaves de IA.", "error");
    }
  };

  const handleQuickChangeJournalist = async (newId: string) => {
    if (!settings) return;
    const updatedSettings: CareerSettings = {
      ...settings,
      journalistId: newId
    };
    try {
      await saveSettings(updatedSettings);
      setSettings(updatedSettings);
      showToast("Cronista de destaque alterado!", "success");
    } catch (err) {
      showToast("Erro ao alterar o cronista de destaque.", "error");
    }
  };

  const handleAddEntry = async (entry: TimelineEntry) => {
    try {
      await addTimelineEntry(entry);
      setEntries(prev => [entry, ...prev]);
      showToast("Fato adicionado com sucesso!", "success");
    } catch (err: any) {
      console.error("Erro detalhado ao adicionar destaque:", err);
      showToast("Erro ao salvar o destaque: " + (err.message || err), "error");
    }
  };

  const handleDeleteEntry = (id: string) => {
    setConfirmState({
      isOpen: true,
      title: "Excluir Registro da Linha do Tempo",
      message: "Tem certeza de que deseja apagar permanentemente este fato do seu diário de carreira? Esta ação é irreversível.",
      onConfirm: async () => {
        try {
          await deleteTimelineEntry(id);
          setEntries(prev => prev.filter(e => e.id !== id));
          showToast("Fato excluído da linha do tempo.", "success");
        } catch (err) {
          showToast("Erro ao excluir destaque.", "error");
        }
      }
    });
  };

  const handleBulkAdd = async (newEntries: TimelineEntry[]) => {
    try {
      for (const entry of newEntries) {
        await addTimelineEntry(entry);
      }
      setEntries(prev => [...newEntries, ...prev]);
      showToast("Fatos de exemplo carregados com sucesso!", "success");
    } catch (err) {
      showToast("Erro ao importar destaques de exemplo.", "error");
    }
  };

  const handleUpdateEntries = async (updatedEntries: TimelineEntry[]) => {
    try {
      for (const entry of updatedEntries) {
        await addTimelineEntry(entry);
      }
      setEntries(updatedEntries);
      showToast("Ordem dos posts atualizada e salva!", "success");
    } catch (err: any) {
      console.error("Erro detalhado ao atualizar registros:", err);
      showToast("Erro ao atualizar os registros: " + (err.message || err), "error");
    }
  };

  const handleGenerateMagazine = async (period: string, filteredEntries: TimelineEntry[], coverImageUrl?: string, season?: string) => {
    if (!settings) return;

    const targetSeason = season || settings.season || "2024/2025";
    const effectiveSettings = {
      ...settings,
      season: targetSeason
    };

    // Prepare entries list for API payload with compressed images for lightweight HTTP transmission
    const entriesPayload = await Promise.all(filteredEntries.map(async (e) => {
      let videoFrames: string[] = [];
      if (e.videoBlob || e.videoUrl) {
        try {
          // Limit to max 2 video frames per entry for AI analysis to keep payload light
          videoFrames = await extractVideoStoryboard(e.videoBlob, e.videoUrl, 2);
        } catch (err) {
          console.warn("Could not extract storyboard from video for API payload:", err);
        }
      }

      // Compress main media image if base64
      let compressedMediaBase64: string | null = null;
      if (e.mediaUrl) {
        if (e.mediaUrl.startsWith("data:image/")) {
          compressedMediaBase64 = await compressBase64Image(e.mediaUrl, 480, 0.35);
        } else {
          compressedMediaBase64 = e.mediaUrl;
        }
      }

      // Compress gallery images if present (max 2 images per gallery in payload)
      let compressedGalleryUrls: string[] | null = null;
      if (e.galleryUrls && e.galleryUrls.length > 0) {
        const slicedGallery = e.galleryUrls.slice(0, 2);
        compressedGalleryUrls = await Promise.all(
          slicedGallery.map(async (gUrl) => {
            if (gUrl.startsWith("data:image/")) {
              return await compressBase64Image(gUrl, 480, 0.35);
            }
            return gUrl;
          })
        );
      }

      // Avoid duplicating mediaBase64 if it's already identical to galleryUrls[0]
      if (compressedMediaBase64 && compressedGalleryUrls && compressedGalleryUrls.length > 0 && compressedMediaBase64 === compressedGalleryUrls[0]) {
        compressedMediaBase64 = null;
      }

      return {
        id: e.id,
        title: e.title,
        description: e.description,
        month: e.month,
        season: e.season || targetSeason,
        type: e.type,
        mediaType: e.mediaType || 'image',
        mediaBase64: compressedMediaBase64,
        galleryUrls: compressedGalleryUrls,
        htmlCode: e.htmlCode || null,
        videoFrames: videoFrames
      };
    }));

    const apiBaseUrl = (import.meta as any).env?.VITE_API_URL || "";
    const response = await fetch(`${apiBaseUrl}/api/gemini/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-ai-provider": settings.aiProvider || "gemini",
        "x-gemini-key": settings.customApiKey || "",
        "x-openai-key": settings.openaiApiKey || "",
        "x-anthropic-key": settings.anthropicApiKey || ""
      },
      body: JSON.stringify({
        journalistId: settings.journalistId,
        settings: effectiveSettings,
        period,
        season: targetSeason,
        entries: entriesPayload
      })
    });

    if (!response.ok) {
      let errorMessage = `Erro do servidor (Código ${response.status})`;
      try {
        const text = await response.text();
        if (text.trim().startsWith("{")) {
          const parsed = JSON.parse(text);
          errorMessage = parsed.error || errorMessage;
        } else {
          if (text.includes("Payload Too Large") || response.status === 413) {
            errorMessage = "Erro: Os arquivos de imagem ou vídeo enviados são muito grandes para processamento! Tente remover ou diminuir o tamanho das mídias anexadas na sua linha do tempo antes de gerar a revista.";
          } else {
            errorMessage = `O servidor retornou uma resposta inesperada (Código ${response.status}). Por favor, tente novamente.`;
          }
        }
      } catch (e) {
        // fallback
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();

    // Map generated pages to associate galleryUrls, htmlCode, or mediaType from suggested entry
    const pagesWithAssociatedMedia = (data.pages || []).map((page: MagazinePage) => {
      let matchedEntry = filteredEntries.find(e => e.id === page.suggestedEntryId);
      if (!matchedEntry && page.pageNumber <= filteredEntries.length) {
        matchedEntry = filteredEntries[page.pageNumber - 1];
      }

      if (matchedEntry) {
        return {
          ...page,
          mediaType: matchedEntry.mediaType || page.mediaType || 'image',
          mediaUrl: page.mediaUrl || matchedEntry.mediaUrl || undefined,
          galleryUrls: matchedEntry.galleryUrls || page.galleryUrls || undefined,
          htmlCode: matchedEntry.htmlCode || page.htmlCode || undefined,
          videoUrl: matchedEntry.videoUrl || page.videoUrl || undefined,
          videoStartTime: matchedEntry.videoStartTime,
          videoEndTime: matchedEntry.videoEndTime,
        };
      }
      return page;
    });

    // Create and save a new magazine structure locally
    const newMagazine: Magazine = {
      id: "mag_" + Date.now(),
      title: data.magazineTitle,
      subtitle: data.magazineSubtitle,
      editorialText: data.editorialText,
      journalistId: settings.journalistId,
      period: period,
      season: targetSeason,
      pages: pagesWithAssociatedMedia,
      createdAt: Date.now(),
      coverImageUrl: coverImageUrl || undefined
    };

    await saveMagazine(newMagazine);
    setMagazines(prev => [newMagazine, ...prev]);
    setActiveMagazine(newMagazine); // Open reader right away
  };

  const handleDeleteMagazine = (id: string) => {
    setConfirmState({
      isOpen: true,
      title: "Excluir Revista Digital",
      message: "Deseja realmente excluir esta revista digital permanentemente? Esta edição será perdida de forma definitiva.",
      onConfirm: async () => {
        try {
          await deleteMagazine(id);
          setMagazines(prev => prev.filter(m => m.id !== id));
          if (activeMagazine?.id === id) {
            setActiveMagazine(null);
          }
          showToast("Revista digital excluída com sucesso.", "success");
        } catch (err) {
          showToast("Erro ao excluir revista.", "error");
        }
      }
    });
  };

  const handleUpdateMagazine = async (updated: Magazine) => {
    try {
      await saveMagazine(updated);
      setMagazines(prev => prev.map(m => m.id === updated.id ? updated : m));
      setActiveMagazine(updated);
      showToast("Revista atualizada com sucesso!", "success");
    } catch (err) {
      showToast("Erro ao salvar atualizações da revista.", "error");
    }
  };

  const handleResetCareer = () => {
    setConfirmState({
      isOpen: true,
      title: "REINICIAR TODO O MODO CARREIRA?",
      message: "ATENÇÃO: Você deseja apagar todas as informações, configurações e revistas digitais geradas permanentemente? Esta operação é destrutiva e não pode ser desfeita.",
      onConfirm: async () => {
        try {
          await clearAllDB();
          setSettings(null);
          setEntries([]);
          setMagazines([]);
          setActiveMagazine(null);
          showToast("Modo carreira reiniciado com sucesso.", "success");
        } catch (err) {
          showToast("Erro ao reiniciar a carreira.", "error");
        }
      }
    });
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h3 className="text-sm font-semibold font-mono text-zinc-600 uppercase tracking-widest">Carregando Banco de Dados...</h3>
      </div>
    );
  }

  if (loadingShared) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h3 className="text-sm font-semibold font-mono text-zinc-600 uppercase tracking-widest animate-pulse">Carregando Revista Compartilhada...</h3>
        <p className="text-xs text-zinc-500 mt-2 font-mono">Buscando edições e mídias da nuvem...</p>
      </div>
    );
  }

  if (isViewingShared) {
    if (sharedMagazine) {
      return (
        <div className="min-h-screen bg-[#FAF6F0] text-zinc-900 pb-16 print:bg-transparent print:pb-0">
          <div className="min-h-screen bg-zinc-950/40 py-8 backdrop-blur-md">
            <MagazineReader 
              magazine={sharedMagazine} 
              timelineEntries={[]} 
              onBackToList={() => window.location.href = window.location.origin} 
              onUpdateMagazine={() => {}} 
              settings={{
                characterName: "",
                careerType: 'player',
                teamName: "",
                season: "1",
                journalistId: sharedMagazine.journalistId
              }}
              isSharedView={true}
            />
          </div>
          
          {/* Custom Toast notifications */}
          {toast && (
            <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-zinc-900 border border-zinc-800 text-white px-5 py-3.5 rounded-2xl shadow-2xl max-w-sm animate-fade-in print:hidden">
              <span className="text-sm font-medium">{toast.message}</span>
            </div>
          )}
        </div>
      );
    } else {
      return (
        <div className="min-h-screen bg-[#FAF6F0] flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="p-4 bg-red-100 text-red-600 rounded-full border border-red-200">
            <AlertCircle className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-zinc-800">Revista Não Encontrada</h2>
          <p className="text-sm text-zinc-500 max-w-sm">O link de compartilhamento pode estar incorreto, expirado ou o criador excluiu esta publicação.</p>
          <button
            onClick={() => window.location.href = window.location.origin}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs transition duration-200 flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/10 cursor-pointer"
          >
            <span>Ir para o Início</span>
          </button>
        </div>
      );
    }
  }

  // If no career configured, show Wizard setup
  if (!settings) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] py-12">
        <SettingsWizard onSave={handleSaveSettings} />
      </div>
    );
  }

  const activeJournalist = JOURNALISTS.find((j) => j.id === settings.journalistId) || JOURNALISTS[0];

  return (
    <div className="min-h-screen bg-[#FAF6F0] text-zinc-900 pb-16 print:bg-transparent print:pb-0">
      {/* Immersive Reader Overlay Mode */}
      {activeMagazine ? (
        <div className="min-h-screen bg-zinc-950/40 py-8 backdrop-blur-md">
          <MagazineReader 
            magazine={activeMagazine} 
            timelineEntries={entries} 
            onBackToList={() => setActiveMagazine(null)} 
            onUpdateMagazine={handleUpdateMagazine}
            settings={settings}
          />
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pt-6">
          {/* Main Newspaper Style Header */}
          <header className="bg-white rounded-3xl border border-zinc-200/80 shadow-md p-6 relative overflow-hidden">
            <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
              {/* Left/Top Group: Metadata + Columnist */}
              <div className="flex flex-col md:flex-row md:items-center gap-6 xl:flex-1 w-full xl:w-auto">
                {/* Career Metadata Block */}
                <div className="flex flex-wrap items-center gap-4 shrink-0">
                  <SigaLaPelotaLogo className="w-14 h-14" showFrame={true} />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono font-bold bg-amber-500/10 border border-amber-500/20 text-amber-700 px-2 py-0.5 rounded-full uppercase">
                        TEMPORADA {settings.season}
                      </span>
                      <span className="text-xs text-zinc-300">•</span>
                      <span className="text-xs text-zinc-500 font-mono">
                        {settings.careerType === 'player' ? "🏃 JOGADOR" : "👔 TREINADOR"}
                      </span>
                      <span className="text-xs text-zinc-300">•</span>
                      {syncStatus === "connected" ? (
                        <span className="text-[10px] font-mono font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 px-2 py-0.5 rounded-full uppercase flex items-center gap-1" title={syncedCount > 0 ? `Sincronizados ${syncedCount} itens com o Firestore` : "Nuvem em sincronia real"}>
                          ☁️ CLOUD ACTIVE
                        </span>
                      ) : syncStatus === "offline" ? (
                        <span className="text-[10px] font-mono font-bold bg-zinc-500/10 border border-zinc-500/20 text-zinc-600 px-2 py-0.5 rounded-full uppercase">
                          ⚠️ LOCAL ONLY
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-bold bg-blue-500/10 border border-blue-500/20 text-blue-600 px-2 py-0.5 rounded-full uppercase animate-pulse">
                          🔄 SYNCING...
                        </span>
                      )}
                    </div>
                    <h1 className="text-2xl font-black font-sans text-zinc-950 tracking-tight flex items-center gap-1.5 mt-1">
                      {settings.characterName} <span className="text-zinc-400 font-normal">no</span> {settings.teamName}
                    </h1>
                  </div>
                </div>

                {/* Columnist info Card */}
                <div className="flex items-center gap-3 bg-zinc-50 border border-zinc-200/60 p-2.5 rounded-2xl w-full md:max-w-xs relative group shrink-0">
                  <span className="text-3xl p-1.5 bg-white border border-zinc-100 rounded-xl shadow-sm">{activeJournalist.avatar}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] font-mono text-zinc-400 block uppercase leading-none mb-1">CRONISTA DA CARREIRA</span>
                    <div className="relative">
                      <select
                        value={settings.journalistId}
                        onChange={(e) => handleQuickChangeJournalist(e.target.value)}
                        className="text-xs font-bold text-zinc-900 bg-transparent border-none pr-5 pl-0 py-0 outline-none focus:ring-0 cursor-pointer hover:text-amber-600 transition block w-full truncate leading-tight font-sans appearance-none"
                      >
                        {JOURNALISTS.map((j) => (
                          <option key={j.id} value={j.id} className="text-zinc-900 font-medium">
                            {j.name}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1 text-zinc-400 group-hover:text-amber-500 transition">
                        <Pencil className="w-3 h-3" />
                      </div>
                    </div>
                    <span className="text-[9px] text-zinc-500 italic mt-0.5 block leading-none truncate max-w-[150px]" title={activeJournalist.catchphrase}>
                      "{activeJournalist.catchphrase.substring(0, 30)}..."
                    </span>
                  </div>
                </div>
              </div>

              {/* Config Actions */}
              <div className="flex flex-wrap items-center gap-2 justify-start xl:justify-end shrink-0 w-full xl:w-auto">
                <button
                  onClick={() => setShowHelpModal(true)}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold text-xs shadow-md shadow-amber-500/10 hover:shadow-amber-500/20 transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                  title="Tutorial & Manual de Ajuda"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>Como Usar?</span>
                </button>
                <button
                  onClick={() => setShowBackupModal(true)}
                  className="px-4 py-2.5 bg-zinc-100 border border-zinc-200 text-zinc-700 hover:bg-zinc-200 rounded-2xl font-bold text-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                  title="Transferir Carreira para outro Computador"
                >
                  <Laptop className="w-4 h-4 text-zinc-600" />
                  <span>Transferir Carreira 🔄</span>
                </button>
                <button
                  onClick={() => setShowApiKeyModal(true)}
                  className="px-4 py-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-700 hover:bg-amber-500/20 rounded-2xl font-bold text-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                  title="Configurar Chave de API do Gemini"
                >
                  <Key className="w-4 h-4 text-amber-600" />
                  <span>Chave de API 🔑</span>
                </button>
                <button
                  onClick={() => setShowEditSettingsModal(true)}
                  className="p-3 border border-zinc-200 hover:bg-zinc-50 text-zinc-600 rounded-2xl transition shrink-0 cursor-pointer bg-white shadow-sm"
                  title="Configurações da Carreira"
                >
                  <Settings className="w-5 h-5" />
                </button>
                <button
                  onClick={handleResetCareer}
                  className="p-3 border border-zinc-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100 text-zinc-600 rounded-2xl transition shrink-0 cursor-pointer bg-white shadow-sm"
                  title="Reiniciar Modo Carreira"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            </div>
          </header>

          {/* Tab Selector */}
          <div className="flex justify-center mb-8">
            <div className="bg-zinc-100 p-1.5 rounded-2xl flex gap-1.5 border border-zinc-200/60 shadow-inner">
              <button
                type="button"
                onClick={() => setActiveTab("timeline")}
                className="px-6 py-3 rounded-xl font-bold text-xs tracking-wider uppercase transition flex items-center gap-2 relative outline-none focus:outline-none"
              >
                {activeTab === "timeline" && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 bg-white rounded-xl shadow-sm border border-zinc-200/50"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className={`relative z-10 flex items-center gap-2 font-black ${activeTab === "timeline" ? "text-zinc-950" : "text-zinc-500 hover:text-zinc-800"}`}>
                  📁 Arquivo de Fatos
                  <span className={`px-2 py-0.5 text-[10px] font-mono rounded-full font-bold ${
                    activeTab === "timeline" ? "bg-amber-100 text-amber-800" : "bg-zinc-200 text-zinc-600"
                  }`}>
                    {entries.length}
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("magazines")}
                className="px-6 py-3 rounded-xl font-bold text-xs tracking-wider uppercase transition flex items-center gap-2 relative outline-none focus:outline-none"
              >
                {activeTab === "magazines" && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 bg-white rounded-xl shadow-sm border border-zinc-200/50"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className={`relative z-10 flex items-center gap-2 font-black ${activeTab === "magazines" ? "text-zinc-950" : "text-zinc-500 hover:text-zinc-800"}`}>
                  📖 Edição de Crônicas & Revistas
                  <span className={`px-2 py-0.5 text-[10px] font-mono rounded-full font-bold ${
                    activeTab === "magazines" ? "bg-amber-100 text-amber-800" : "bg-zinc-200 text-zinc-600"
                  }`}>
                    {magazines.length}
                  </span>
                </span>
              </button>
            </div>
          </div>

          {/* Tab content area */}
          <main className="w-full">
            <AnimatePresence mode="wait">
              {activeTab === "timeline" ? (
                <motion.section
                  key="timeline"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-6 bg-white rounded-3xl border border-zinc-200/80 p-6 md:p-8 shadow-sm w-full"
                >
                  <div className="border-b border-zinc-100 pb-4">
                    <h2 className="text-xl font-black text-zinc-950 flex items-center gap-1.5">
                      📁 Arquivo de Fatos
                    </h2>
                    <p className="text-xs text-zinc-500 mt-1">Registre as partidas e eventos da sua jornada no EA FC neste diário de bordo permanente.</p>
                  </div>
                  <TimelineSection 
                    entries={entries} 
                    settings={settings}
                    onAddEntry={handleAddEntry} 
                    onDeleteEntry={handleDeleteEntry}
                    onBulkAdd={handleBulkAdd}
                    onUpdateEntries={handleUpdateEntries}
                  />
                </motion.section>
              ) : (
                <motion.section
                  key="magazines"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-6 bg-white rounded-3xl border border-zinc-200/80 p-6 md:p-8 shadow-sm w-full"
                >
                  <div className="border-b border-zinc-100 pb-4 mb-6">
                    <h2 className="text-xl font-black text-zinc-950 flex items-center gap-1.5">
                      📖 Edição de Crônicas
                    </h2>
                    <p className="text-xs text-zinc-500 mt-1">Gere revistas sob demanda baseadas no seu arquivo de fatos.</p>
                  </div>
                  <MagazineList 
                    magazines={magazines} 
                    timelineEntries={entries} 
                    settings={settings}
                    onGenerate={handleGenerateMagazine} 
                    onDeleteMagazine={handleDeleteMagazine} 
                    onSelectMagazine={(mag) => setActiveMagazine(mag)} 
                    onChangeJournalist={handleQuickChangeJournalist}
                  />
                </motion.section>
              )}
            </AnimatePresence>
          </main>
        </div>
      )}

      {/* Edit Settings Modal */}
      <AnimatePresence>
        {showEditSettingsModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-zinc-200 shadow-2xl relative"
            >
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={() => setShowEditSettingsModal(false)}
                  className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-xl text-xs font-semibold transition"
                >
                  Fechar
                </button>
              </div>
              <SettingsWizard 
                initialSettings={settings} 
                onSave={handleSaveSettings} 
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dedicated API Key Modal */}
      <AnimatePresence>
        {showApiKeyModal && (
          <ApiKeyModal
            isOpen={showApiKeyModal}
            onClose={() => setShowApiKeyModal(false)}
            currentSettings={settings}
            onSave={handleSaveApiKey}
          />
        )}
      </AnimatePresence>

      {/* Backup and Restore Transfer Modal */}
      <AnimatePresence>
        {showBackupModal && (
          <BackupModal
            isOpen={showBackupModal}
            onClose={() => setShowBackupModal(false)}
            onSuccessToast={(msg) => showToast(msg, "success")}
            onReload={handleReloadData}
          />
        )}
      </AnimatePresence>

      {/* Help Instructions Modal */}
      <AnimatePresence>
        {showHelpModal && (
          <HelpModal 
            isOpen={showHelpModal} 
            onClose={() => setShowHelpModal(false)} 
            activeJournalistName={activeJournalist?.name}
          />
        )}
      </AnimatePresence>

      {/* Custom Confirmation Modal */}
      <AnimatePresence>
        {confirmState && (
          <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full border border-zinc-200 shadow-2xl space-y-4"
            >
              <div className="flex items-start gap-3">
                <div className="p-3 bg-red-100 text-red-600 rounded-2xl shrink-0">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-zinc-950 text-base">
                    {confirmState.title}
                  </h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    {confirmState.message}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-4">
                <button
                  type="button"
                  onClick={() => setConfirmState(null)}
                  className="px-4 py-2 border border-zinc-200 hover:bg-zinc-50 rounded-xl text-xs font-semibold text-zinc-600 transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    confirmState.onConfirm();
                    setConfirmState(null);
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-sm shadow-red-600/10"
                >
                  Confirmar Exclusão
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Elegant Native Toast Notifications */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-[120] max-w-sm w-full bg-zinc-950 border border-zinc-800 text-white rounded-2xl p-4 shadow-2xl flex items-center gap-3"
          >
            <div className={`p-2 rounded-xl text-sm shrink-0 ${
              toast.type === "success" ? "bg-emerald-500/10 text-emerald-400" :
              toast.type === "error" ? "bg-rose-500/10 text-rose-400" : "bg-blue-500/10 text-blue-400"
            }`}>
              {toast.type === "success" && <span className="text-sm font-bold">✓</span>}
              {toast.type === "error" && <span className="text-sm font-bold">⚠️</span>}
              {toast.type === "info" && <span className="text-sm font-bold">ℹ</span>}
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-zinc-200 leading-tight">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-zinc-500 hover:text-zinc-300 text-xs px-1"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
