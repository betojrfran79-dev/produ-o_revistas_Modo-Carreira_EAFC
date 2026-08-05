import React, { useState } from "react";
import { 
  BookOpen, 
  PlusCircle, 
  Video, 
  FileText, 
  CloudLightning, 
  HelpCircle, 
  AlertTriangle, 
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Database,
  Smartphone,
  Pencil,
  Key
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { JOURNALISTS } from "../types";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeJournalistName?: string;
}

type TabType = "welcome" | "timeline" | "media" | "magazine" | "storage" | "api_key";

export default function HelpModal({ isOpen, onClose, activeJournalistName = "Seu Cronista" }: HelpModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("welcome");

  if (!isOpen) return null;

  const menuItems = [
    { id: "welcome", label: "🌟 Começo Rápido", desc: "O que é e como funciona" },
    { id: "timeline", label: "📝 Registrar Fatos", desc: "Como alimentar o diário" },
    { id: "media", label: "🎬 Fotos e Vídeos", desc: "Regras de mídia e limites" },
    { id: "magazine", label: "📖 Criar Revistas", desc: "Gerar as edições da temporada" },
    { id: "storage", label: "☁️ Sincronização e Nuvem", desc: "Como seus dados são salvos" },
    { id: "api_key", label: "🔑 Chave de API Grátis", desc: "Como obter e configurar a IA" },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 z-[120] flex items-center justify-center p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", duration: 0.4 }}
        className="bg-white rounded-3xl max-w-5xl w-full max-h-[85vh] overflow-hidden border border-zinc-200 shadow-2xl flex flex-col md:flex-row font-sans"
      >
        {/* Sidebar Navigation */}
        <div className="md:w-80 bg-zinc-50 border-b md:border-b-0 md:border-r border-zinc-200/80 p-5 flex flex-col justify-between shrink-0">
          <div className="space-y-6">
            <div className="flex items-center gap-2.5 px-2">
              <div className="p-2 bg-amber-500 text-white rounded-2xl shadow-md shadow-amber-500/15">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-zinc-950 tracking-tight text-sm">Guia de Utilização</h3>
                <p className="text-[10px] text-zinc-500 uppercase font-mono font-bold">Manual Passo a Passo</p>
              </div>
            </div>

            <nav className="space-y-1">
              {menuItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as TabType)}
                    className={`w-full text-left px-3.5 py-3 rounded-2xl transition flex items-center justify-between group ${
                      isActive 
                        ? "bg-amber-500 text-white shadow-lg shadow-amber-500/10" 
                        : "hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900"
                    }`}
                  >
                    <div className="min-w-0">
                      <span className="font-bold text-xs block leading-tight">{item.label}</span>
                      <span className={`text-[10px] block mt-0.5 leading-none ${isActive ? "text-amber-100" : "text-zinc-400 group-hover:text-zinc-500"}`}>
                        {item.desc}
                      </span>
                    </div>
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform shrink-0 ${isActive ? "translate-x-0.5 text-white" : "text-zinc-400 group-hover:translate-x-0.5"}`} />
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="mt-6 md:mt-0 pt-4 border-t border-zinc-200/60 text-center md:text-left px-2">
            <span className="text-[10px] font-mono text-zinc-400 block">SIGA LA PELOTA v1.2</span>
            <span className="text-[10px] text-zinc-500">Desenvolvido para fãs de futebol virtual.</span>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0 max-h-[85vh] md:max-h-[85vh]">
          {/* Header */}
          <div className="border-b border-zinc-100 p-6 flex items-center justify-between shrink-0 bg-white">
            <div>
              <h2 className="text-lg font-black text-zinc-950 flex items-center gap-2">
                {activeTab === "welcome" && "🌟 Bem-vindo ao Siga La Pelota"}
                {activeTab === "timeline" && "📝 Como Alimentar seu Diário de Carreira"}
                {activeTab === "media" && "🎬 Manual de Fotos e Vídeos de Jogadas"}
                {activeTab === "magazine" && "📖 Como Gerar e Ler as Revistas AI"}
                {activeTab === "storage" && "☁️ Como Funciona o Salvamento e Nuvem"}
                {activeTab === "api_key" && "🔑 Como Obter e Configurar sua Chave Gemini Grátis"}
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">Aprenda a eternizar sua jornada do Modo Carreira no EA FC.</p>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold transition shrink-0"
            >
              Entendido
            </button>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-zinc-50/50">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* 1. WELCOME TAB */}
                {activeTab === "welcome" && (
                  <div className="space-y-6">
                    <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-3xl flex gap-4 items-start">
                      <div className="p-3 bg-white border border-amber-100 rounded-2xl text-amber-600 shadow-sm shrink-0">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-zinc-900 text-sm">O que é este aplicativo?</h4>
                        <p className="text-xs text-zinc-600 leading-relaxed">
                          O <strong>Siga La Pelota</strong> é um diário interativo e gerador de revistas esportivas feito para o seu <strong>Modo Carreira (no EA FC ou outros jogos de futebol)</strong>. Em vez de deixar suas conquistas esquecidas na memória, você registra os momentos marcantes e uma Inteligência Artificial cria revistas de verdade contando a sua história!
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-sm">
                        <span className="text-2xl">1️⃣</span>
                        <h5 className="font-bold text-zinc-900 text-xs mt-2">Você Joga e Grava</h5>
                        <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">Seja um golaço, uma contratação de peso ou um título, registre ou tire foto com o celular.</p>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-sm">
                        <span className="text-2xl">2️⃣</span>
                        <h5 className="font-bold text-zinc-900 text-xs mt-2">Alimenta o Diário</h5>
                        <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">Adicione o fato no app. Escreva o que aconteceu de forma simples e anexe a foto ou clipe de vídeo.</p>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-sm">
                        <span className="text-2xl">3️⃣</span>
                        <h5 className="font-bold text-zinc-900 text-xs mt-2">A AI Faz Mágica</h5>
                        <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">Clique em gerar e assista seu jornalista AI de preferência escrever editoriais incríveis.</p>
                      </div>
                    </div>

                    <div className="space-y-2 bg-white rounded-3xl p-5 border border-zinc-200/80">
                      <h4 className="font-bold text-zinc-900 text-xs uppercase tracking-wider font-mono">Os Jornalistas Disponíveis</h4>
                      <p className="text-xs text-zinc-500">Cada jornalista tem uma personalidade e estilo de escrita únicos. Você pode mudar quem escreve no topo da tela ou na edição de revistas:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                        {JOURNALISTS.map((j) => (
                          <div key={j.id} className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/50 flex gap-2.5 items-center">
                            <span className="text-2xl shrink-0">{j.avatar}</span>
                            <div className="min-w-0">
                              <span className="font-bold text-xs text-zinc-900 block leading-tight">{j.name}</span>
                              <span className="text-[10px] text-zinc-500 italic block leading-snug truncate" title={j.styleDescription}>
                                "{j.catchphrase}"
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. TIMELINE TAB */}
                {activeTab === "timeline" && (
                  <div className="space-y-6">
                    <div className="bg-white rounded-3xl p-6 border border-zinc-200/80 space-y-4">
                      <div className="flex items-center gap-2">
                        <PlusCircle className="w-5 h-5 text-amber-500" />
                        <h4 className="font-bold text-zinc-900 text-sm">O que registrar no "Arquivo de Fatos"?</h4>
                      </div>
                      <p className="text-xs text-zinc-600 leading-relaxed">
                        No painel esquerdo da tela principal (<strong>Arquivo de Fatos</strong>), você pode ir adicionando registros das suas partidas. Para que sua revista fique rica de detalhes, tente fazer anotações de:
                      </p>

                      <ul className="space-y-2.5 text-xs text-zinc-600 pl-4 list-disc">
                        <li><strong>Partidas Importantes:</strong> Registre vitórias em clássicos, viradas dramáticas ou derrotas dolorosas.</li>
                        <li><strong>Estatísticas do seu Jogador:</strong> Quantos gols ele fez no jogo, assistências, prêmio de melhor em campo.</li>
                        <li><strong>Janela de Transferências:</strong> Quando o clube contratou um grande parceiro ou vendeu um ídolo.</li>
                        <li><strong>Títulos e Prêmios:</strong> Conquista da taça nacional, Champions League, artilharia ou Bola de Ouro.</li>
                      </ul>
                    </div>

                    <div className="bg-white rounded-3xl p-6 border border-zinc-200/80 space-y-3">
                      <h4 className="font-bold text-zinc-900 text-xs uppercase tracking-wider font-mono">Dica para facilitar: Digitação em Lote 📝</h4>
                      <p className="text-xs text-zinc-600 leading-relaxed">
                        Não quer abrir o app a cada jogo? Jogue sua temporada, anote os fatos em um papel ou no bloco de notas do celular. Depois, clique no botão <strong>"Adicionar Vários (Lote)"</strong> no app e cole todas as partidas de uma só vez usando o formato:
                      </p>
                      <pre className="bg-zinc-900 text-zinc-100 p-4 rounded-xl text-[11px] font-mono leading-relaxed overflow-x-auto">
{`Janeiro: Estreia fantástica! Ganhamos de 3x0 na pré-temporada, marquei 2 gols e dei 1 assistência.
Fevereiro: Começamos o Estadual com o pé direito, vitória no clássico por 1x0.
Março: Classificação garantida após um empate tenso de 1x1 fora de casa.`}
                      </pre>
                      <p className="text-[11px] text-zinc-500 italic">O app lerá cada linha e criará os fatos automaticamente de forma organizada!</p>
                    </div>
                  </div>
                )}

                {/* 3. MEDIA & EXPLANATION FOR VIDEOS TAB */}
                {activeTab === "media" && (
                  <div className="space-y-6">
                    <div className="bg-red-50/60 border border-red-100 p-5 rounded-3xl flex gap-4 items-start">
                      <div className="p-3 bg-white border border-red-100 rounded-2xl text-red-500 shadow-sm shrink-0">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-red-950 text-sm">Entenda os Limites de Vídeos e Fotos</h4>
                        <p className="text-xs text-red-900/85 leading-relaxed">
                          Para garantir que o aplicativo funcione sem que você precise pagar por armazenamento caro ou fazer logins complexos, os dados são salvos no seu próprio navegador e sincronizados em uma nuvem gratuita (Firebase). 
                          <br />
                          <strong>Por conta disso, existe uma regra fundamental para vídeos e mídias pesadas:</strong>
                        </p>
                      </div>
                    </div>

                    <div className="bg-white rounded-3xl p-6 border border-zinc-200/80 space-y-4">
                      <h4 className="font-bold text-zinc-900 text-xs uppercase tracking-wider font-mono flex items-center gap-1.5 text-amber-600">
                        <Video className="w-4 h-4" /> Por que meu vídeo não rodou ou desapareceu ao reabrir?
                      </h4>
                      <p className="text-xs text-zinc-600 leading-relaxed">
                        Os arquivos de vídeo gravados no console ou no celular costumam ser <strong>muito grandes (de 10MB a mais de 100MB)</strong>.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-2">
                          <span className="font-bold text-xs text-red-600 block">❌ O que causa problemas:</span>
                          <p className="text-[11px] text-zinc-500 leading-relaxed">
                            Vídeos longos de alta definição gravados diretamente do Playstation ou Xbox. O banco de dados gratuito na nuvem possui um limite estrito de <strong>1MB por registro</strong>. Se você subir um vídeo maior que isso, ele funcionará apenas temporariamente e <strong>não conseguirá ser salvo na nuvem</strong>, falhando ao recarregar a página.
                          </p>
                        </div>
                        <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-2">
                          <span className="font-bold text-xs text-emerald-600 block">✨ O que fazer para dar certo:</span>
                          <ul className="text-[11px] text-zinc-500 space-y-1.5 list-disc pl-3.5 leading-relaxed">
                            <li><strong>Reduza o vídeo:</strong> Corte para mostrar apenas o golaço (no máximo 5 a 10 segundos) e salve em resolução média antes de anexar.</li>
                            <li><strong>Utilize links externos:</strong> Se você posta os vídeos das suas jogadas no YouTube, TikTok, Instagram ou Twitter, basta colar o <strong>Link do Vídeo</strong> no campo ao registrar. Isso funciona 100% das vezes e não pesa nada!</li>
                            <li><strong>Prefira fotos/prints:</strong> Imagens de golaços, placares ou escalações são leves e salvam perfeitamente na nuvem.</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="bg-amber-500/15 p-5 rounded-3xl border border-amber-500/10 space-y-2">
                      <h5 className="font-bold text-zinc-900 text-xs flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-amber-600" /> Resumo das Boas Práticas de Mídia:
                      </h5>
                      <p className="text-xs text-zinc-700 leading-relaxed">
                        Prefira anexar <strong>fotos leves</strong> da tela ou colar <strong>links de vídeos</strong> que você postou nas redes sociais. Se for fazer upload de arquivos de vídeo locais, garanta que sejam clipes cortados e compactados de poucos segundos!
                      </p>
                    </div>
                  </div>
                )}

                {/* 4. MAGAZINE CREATION TAB */}
                {activeTab === "magazine" && (
                  <div className="space-y-6">
                    <div className="bg-white rounded-3xl p-6 border border-zinc-200/80 space-y-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-amber-500" />
                        <h4 className="font-bold text-zinc-900 text-sm">Gerando as Crônicas e Revistas da Temporada</h4>
                      </div>
                      <p className="text-xs text-zinc-600 leading-relaxed">
                        No painel direito (<strong>Edição de Crônicas</strong>), você gera as revistas. Funciona assim:
                      </p>

                      <ol className="space-y-3 text-xs text-zinc-600 pl-4 list-decimal leading-relaxed">
                        <li>
                          <strong>Selecione o Período:</strong> Você pode gerar uma revista mensal (ex: apenas com os fatos de Janeiro ou Fevereiro) ou fazer a grande edição de gala: a <strong>Revista Anual - Temporada Completa</strong>.
                        </li>
                        <li>
                          <strong>Selecione o Jornalista Editor:</strong> Cada revista pode ter o estilo de um cronista diferente. Você pode trocar o jornalista a qualquer momento na aba de edição de crônicas (com o menu de seleção rápida) ou no topo da tela.
                        </li>
                        <li>
                          <strong>Clique em "Gerar Crônica da Revista":</strong> O app enviará seus destaques registrados para a Inteligência Artificial, que escreverá uma crônica detalhada simulando uma revista esportiva real.
                        </li>
                        <li>
                          <strong>Abra a Revista:</strong> Depois de gerada, ela aparecerá na lista abaixo. Clique em <strong>"Abrir Revista"</strong> para entrar no modo leitor imersivo, folhear as páginas, ver suas fotos/vídeos anexados e reviver os lances.
                        </li>
                      </ol>
                    </div>

                    <div className="bg-amber-50/60 rounded-3xl p-5 border border-amber-200/60 flex items-start gap-3">
                      <div className="p-1 bg-amber-500 text-white rounded-lg text-xs font-mono font-bold">Dica</div>
                      <p className="text-xs text-zinc-700 leading-relaxed">
                        A revista destaca apenas os meses que possuem fatos registrados. Se você registrou fatos apenas em Janeiro, Fevereiro e Março, a revista cobrirá com muito detalhe esses períodos! Mantenha seu arquivo atualizado para ter edições épicas.
                      </p>
                    </div>
                  </div>
                )}

                {/* 5. STORAGE & CLOUD SHARING TAB */}
                {activeTab === "storage" && (
                  <div className="space-y-6">
                    <div className="bg-white rounded-3xl p-6 border border-zinc-200/80 space-y-4">
                      <div className="flex items-center gap-2">
                        <CloudLightning className="w-5 h-5 text-amber-500" />
                        <h4 className="font-bold text-zinc-900 text-sm">Onde ficam guardados os meus dados?</h4>
                      </div>
                      <p className="text-xs text-zinc-600 leading-relaxed">
                        Uma das maiores vantagens deste app é a <strong>liberdade</strong>:
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/60 space-y-1.5">
                          <h5 className="font-bold text-zinc-900 text-xs flex items-center gap-1.5">
                            <Database className="w-4 h-4 text-amber-600" /> Banco de Dados Local
                          </h5>
                          <p className="text-[11px] text-zinc-500 leading-relaxed">
                            Tudo o que você digita, anexa e cria é guardado de imediato no armazenamento interno do seu navegador (<strong>IndexedDB</strong>). Isso significa que se você ficar sem internet, o aplicativo continua funcionando normalmente e seus dados continuam salvos lá.
                          </p>
                        </div>
                        <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/60 space-y-1.5">
                          <h5 className="font-bold text-zinc-900 text-xs flex items-center gap-1.5">
                            <CloudLightning className="w-4 h-4 text-amber-600" /> Sincronização em Nuvem (Firebase)
                          </h5>
                          <p className="text-[11px] text-zinc-500 leading-relaxed">
                            O app se conecta automaticamente a uma nuvem segura do Firebase de forma transparente. Quando você faz alguma alteração, ela é enviada para a nuvem em segundos (você pode ver o status de sincronização piscando no topo <strong>"CONNECTED / SYNCED"</strong>).
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-3xl p-6 border border-zinc-200/80 space-y-4">
                      <h4 className="font-bold text-zinc-900 text-xs uppercase tracking-wider font-mono flex items-center gap-1.5 text-zinc-700">
                        <Smartphone className="w-4 h-4" /> Como distribuir para meus amigos ou abrir no celular?
                      </h4>
                      <p className="text-xs text-zinc-600 leading-relaxed">
                        Para compartilhar o app ou usá-lo em outros dispositivos (como no seu celular enquanto joga no console):
                      </p>
                      <ul className="space-y-2 text-xs text-zinc-600 pl-4 list-disc leading-relaxed">
                        <li>
                          <strong>Mesmo Link, Mesma Carreira:</strong> Ao abrir o link de distribuição do app, a sua carreira sincronizará instantaneamente através do banco de dados na nuvem associado ao seu projeto.
                        </li>
                        <li>
                          <strong>Acessando pelo Celular:</strong> Você pode escanear ou abrir o link do aplicativo no navegador do seu smartphone. Você verá todas as suas revistas e poderá tirar fotos das estatísticas na TV e enviar no mesmo instante para o diário.
                        </li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* 6. API KEY TAB */}
                {activeTab === "api_key" && (
                  <div className="space-y-6">
                    <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-3xl flex gap-4 items-start">
                      <div className="p-3 bg-white border border-amber-100 rounded-2xl text-amber-600 shadow-sm shrink-0">
                        <Key className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-zinc-900 text-sm">Por que usar sua própria chave de API?</h4>
                        <p className="text-xs text-zinc-600 leading-relaxed">
                          Para garantir que este aplicativo seja 100% gratuito e sem custos de infraestrutura para o criador do app (evitando o esgotamento dos créditos do desenvolvedor), o sistema utiliza a sua própria cota individual gratuita fornecida pelo Google. <strong>Não se preocupe: a chave é gratuita, fácil de obter e fica salva apenas no seu próprio navegador de forma 100% segura!</strong>
                        </p>
                      </div>
                    </div>

                    <div className="bg-white rounded-3xl p-6 border border-zinc-200/80 space-y-4">
                      <h4 className="font-bold text-zinc-900 text-xs uppercase tracking-wider font-mono flex items-center gap-1.5 text-zinc-700">
                        📋 Passo a Passo para Obter sua Chave (Menos de 1 Minuto)
                      </h4>

                      <div className="space-y-4 pl-1">
                        <div className="flex gap-3 items-start">
                          <div className="w-6 h-6 rounded-full bg-zinc-900 text-white text-[11px] font-bold font-mono flex items-center justify-center shrink-0 mt-0.5">1</div>
                          <div>
                            <p className="text-xs text-zinc-800 font-bold">Acesse o Google AI Studio</p>
                            <p className="text-xs text-zinc-500 leading-relaxed">
                              Abra o site oficial do <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline font-bold">Google AI Studio (aistudio.google.com)</a> no seu computador ou celular.
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-3 items-start">
                          <div className="w-6 h-6 rounded-full bg-zinc-900 text-white text-[11px] font-bold font-mono flex items-center justify-center shrink-0 mt-0.5">2</div>
                          <div>
                            <p className="text-xs text-zinc-800 font-bold">Clique no ícone da chave</p>
                            <p className="text-xs text-zinc-500 leading-relaxed">
                              Após fazer login com sua conta padrão do Google, no menu à esquerda, na parte de baixo, próximo do ícone do seu perfil (com seu nome de usuário ou e-mail), clique no ícone de chave.
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-3 items-start">
                          <div className="w-6 h-6 rounded-full bg-zinc-900 text-white text-[11px] font-bold font-mono flex items-center justify-center shrink-0 mt-0.5">3</div>
                          <div>
                            <p className="text-xs text-zinc-800 font-bold">Clique em "Create API Key"</p>
                            <p className="text-xs text-zinc-500 leading-relaxed">
                              Na próxima tela, no canto superior direito, clique no botão <strong>"Create API Key"</strong>, atribua um nome para a chave, selecione ou crie um projeto do Google Cloud e então clique em <strong>"Create Key"</strong>.
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-3 items-start">
                          <div className="w-6 h-6 rounded-full bg-zinc-900 text-white text-[11px] font-bold font-mono flex items-center justify-center shrink-0 mt-0.5">4</div>
                          <div>
                            <p className="text-xs text-zinc-800 font-bold">Clique em "Copy Key"</p>
                            <p className="text-xs text-zinc-500 leading-relaxed">
                              Assim que a chave for criada com sucesso, clique no botão <strong>"Copy Key"</strong> para copiar a chave gerada.
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-3 items-start">
                          <div className="w-6 h-6 rounded-full bg-amber-500 text-white text-[11px] font-bold font-mono flex items-center justify-center shrink-0 mt-0.5">5</div>
                          <div>
                            <p className="text-xs text-zinc-800 font-bold">Cole no campo correspondente</p>
                            <p className="text-xs text-zinc-500 leading-relaxed">
                              Volte ao aplicativo, abra as <strong>Configurações (ícone de engrenagem)</strong> no canto superior direito, cole o código no campo <strong>"Chave de API do Gemini"</strong> e clique em <strong>"Salvar Configurações"</strong>.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 bg-zinc-50 border border-zinc-200/60 rounded-3xl flex items-start gap-3">
                      <div className="p-1.5 bg-green-500 text-white rounded-lg text-xs font-mono font-bold">Seguro</div>
                      <div className="space-y-1">
                        <h5 className="font-bold text-zinc-900 text-xs">Suas credenciais estão seguras!</h5>
                        <p className="text-[11px] text-zinc-500 leading-relaxed">
                          A chave inserida nunca é enviada ao servidor para fins de armazenamento, nem compartilhada com outros usuários ou com o criador do app. Ela permanece gravada localmente de forma criptografada apenas no banco de dados interno (IndexedDB) do seu próprio navegador.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
