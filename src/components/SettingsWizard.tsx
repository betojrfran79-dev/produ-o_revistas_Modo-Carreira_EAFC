import { useState } from "react";
import { CareerSettings, JOURNALISTS, Journalist } from "../types";
import { motion } from "motion/react";
import { Sparkles, Trophy, User, Calendar, Shield, Key, Check, Upload, Loader2, AlertCircle, Eye, EyeOff, Globe, Image as ImageIcon, Cpu } from "lucide-react";
import { importCareerBackup } from "../lib/backupUtils";

interface SettingsWizardProps {
  onSave: (settings: CareerSettings) => void;
  initialSettings?: CareerSettings | null;
}

export default function SettingsWizard({ onSave, initialSettings }: SettingsWizardProps) {
  const [characterName, setCharacterName] = useState(initialSettings?.characterName || "");
  const [careerType, setCareerType] = useState<'player' | 'manager'>(initialSettings?.careerType || "player");
  const [teamName, setTeamName] = useState(initialSettings?.teamName || "");
  const [season, setSeason] = useState(initialSettings?.season || "2026/2027");
  const [selectedJournalist, setSelectedJournalist] = useState<string>(initialSettings?.journalistId || JOURNALISTS[0].id);

  // Extended API keys and services state
  const [aiProvider, setAiProvider] = useState<'gemini' | 'openai' | 'anthropic'>(initialSettings?.aiProvider || 'gemini');
  const [customApiKey, setCustomApiKey] = useState(initialSettings?.customApiKey || "");
  const [openaiApiKey, setOpenaiApiKey] = useState(initialSettings?.openaiApiKey || "");
  const [anthropicApiKey, setAnthropicApiKey] = useState(initialSettings?.anthropicApiKey || "");
  const [imgurClientId, setImgurClientId] = useState(initialSettings?.imgurClientId || "");
  const [customWebhookUrl, setCustomWebhookUrl] = useState(initialSettings?.customWebhookUrl || "");

  // Visibility toggles for keys
  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({});

  const toggleShowKey = (field: string) => {
    setShowKeys((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  // Import career backup states
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState("");
  const [importError, setImportError] = useState("");

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      setImportError("");
      const restoredSettings = await importCareerBackup(file, (text) => setImportProgress(text));
      
      if (restoredSettings) {
        onSave(restoredSettings);
      } else {
        // If settings were not present in backup, use form values or reload window
        window.location.reload();
      }
    } catch (err: any) {
      console.error("Erro ao importar carreira na tela inicial:", err);
      setImportError(err.message || "Não foi possível ler o arquivo de backup.");
      setImporting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!characterName.trim() || !teamName.trim() || !season.trim()) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }
    onSave({
      characterName,
      careerType,
      teamName,
      season,
      journalistId: selectedJournalist,
      aiProvider,
      customApiKey: customApiKey.trim() || undefined,
      openaiApiKey: openaiApiKey.trim() || undefined,
      anthropicApiKey: anthropicApiKey.trim() || undefined,
      imgurClientId: imgurClientId.trim() || undefined,
      customWebhookUrl: customWebhookUrl.trim() || undefined,
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4" id="config-wizard">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl border border-zinc-200/80 shadow-xl overflow-hidden"
      >
        {/* Banner */}
        <div className="bg-zinc-950 p-8 text-white relative overflow-hidden border-b border-zinc-800">
          <div className="absolute inset-0 bg-radial-gradient from-zinc-800/50 to-transparent pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs font-mono mb-3">
                <Trophy className="w-3 h-3" /> EA FC CAREER COMPANION
              </div>
              <h1 className="text-3xl font-bold font-sans tracking-tight">
                {initialSettings ? "Editar Configurações da Carreira" : "Iniciar Nova Jornada"}
              </h1>
              <p className="text-zinc-400 text-sm mt-1">
                {initialSettings 
                  ? "Atualize os dados do seu personagem ou configure suas Chaves de API para continuar gerando crônicas."
                  : "Configure sua carreira ou importe uma salva anteriormente para arquivar sua história e revistas épicas."
                }
              </p>
            </div>
            <div className="text-5xl font-extrabold text-zinc-800 tracking-wider select-none font-mono hidden md:block">
              EA FC 26
            </div>
          </div>
        </div>

        {/* Top Direct Career Import Card (Available on Initial Access) */}
        {!initialSettings && (
          <div className="p-6 bg-amber-500/5 border-b border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-md shrink-0 mt-0.5">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                  Já possui uma Carreira Salva?
                  <span className="bg-amber-500/20 text-amber-800 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">Rápido</span>
                </h3>
                <p className="text-xs text-zinc-600 mt-0.5">
                  Importe seu arquivo de backup (.zip ou .json) para restaurar todos os seus fatos, relatos e revistas instantaneamente sem precisar preencher nada.
                </p>
              </div>
            </div>

            {importing ? (
              <div className="flex items-center gap-2 text-amber-700 bg-amber-100/80 px-4 py-2.5 rounded-xl text-xs font-semibold animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{importProgress || "Restaurando carreira..."}</span>
              </div>
            ) : (
              <label className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs transition shadow-md shadow-amber-500/20 cursor-pointer flex items-center gap-2 text-center active:scale-95">
                <Upload className="w-4 h-4" />
                <span>Importar Carreira (.zip / .json)</span>
                <input
                  type="file"
                  accept=".zip,.json,.fcbackup"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </label>
            )}

            {importError && (
              <div className="w-full text-xs text-red-600 font-medium bg-red-50 border border-red-200 p-2.5 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{importError}</span>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Section 1: Basic Info */}
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-zinc-900 border-l-4 border-amber-500 pl-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" /> Informações Básicas da Carreira
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Character Name */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-zinc-700 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-zinc-400" /> Nome do Personagem <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Gabriel Barbosa, Alex Hunter..."
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
                />
              </div>

              {/* Career Type Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-zinc-700">
                  Tipo de Carreira <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCareerType('player')}
                    className={`py-3 px-4 rounded-xl font-medium border text-center transition ${
                      careerType === 'player'
                        ? 'border-amber-500 bg-amber-500/5 text-amber-700 font-bold'
                        : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-600'
                    }`}
                  >
                    ⚽ Carreira de Jogador
                  </button>
                  <button
                    type="button"
                    onClick={() => setCareerType('manager')}
                    className={`py-3 px-4 rounded-xl font-medium border text-center transition ${
                      careerType === 'manager'
                        ? 'border-amber-500 bg-amber-500/5 text-amber-700 font-bold'
                        : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-600'
                    }`}
                  >
                    👔 Carreira de Treinador
                  </button>
                </div>
              </div>

              {/* Team Name */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-zinc-700 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-zinc-400" /> Time Atual no EA FC <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Real Madrid, Flamengo, Arsenal..."
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
                />
              </div>

              {/* Season */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-zinc-700 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-zinc-400" /> Temporada Atual <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 2026/2027, Temporada 1..."
                  value={season}
                  onChange={(e) => setSeason(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Journalist Selection */}
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 border-l-4 border-amber-500 pl-3">
                Selecione o Jornalista Narrador
              </h2>
              <p className="text-xs text-zinc-500 mt-1">A IA assumirá esta persona jornalística, escrevendo as edições com o estilo de escrita, vocabulário e gírias clássicas desse cronista.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {JOURNALISTS.map((journalist: Journalist) => {
                const isSelected = selectedJournalist === journalist.id;
                return (
                  <button
                    key={journalist.id}
                    type="button"
                    onClick={() => setSelectedJournalist(journalist.id)}
                    className={`text-left p-4 rounded-2xl border transition relative flex flex-col justify-between h-full ${
                      isSelected
                        ? "border-amber-500 bg-amber-500/5 ring-1 ring-amber-500"
                        : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100 hover:border-zinc-300"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-3xl p-2 bg-white rounded-xl shadow-sm border border-zinc-100">{journalist.avatar}</span>
                        <div>
                          <h3 className="font-bold text-zinc-900 text-sm leading-tight flex items-center gap-1.5">
                            {journalist.name}
                            {isSelected && <span className="bg-amber-500 text-white rounded-full p-0.5"><Check className="w-3 h-3" /></span>}
                          </h3>
                          <span className="text-[10px] text-zinc-500 font-mono tracking-tight">{journalist.catchphrase.substring(0, 30)}...</span>
                        </div>
                      </div>
                      
                      <p className="text-xs text-zinc-600 mt-3 line-clamp-2">{journalist.bio}</p>
                      
                      <div className="mt-3">
                        <span className="text-[10px] font-mono font-medium text-zinc-500 uppercase tracking-wider block">Estilo:</span>
                        <p className="text-[11px] text-zinc-700 italic leading-snug">{journalist.styleDescription}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-4">
                      {journalist.tags.map((tag) => (
                        <span key={tag} className="text-[9px] bg-white text-zinc-600 border border-zinc-200/60 px-1.5 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Extended API Keys & Services */}
          <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-200/60 space-y-6">
            <div className="flex items-start gap-3 border-b border-zinc-200/80 pb-4">
              <div className="p-2.5 bg-amber-500/10 text-amber-600 rounded-xl">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-zinc-950 text-base">Chaves de API Diversas & Serviços <span className="text-zinc-400 font-normal text-xs">(Opcional)</span></h3>
                <p className="text-xs text-zinc-600 mt-0.5">
                  Insira suas chaves de API personalizadas para o motor de IA ou serviços de hospedagem. Deixe em branco se desejar utilizar as chaves padrão com segurança.
                </p>
              </div>
            </div>

            {/* Provider Tabs */}
            <div className="space-y-4">
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-amber-500" /> Provedor de IA Preferencial
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setAiProvider('gemini')}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                    aiProvider === 'gemini'
                      ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold shadow-sm'
                      : 'border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs">✨ Google Gemini</span>
                    {aiProvider === 'gemini' && <Check className="w-3.5 h-3.5 text-amber-600" />}
                  </div>
                  <span className="text-[10px] text-zinc-500 font-normal mt-1">Recomendado (Flash/Pro)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAiProvider('openai')}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                    aiProvider === 'openai'
                      ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold shadow-sm'
                      : 'border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs">🤖 OpenAI</span>
                    {aiProvider === 'openai' && <Check className="w-3.5 h-3.5 text-amber-600" />}
                  </div>
                  <span className="text-[10px] text-zinc-500 font-normal mt-1">GPT-4o / ChatGPT</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAiProvider('anthropic')}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                    aiProvider === 'anthropic'
                      ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold shadow-sm'
                      : 'border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs">🧠 Anthropic</span>
                    {aiProvider === 'anthropic' && <Check className="w-3.5 h-3.5 text-amber-600" />}
                  </div>
                  <span className="text-[10px] text-zinc-500 font-normal mt-1">Claude 3.5 Sonnet</span>
                </button>
              </div>
            </div>

            {/* Inputs Grid */}
            <div className="space-y-4 pt-2">
              {/* 1. Gemini Key */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-800 flex items-center justify-between">
                  <span>Chave Gemini API (Google AI Studio)</span>
                  <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline text-[11px] font-normal">Obter chave grátis 🔑</a>
                </label>
                <div className="flex gap-2">
                  <input
                    type={showKeys["gemini"] ? "text" : "password"}
                    placeholder="AIzaSy..."
                    value={customApiKey}
                    onChange={(e) => setCustomApiKey(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey("gemini")}
                    className="px-3 py-2 border border-zinc-200 hover:bg-zinc-100 rounded-xl text-xs font-medium text-zinc-600 transition"
                  >
                    {showKeys["gemini"] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* 2. OpenAI Key */}
              {aiProvider === 'openai' && (
                <div className="space-y-1.5 animate-fade-in">
                  <label className="block text-xs font-semibold text-zinc-800 flex items-center justify-between">
                    <span>Chave OpenAI API (sk-...)</span>
                    <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline text-[11px] font-normal">OpenAI Dashboard 🔑</a>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type={showKeys["openai"] ? "text" : "password"}
                      placeholder="sk-proj-..."
                      value={openaiApiKey}
                      onChange={(e) => setOpenaiApiKey(e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowKey("openai")}
                      className="px-3 py-2 border border-zinc-200 hover:bg-zinc-100 rounded-xl text-xs font-medium text-zinc-600 transition"
                    >
                      {showKeys["openai"] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* 3. Anthropic Key */}
              {aiProvider === 'anthropic' && (
                <div className="space-y-1.5 animate-fade-in">
                  <label className="block text-xs font-semibold text-zinc-800 flex items-center justify-between">
                    <span>Chave Anthropic API (sk-ant-...)</span>
                    <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline text-[11px] font-normal">Anthropic Console 🔑</a>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type={showKeys["anthropic"] ? "text" : "password"}
                      placeholder="sk-ant-api03-..."
                      value={anthropicApiKey}
                      onChange={(e) => setAnthropicApiKey(e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowKey("anthropic")}
                      className="px-3 py-2 border border-zinc-200 hover:bg-zinc-100 rounded-xl text-xs font-medium text-zinc-600 transition"
                    >
                      {showKeys["anthropic"] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* 4. Imgur / Media Client ID */}
              <div className="space-y-1.5 pt-2 border-t border-zinc-200/60">
                <label className="block text-xs font-semibold text-zinc-800 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-zinc-500" /> Client ID Imgur (Hospedagem Externa de Mídias)
                </label>
                <input
                  type="text"
                  placeholder="Ex: c83a91b... (opcional para upload de fotos externas)"
                  value={imgurClientId}
                  onChange={(e) => setImgurClientId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* 5. Custom Webhook */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-800 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-zinc-500" /> Webhook / API Personalizada de Integração
                </label>
                <input
                  type="url"
                  placeholder="https://sua-api.com/webhook (opcional para notificações ou sincronização)"
                  value={customWebhookUrl}
                  onChange={(e) => setCustomWebhookUrl(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-zinc-100 flex justify-end">
            <button
              type="submit"
              className="bg-zinc-950 hover:bg-zinc-900 text-white font-medium text-sm px-8 py-3.5 rounded-xl transition shadow-lg shadow-zinc-950/10 active:scale-[0.98] cursor-pointer"
            >
              {initialSettings ? "Salvar Alterações 💾" : "Iniciar Modo Carreira 🎮"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
