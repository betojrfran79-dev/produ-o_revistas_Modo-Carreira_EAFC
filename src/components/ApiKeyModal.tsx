import { useState } from "react";
import { motion } from "motion/react";
import { Key, Eye, EyeOff, Shield, ExternalLink, HelpCircle, Bot, Sparkles } from "lucide-react";
import { CareerSettings } from "../types";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: CareerSettings | null;
  onSave: (provider: 'gemini' | 'openai' | 'anthropic', geminiKey: string, openaiKey: string, anthropicKey: string) => void;
}

export default function ApiKeyModal({ isOpen, onClose, currentSettings, onSave }: ApiKeyModalProps) {
  const [activeProvider, setActiveProvider] = useState<'gemini' | 'openai' | 'anthropic'>(
    currentSettings?.aiProvider || 'gemini'
  );

  const [geminiKey, setGeminiKey] = useState(currentSettings?.customApiKey || "");
  const [openaiKey, setOpenaiKey] = useState(currentSettings?.openaiApiKey || "");
  const [anthropicKey, setAnthropicKey] = useState(currentSettings?.anthropicApiKey || "");

  const [showKey, setShowKey] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(activeProvider, geminiKey.trim(), openaiKey.trim(), anthropicKey.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white rounded-3xl p-6 max-w-lg w-full border border-zinc-200 shadow-2xl space-y-5"
      >
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-950 text-base flex items-center gap-1.5">
                Provedor e Chaves de Inteligência Artificial
              </h3>
              <p className="text-[11px] text-zinc-500">Escolha a IA de sua preferência (Gemini, ChatGPT ou Claude)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-xl text-xs font-semibold transition"
          >
            Fechar
          </button>
        </div>

        {/* Provider Selector Tabs */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Bot className="w-3.5 h-3.5 text-amber-500" />
            1. Escolha o Provedor de IA Ativo:
          </label>
          <div className="grid grid-cols-3 gap-2 bg-zinc-100 p-1.5 rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveProvider('gemini')}
              className={`py-2 px-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                activeProvider === 'gemini'
                  ? 'bg-white text-zinc-950 shadow-sm border border-zinc-200/80'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <span>♊</span>
              <span>Gemini</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveProvider('openai')}
              className={`py-2 px-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                activeProvider === 'openai'
                  ? 'bg-white text-zinc-950 shadow-sm border border-zinc-200/80'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <span>🟢</span>
              <span>ChatGPT</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveProvider('anthropic')}
              className={`py-2 px-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                activeProvider === 'anthropic'
                  ? 'bg-white text-zinc-950 shadow-sm border border-zinc-200/80'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <span>🟣</span>
              <span>Claude</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Active Provider Input */}
          {activeProvider === 'gemini' && (
            <div className="space-y-1.5 bg-amber-50/40 p-3.5 rounded-2xl border border-amber-200/60">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-amber-900 font-mono">
                  🔑 Chave de API do Google Gemini (Recomendado & Gratuito)
                </label>
                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                  Cota Grátis
                </span>
              </div>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  placeholder="Cole sua chave aqui (AIzaSy...)"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-amber-200 bg-white text-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-zinc-500">
                Se deixado em branco, o aplicativo tenta utilizar a chave compartilhada padrão do servidor.
              </p>
            </div>
          )}

          {activeProvider === 'openai' && (
            <div className="space-y-1.5 bg-emerald-50/40 p-3.5 rounded-2xl border border-emerald-200/60">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-emerald-900 font-mono">
                  🔑 Chave de API da OpenAI (ChatGPT / GPT-4o mini)
                </label>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  GPT-4o / Vision
                </span>
              </div>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  placeholder="Cole sua chave da OpenAI aqui (sk-...)"
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-emerald-200 bg-white text-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-zinc-500">
                Requer saldo ou cota ativa na sua conta de desenvolvedor da OpenAI.
              </p>
            </div>
          )}

          {activeProvider === 'anthropic' && (
            <div className="space-y-1.5 bg-purple-50/40 p-3.5 rounded-2xl border border-purple-200/60">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-purple-900 font-mono">
                  🔑 Chave de API da Anthropic (Claude 3.5 Sonnet)
                </label>
                <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full">
                  Claude 3.5
                </span>
              </div>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  placeholder="Cole sua chave da Anthropic aqui (sk-ant-...)"
                  value={anthropicKey}
                  onChange={(e) => setAnthropicKey(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-purple-200 bg-white text-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-zinc-500">
                Requer saldo ativo na sua conta do Console da Anthropic.
              </p>
            </div>
          )}

          {/* Quick Info / Guide Box */}
          <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center gap-1.5 text-zinc-800 font-bold text-xs">
              <HelpCircle className="w-4 h-4 text-amber-500" />
              <span>Onde obter a chave para o provedor {activeProvider === 'gemini' ? 'Google Gemini' : activeProvider === 'openai' ? 'OpenAI (ChatGPT)' : 'Anthropic (Claude)'}?</span>
            </div>
            
            {activeProvider === 'gemini' && (
              <ol className="text-[11px] text-zinc-600 space-y-1 list-decimal list-inside leading-relaxed">
                <li>Acesse o <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline font-bold inline-flex items-center gap-0.5">Google AI Studio <ExternalLink className="w-3 h-3 inline" /></a>.</li>
                <li>Clique no botão <strong>"Get API Key"</strong> no menu superior/lateral.</li>
                <li>Crie ou selecione um projeto e copie sua chave gratuita gerada.</li>
              </ol>
            )}

            {activeProvider === 'openai' && (
              <ol className="text-[11px] text-zinc-600 space-y-1 list-decimal list-inside leading-relaxed">
                <li>Acesse o portal da <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline font-bold inline-flex items-center gap-0.5">OpenAI Platform <ExternalLink className="w-3 h-3 inline" /></a>.</li>
                <li>Faça login ou crie sua conta e acesse <strong>API Keys</strong>.</li>
                <li>Clique em <strong>"Create new secret key"</strong> e copie a chave iniciada em <code>sk-...</code>.</li>
              </ol>
            )}

            {activeProvider === 'anthropic' && (
              <ol className="text-[11px] text-zinc-600 space-y-1 list-decimal list-inside leading-relaxed">
                <li>Acesse o <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline font-bold inline-flex items-center gap-0.5">Anthropic Console <ExternalLink className="w-3 h-3 inline" /></a>.</li>
                <li>Acesse a seção <strong>API Keys</strong> no menu de configurações.</li>
                <li>Clique em <strong>"Create Key"</strong> e copie a chave gerada iniciada em <code>sk-ant-...</code>.</li>
              </ol>
            )}
          </div>

          <div className="p-3 bg-green-50/80 border border-green-100 rounded-2xl flex items-start gap-2">
            <Shield className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
            <p className="text-[10px] text-zinc-600 leading-relaxed">
              <strong>Privacidade & Segurança:</strong> Suas chaves de API ficam salvas estritamente no armazenamento local (localStorage) do seu navegador. Elas são enviadas de forma privada para o servidor processar a crônica da revista.
            </p>
          </div>

          <div className="border-t border-zinc-100 pt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-zinc-200 hover:bg-zinc-50 rounded-xl text-xs font-semibold text-zinc-600 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-zinc-950 hover:bg-zinc-900 text-white rounded-xl text-xs font-bold transition shadow-md shadow-zinc-950/10 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Salvar Configuração de IA 🔑</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

