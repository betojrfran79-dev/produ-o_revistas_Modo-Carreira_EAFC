import { useState, useEffect, useRef } from "react";
import { Magazine, TimelineEntry, CareerSettings, JOURNALISTS, MONTHS } from "../types";
import { BookOpen, Sparkles, Trash2, Calendar, FileText, LayoutGrid, Clock, Loader2, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface MagazineListProps {
  magazines: Magazine[];
  timelineEntries: TimelineEntry[];
  settings: CareerSettings;
  onGenerate: (period: string, entries: TimelineEntry[], coverImageUrl?: string, season?: string) => Promise<void>;
  onDeleteMagazine: (id: string) => void;
  onSelectMagazine: (magazine: Magazine) => void;
  onChangeJournalist?: (journalistId: string) => void;
}

const PERIOD_OPTIONS = [
  { value: "Mensal - Janeiro", label: "Mensal - Janeiro (Pré-temporada)", months: ["Janeiro (Pré-temporada)"] },
  { value: "Mensal - Fevereiro", label: "Mensal - Fevereiro", months: ["Fevereiro"] },
  { value: "Mensal - Março", label: "Mensal - Março", months: ["Março"] },
  { value: "Mensal - Abril", label: "Mensal - Abril (Início do Ano)", months: ["Abril (Início de Temporada)"] },
  { value: "Mensal - Maio", label: "Mensal - Maio", months: ["Maio"] },
  { value: "Mensal - Junho", label: "Mensal - Junho", months: ["Junho"] },
  { value: "Mensal - Julho", label: "Mensal - Julho (Janela de Transferências)", months: ["Julho (Janela do Meio do Ano)"] },
  { value: "Mensal - Agosto", label: "Mensal - Agosto", months: ["Agosto"] },
  { value: "Mensal - Setembro", label: "Mensal - Setembro", months: ["Setembro"] },
  { value: "Mensal - Outubro", label: "Mensal - Outubro", months: ["Outubro"] },
  { value: "Mensal - Novembro", label: "Mensal - Novembro (Finais)", months: ["Novembro (Finais de Temporada)"] },
  { value: "Mensal - Dezembro", label: "Mensal - Dezembro (Férias)", months: ["Dezembro (Férias/Pós-temporada)"] },
  
  { value: "Bimestral - Jan a Fev", label: "Bimestral (Janeiro - Fevereiro)", months: ["Janeiro (Pré-temporada)", "Fevereiro"] },
  { value: "Bimestral - Mar a Abr", label: "Bimestral (Março - Abril)", months: ["Março", "Abril (Início de Temporada)"] },
  { value: "Bimestral - Mai a Jun", label: "Bimestral (Maio - Junho)", months: ["Maio", "Junho"] },
  { value: "Bimestral - Jul a Ago", label: "Bimestral (Julho - Agosto)", months: ["Julho (Janela do Meio do Ano)", "Agosto"] },
  { value: "Bimestral - Set a Out", label: "Bimestral (Setembro - Outubro)", months: ["Setembro", "Outubro"] },
  { value: "Bimestral - Nov a Dez", label: "Bimestral (Novembro - Dezembro)", months: ["Novembro (Finais de Temporada)", "Dezembro (Férias/Pós-temporada)"] },

  { value: "Trimestral - Jan a Mar", label: "Trimestral (Janeiro - Março)", months: ["Janeiro (Pré-temporada)", "Fevereiro", "Março"] },
  { value: "Trimestral - Apr a Jun", label: "Trimestral (Abril - Junho)", months: ["Abril (Início de Temporada)", "Maio", "Junho"] },
  { value: "Trimestral - Jul a Set", label: "Trimestral (Julho - Setembro)", months: ["Julho (Janela do Meio do Ano)", "Agosto", "Setembro"] },
  { value: "Trimestral - Out a Dez", label: "Trimestral (Outubro - Dezembro)", months: ["Outubro", "Novembro (Finais de Temporada)", "Dezembro (Férias/Pós-temporada)"] },

  { value: "Semestral - Primeiro Turno (Jan - Jun)", label: "Semestral (Janeiro - Junho)", months: ["Janeiro (Pré-temporada)", "Fevereiro", "Março", "Abril (Início de Temporada)", "Maio", "Junho"] },
  { value: "Semestral - Segundo Turno (Jul - Dez)", label: "Semestral (Julho - Dezembro)", months: ["Julho (Janela do Meio do Ano)", "Agosto", "Setembro", "Outubro", "Novembro (Finais de Temporada)", "Dezembro (Férias/Pós-temporada)"] },

  // OBRIGATÓRIA: Revista Anual
  { 
    value: "Anual - Temporada Completa", 
    label: "👑 Revista Anual - Temporada Completa (OBRIGATÓRIA)", 
    months: [
      "Janeiro (Pré-temporada)", "Fevereiro", "Março", "Abril (Início de Temporada)", "Maio", "Junho",
      "Julho (Janela do Meio do Ano)", "Agosto", "Setembro", "Outubro", "Novembro (Finais de Temporada)", "Dezembro (Férias/Pós-temporada)"
    ] 
  }
];

// Journalist dynamic loading quotes
const LOADING_QUOTES: Record<string, string[]> = {
  'jorge-iggor': [
    "Jorge Iggor está limpando a garganta para narrar os seus gols...",
    "Ajeitando os microfones para mais uma NOITE MÁGICA de futebol...",
    "Jorge Iggor está buscando as palavras mais heróicas e obstinadas do dicionário...",
    "Reassistindo seus lances com os olhos brilhando de pura emoção..."
  ],
  'pvc': [
    "PVC está folheando as pranchetas táticas de 1974...",
    "PVC está buscando estatísticas obscuras da liga para corroborar seus feitos...",
    "Calculando a média exata de quilômetros percorridos pelo seu personagem...",
    "PVC está abrindo a enciclopédia para ver quem foi o último a fazer o que você fez..."
  ],
  'vsr': [
    "VSR está desenhando as linhas táticas de compactação e amplitude...",
    "VSR está reunindo argumentos lógicos INDISCUTÍVEIS sobre o seu desempenho...",
    "Analisando a flutuação do seu jogador entre as linhas de defesa adversárias...",
    "Montando a tese de convicção absoluta para defender o seu prestígio..."
  ],
  'mauro-cezar': [
    "Mauro Cezar está cortando 100% do oba-oba e oba-oba da imprensa...",
    "Mauro Cezar está afiando a caneta crítica e realista...",
    "Analisando a produtividade da sua posse de bola e consistência das linhas...",
    "Escrevendo uma crônica fria, exigente, séria e cirúrgica..."
  ],
  'rizek': [
    "André Rizek está refletindo sobre a mística da camisa do seu clube...",
    "André Rizek está redigindo uma crônica elegante e literária...",
    "Analisando o peso psicológico do vestiário e as expectativas da torcida...",
    "Preparando aquela introdução reflexiva clássica de domingo..."
  ],
  'beting': [
    "Mauro Beting está escrevendo uma epopeia lírica e romântica...",
    "Mauro Beting está criando trocadilhos geniais com o seu nome...",
    "Nostalgicamente lembrando do futebol romântico de chuteira preta...",
    "Celebrando a bola que se rendeu com doçura à rede adversária..."
  ],
  'galvao': [
    "Galvão Bueno está preparando o coração, amigo!...",
    "Galvão Bueno está arrumando o terno oficial para o grande clássico...",
    "Sussurrando: 'Olha o que ele fez! Olha o que ele fez!'...",
    "Galvão Bueno está perguntando: 'Pode isso, Arnaldo?' para o editorial..."
  ],
  'bruno-formiga': [
    "Bruno Formiga está pegando o recorte exato da amostragem...",
    "Bruno Formiga está analisando o contexto tático além dos números frios...",
    "Montando um debate fervoroso sobre a grandeza desse momento...",
    "Provocando reflexões: 'E aí eu pergunto pra você leitor...'..."
  ],
  'nelson-rodrigues': [
    "Nelson Rodrigues está invocando o Sobrenatural de Almeida...",
    "Espantando o Complexo de Vira-Lata e exaltando a Pátria de Chuteiras...",
    "Nelson Rodrigues está vestindo sua gravata floridíssima para a grande tragédia...",
    "Ignorando os idiotas da objetividade para descrever a alma do futebol..."
  ]
};

export default function MagazineList({
  magazines,
  timelineEntries,
  settings,
  onGenerate,
  onDeleteMagazine,
  onSelectMagazine,
  onChangeJournalist
}: MagazineListProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("Anual - Temporada Completa");
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Available unique seasons across timeline entries, settings, and generated magazines
  const availableSeasons = Array.from(
    new Set([
      ...(settings.season ? [settings.season] : []),
      ...timelineEntries.map(e => e.season || settings.season || "2024/2025"),
      ...magazines.map(m => m.season).filter((s): s is string => Boolean(s))
    ].filter(Boolean))
  ).sort();

  const [selectedSeason, setSelectedSeason] = useState<string>(settings.season || availableSeasons[0] || "2024/2025");
  const [gallerySeasonFilter, setGallerySeasonFilter] = useState<string>("all");

  useEffect(() => {
    if (settings.season) {
      setSelectedSeason(settings.season);
    }
  }, [settings.season]);

  // Cover custom choices
  const [coverSource, setCoverSource] = useState<'default' | 'upload' | 'timeline'>('default');
  const [uploadedCover, setUploadedCover] = useState<string | null>(null);
  const [selectedTimelineCover, setSelectedTimelineCover] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const journalist = JOURNALISTS.find((j) => j.id === settings.journalistId) || JOURNALISTS[0];

  // Rotate loading text
  useEffect(() => {
    if (!isGenerating) return;
    
    const quotes = LOADING_QUOTES[settings.journalistId] || LOADING_QUOTES['pvc'];
    let idx = 0;
    setLoadingText(quotes[0]);

    const interval = setInterval(() => {
      idx = (idx + 1) % quotes.length;
      setLoadingText(quotes[idx]);
    }, 4000);

    return () => clearInterval(interval);
  }, [isGenerating, settings.journalistId]);

  // Filter timeline entries for the selected period AND selected season, sorted chronologically
  const getFilteredEntries = () => {
    const option = PERIOD_OPTIONS.find((p) => p.value === selectedPeriod);
    if (!option) return [];
    
    const filtered = timelineEntries.filter((entry) => {
      const entrySeason = entry.season || settings.season || "2024/2025";
      return entrySeason === selectedSeason && option.months.includes(entry.month);
    });
    
    // Sort chronologically ascending based on MONTHS indices, and order within same month
    return [...filtered].sort((a, b) => {
      const idxA = MONTHS.indexOf(a.month);
      const idxB = MONTHS.indexOf(b.month);
      if (idxA !== idxB) return idxA - idxB;
      
      const orderA = a.sortOrder !== undefined ? a.sortOrder : a.createdAt;
      const orderB = b.sortOrder !== undefined ? b.sortOrder : b.createdAt;
      return orderA - orderB;
    });
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

  const handleFile = (file: File) => {
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedCover(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      alert("Formato de arquivo não suportado. Por favor, envie uma Imagem.");
    }
  };

  const handleGenerateClick = async () => {
    setErrorMsg(null);
    const filtered = getFilteredEntries();

    if (filtered.length === 0) {
      alert(`Impossível gerar a revista! Nenhum destaque ou registro foi encontrado para o período "${selectedPeriod}" na Temporada "${selectedSeason}". Por favor, verifique a temporada selecionada ou adicione pelo menos um registro na aba "Linha do Tempo" que corresponda a este período e temporada.`);
      return;
    }

    // Determine cover image URL
    let finalCoverUrl: string | undefined = undefined;
    if (coverSource === 'upload' && uploadedCover) {
      finalCoverUrl = uploadedCover;
    } else if (coverSource === 'timeline') {
      if (selectedTimelineCover) {
        finalCoverUrl = selectedTimelineCover;
      } else {
        // Fallback to first available entry with media in that period and season
        const entriesWithImages = filtered.filter(e => e.mediaUrl);
        if (entriesWithImages.length > 0) {
          finalCoverUrl = entriesWithImages[0].mediaUrl;
        }
      }
    }

    setIsGenerating(true);
    try {
      await onGenerate(selectedPeriod, filtered, finalCoverUrl, selectedSeason);
    } catch (err: any) {
      setErrorMsg(err.message || "Erro inesperado ao gerar a revista.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8" id="magazines-view">
      {/* Loading Overlay */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-zinc-950/90 z-50 flex flex-col items-center justify-center p-6 text-center select-none"
          >
            <div className="space-y-8 max-w-lg">
              <div className="relative w-24 h-24 mx-auto">
                {/* Visual football loading ring */}
                <div className="absolute inset-0 rounded-full border-4 border-amber-500/10 border-t-amber-500 animate-spin" />
                <div className="absolute inset-2 rounded-full border-4 border-white/5 border-t-white/30 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                <div className="absolute inset-0 flex items-center justify-center text-4xl">
                  ⚽
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-xs font-mono font-bold tracking-widest text-amber-500 uppercase block">
                  REDIGINDO REPORTAGEM DE CAPA
                </span>
                <h3 className="text-xl font-bold text-white font-sans">
                  A IA do Gemini está incorporando {journalist.name}...
                </h3>
                
                {/* Dynamic rotating text */}
                <motion.p
                  key={loadingText}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-sm text-zinc-400 font-serif italic max-w-md mx-auto min-h-[40px]"
                >
                  "{loadingText}"
                </motion.p>
              </div>

              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-[11px] text-zinc-500 font-mono space-y-1 text-left">
                <span className="font-bold text-zinc-400 uppercase">Processo de Redação:</span>
                <p>• Carregando {getFilteredEntries().length} registros da linha do tempo...</p>
                <p>• Transmitindo imagens táticas e de estádio para análise visual...</p>
                <p>• Formatando layout editorial, drops caps e colunismo impresso...</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Card: Generator Board */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-zinc-950 flex items-center gap-1.5">
              <Sparkles className="w-5 h-5 text-amber-500" /> Redação de Revistas
            </h2>
            <p className="text-xs text-zinc-500 mt-1">
              Gere revistas contendo narrativas detalhadas escritas pelo seu jornalista principal baseadas na sua linha do tempo.
            </p>
          </div>

          {/* Season Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-700 flex items-center justify-between">
              <span>🏆 Selecione a Temporada</span>
              <span className="text-[10px] text-amber-600 font-mono font-bold">
                {selectedSeason === settings.season ? "Temporada Atual" : ""}
              </span>
            </label>
            <select
              value={selectedSeason}
              onChange={(e) => {
                setSelectedSeason(e.target.value);
                setErrorMsg(null);
              }}
              className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-sm font-bold text-zinc-900 outline-none focus:ring-1 focus:ring-amber-500"
            >
              {availableSeasons.map((s) => (
                <option key={s} value={s}>
                  Temporada {s} {s === settings.season ? "(Atual)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Period Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-600">Selecione o Período Editorial</label>
            <select
              value={selectedPeriod}
              onChange={(e) => {
                setSelectedPeriod(e.target.value);
                setErrorMsg(null);
              }}
              className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-sm outline-none focus:ring-1 focus:ring-amber-500 font-medium"
            >
              {PERIOD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Highlights count within period */}
          <div className="p-4 bg-zinc-50 border border-zinc-200/50 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-500">Destaques no período:</span>
              <span className="font-bold text-zinc-900">{getFilteredEntries().length} registros</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Jornalista Atribuído:</span>
              {onChangeJournalist ? (
                <div className="relative group flex items-center">
                  <select
                    value={settings.journalistId}
                    onChange={(e) => onChangeJournalist(e.target.value)}
                    className="font-bold text-amber-600 bg-transparent border-none p-0 pr-4 outline-none focus:ring-0 cursor-pointer hover:text-amber-700 transition text-right leading-tight appearance-none font-sans"
                  >
                    {JOURNALISTS.map((j) => (
                      <option key={j.id} value={j.id} className="text-zinc-900 font-medium text-left">
                        {j.avatar} {j.name}
                      </option>
                    ))}
                  </select>
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-amber-500 group-hover:text-amber-600 transition text-[10px]">
                    ✏️
                  </span>
                </div>
              ) : (
                <span className="font-bold text-amber-600">{journalist.name} {journalist.avatar}</span>
              )}
            </div>
            <div className="flex justify-between border-t border-zinc-200 pt-2 mt-2">
              <span className="text-zinc-500 font-bold">Revista Anual Obrigatória?</span>
              <span className="font-extrabold text-green-600 uppercase font-mono">SIM (Sempre Disponível)</span>
            </div>
          </div>

          {/* Cover Selector */}
          <div className="space-y-3 pt-4 border-t border-zinc-100">
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1">
              🖼️ Personalizar Imagem de Capa
            </label>
            
            <div className="grid grid-cols-3 gap-1.5 bg-zinc-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setCoverSource('default')}
                className={`py-1.5 text-[10px] font-bold rounded-lg transition text-center ${
                  coverSource === 'default'
                    ? 'bg-white text-zinc-950 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                Padrão
              </button>
              <button
                type="button"
                onClick={() => setCoverSource('timeline')}
                className={`py-1.5 text-[10px] font-bold rounded-lg transition text-center ${
                  coverSource === 'timeline'
                    ? 'bg-white text-zinc-950 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                Histórico
              </button>
              <button
                type="button"
                onClick={() => setCoverSource('upload')}
                className={`py-1.5 text-[10px] font-bold rounded-lg transition text-center ${
                  coverSource === 'upload'
                    ? 'bg-white text-zinc-950 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                Upload
              </button>
            </div>

            {/* Render conditional views based on selection */}
            {coverSource === 'default' && (
              <div className="p-3 bg-zinc-50 rounded-xl border border-dashed border-zinc-200 text-[10px] text-zinc-500 leading-normal">
                Seleciona automaticamente a primeira imagem com mídia registrada no seu histórico de destaques deste período.
              </div>
            )}

            {coverSource === 'timeline' && (() => {
              const entriesWithImages = getFilteredEntries().filter(e => e.mediaUrl);
              return (
                <div className="space-y-2">
                  <span className="text-[10px] text-zinc-500 font-mono block">
                    Escolha um destaque ilustrado do período:
                  </span>
                  
                  {entriesWithImages.length === 0 ? (
                    <div className="p-3 bg-zinc-50 rounded-xl border border-dashed border-zinc-200 text-[10px] text-zinc-500 text-center">
                      Nenhuma imagem encontrada nos registros deste período. Adicione fotos na aba "Linha do Tempo"!
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-1.5 max-h-[140px] overflow-y-auto p-1.5 bg-zinc-50 rounded-xl border border-zinc-200">
                      {entriesWithImages.map(entry => {
                        const isSelected = selectedTimelineCover === entry.mediaUrl;
                        return (
                          <button
                            key={entry.id}
                            type="button"
                            onClick={() => setSelectedTimelineCover(entry.mediaUrl || null)}
                            className={`aspect-square rounded-lg overflow-hidden border-2 relative transition group ${
                              isSelected 
                                ? 'border-amber-500 ring-2 ring-amber-500/20' 
                                : 'border-zinc-200 hover:border-zinc-400'
                            }`}
                            title={entry.title}
                          >
                            <img 
                              src={entry.mediaUrl} 
                              alt={entry.title} 
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-x-0 bottom-0 bg-black/60 text-[8px] text-white truncate p-0.5 font-mono">
                              {entry.title}
                            </div>
                            {isSelected && (
                              <div className="absolute top-1 right-1 bg-amber-500 text-zinc-950 rounded-full w-3.5 h-3.5 flex items-center justify-center text-[9px] font-black">
                                ✓
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {coverSource === 'upload' && (
              <div className="space-y-3">
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[90px] ${
                    dragActive 
                      ? "border-amber-500 bg-amber-50/20" 
                      : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/30"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                  
                  {uploadedCover ? (
                    <div className="relative group w-16 h-16 rounded-lg overflow-hidden border border-zinc-200 shadow-sm">
                      <img 
                        src={uploadedCover} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                        <span className="text-[9px] text-white font-bold bg-red-600 px-1.5 py-0.5 rounded-full" onClick={(e) => {
                          e.stopPropagation();
                          setUploadedCover(null);
                        }}>
                          Remover
                        </span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className="text-lg">📁</span>
                      <p className="text-[10px] text-zinc-500 font-medium mt-1">
                        Arraste ou <span className="text-amber-600 font-bold underline">procure</span> imagem
                      </p>
                      <span className="text-[8px] font-mono text-zinc-400 mt-0.5 block">Formatos: JPG, PNG.</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Error Feedbacks */}
          {errorMsg && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-700 text-xs rounded-xl font-medium leading-relaxed whitespace-pre-line">
              ⚠️ {errorMsg}
            </div>
          )}

          <button
            onClick={handleGenerateClick}
            className="w-full py-3 bg-zinc-950 hover:bg-zinc-900 text-white rounded-xl font-semibold text-xs tracking-wider uppercase transition shadow-md shadow-zinc-950/10 flex items-center justify-center gap-1.5"
          >
            <BookOpen className="w-4 h-4" /> Escrever Minha Revista! 🖋️
          </button>
        </div>

        {/* Right Area: Generated Magazines Gallery list */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-zinc-950">
                📚 Suas Edições Publicadas ({magazines.length})
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Guarde e folheie todas as crônicas do seu modo carreira organizadas por temporada.
              </p>
            </div>

            {/* Gallery Season Filter Tabs */}
            {availableSeasons.length > 0 && (
              <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl self-start sm:self-auto overflow-x-auto max-w-full">
                <button
                  type="button"
                  onClick={() => setGallerySeasonFilter("all")}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition whitespace-nowrap ${
                    gallerySeasonFilter === "all"
                      ? "bg-white text-zinc-950 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-800"
                  }`}
                >
                  Todas ({magazines.length})
                </button>
                {availableSeasons.map((s) => {
                  const count = magazines.filter((m) => (m.season || settings.season) === s).length;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setGallerySeasonFilter(s)}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition whitespace-nowrap ${
                        gallerySeasonFilter === s
                          ? "bg-white text-zinc-950 shadow-sm"
                          : "text-zinc-500 hover:text-zinc-800"
                      }`}
                    >
                      {s} ({count})
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {magazines.length === 0 ? (
            <div className="text-center py-12 bg-zinc-50 border border-dashed border-zinc-200 rounded-2xl p-6">
              <span className="text-3xl block">📖</span>
              <h4 className="font-bold text-zinc-800 text-sm mt-3">Nenhuma revista gerada ainda</h4>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
                Selecione o período e a temporada ao lado, certifique-se de possuir registros na Linha do Tempo e clique em "Escrever Minha Revista".
              </p>
            </div>
          ) : (() => {
            const displayedMagazines = gallerySeasonFilter === "all"
              ? magazines
              : magazines.filter(m => (m.season || settings.season) === gallerySeasonFilter);

            if (displayedMagazines.length === 0) {
              return (
                <div className="text-center py-10 bg-zinc-50 border border-dashed border-zinc-200 rounded-2xl p-6">
                  <span className="text-2xl block">📂</span>
                  <h4 className="font-bold text-zinc-800 text-xs mt-2">Nenhuma revista para a Temporada {gallerySeasonFilter}</h4>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Alterne o filtro ou gere uma nova edição selecionando esta temporada ao lado.
                  </p>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {displayedMagazines.map((magazine: Magazine) => {
                  const j = JOURNALISTS.find((jour) => jour.id === magazine.journalistId) || journalist;
                  
                  // Get cover illustration if any
                  const coverImg = magazine.coverImageUrl || timelineEntries.find(e => e.mediaUrl)?.mediaUrl;

                  return (
                    <div
                      key={magazine.id}
                      onClick={() => onSelectMagazine(magazine)}
                      className="bg-white rounded-2xl border border-zinc-200/80 overflow-hidden shadow-sm hover:shadow-md hover:border-amber-500/50 transition flex flex-col justify-between group cursor-pointer"
                    >
                      {/* Visual Card Cover Header */}
                      <div className="bg-zinc-900 p-5 text-white relative aspect-[16/10] overflow-hidden flex flex-col justify-between border-b border-zinc-800">
                        {coverImg && (
                          <div className="absolute inset-0 opacity-20 pointer-events-none">
                            <img 
                              src={coverImg} 
                              alt="Background blur" 
                              className="w-full h-full object-cover filter blur-[2px]"
                            />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent z-0" />

                        <div className="relative z-10 flex items-center justify-between gap-1 flex-wrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[9px] font-mono font-bold tracking-widest text-amber-500 uppercase bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                              {magazine.period.split(' ')[0]}
                            </span>
                            <span className="text-[9px] font-mono font-bold text-zinc-200 bg-zinc-800/90 border border-zinc-700 px-1.5 py-0.5 rounded">
                              {magazine.season || settings.season || "2024/2025"}
                            </span>
                          </div>
                          <span className="text-[10px] text-zinc-400 font-mono">Páginas: {magazine.pages.length}</span>
                        </div>

                        <div className="relative z-10 space-y-1">
                          <h3 className="font-extrabold text-white text-base leading-tight font-sans tracking-tight uppercase line-clamp-2">
                            {magazine.title}
                          </h3>
                          <p className="text-[11px] text-zinc-400 font-serif italic truncate">
                            "{magazine.subtitle}"
                          </p>
                        </div>
                      </div>

                      {/* Meta info & actions */}
                      <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between gap-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <span className="text-xl p-1.5 bg-white border border-zinc-200 rounded-lg shadow-sm">{j.avatar}</span>
                          <div>
                            <span className="text-[9px] font-mono uppercase text-zinc-400 block leading-tight">Por jornalista:</span>
                            <span className="text-xs font-semibold text-zinc-800 leading-tight block">{j.name}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteMagazine(magazine.id);
                            }}
                            className="p-2 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
                            title="Excluir revista"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onSelectMagazine(magazine)}
                            className="bg-zinc-950 hover:bg-zinc-900 text-white px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition"
                          >
                            Folhear 📖
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
