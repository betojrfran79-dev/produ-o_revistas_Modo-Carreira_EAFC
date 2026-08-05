import { useState } from "react";
import { motion } from "motion/react";
import { Download, Upload, Shield, Laptop, Check, Loader2, AlertCircle, HardDrive, Info } from "lucide-react";
import { exportCareerBackup, importCareerBackup } from "../lib/backupUtils";

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessToast: (message: string) => void;
  onReload: () => void;
}

export default function BackupModal({ isOpen, onClose, onSuccessToast, onReload }: BackupModalProps) {
  const [status, setStatus] = useState<"idle" | "exporting" | "importing" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [progressText, setProgressText] = useState("");

  if (!isOpen) return null;

  const handleExport = async () => {
    try {
      setStatus("exporting");
      setErrorMessage("");

      const { blob, filename } = await exportCareerBackup((text) => setProgressText(text));

      const url = URL.createObjectURL(blob);

      // Create download link
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatus("success");
      onSuccessToast("Carreira exportada com sucesso! (Fatos, imagens e revistas salvas sem os vídeos pesados)");
    } catch (error: any) {
      console.error("Erro ao exportar backup:", error);
      setStatus("error");
      setErrorMessage("Erro durante a exportação: " + (error.message || error));
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setStatus("importing");
      setErrorMessage("");

      await importCareerBackup(file, (text) => setProgressText(text));

      setStatus("success");
      onSuccessToast("Carreira carregada com sucesso! Recarregando sua área de trabalho...");
      
      setTimeout(() => {
        onReload();
        onClose();
      }, 1500);

    } catch (error: any) {
      console.error("Erro ao importar backup:", error);
      setStatus("error");
      setErrorMessage("Erro durante a importação: " + (error.message || error));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white rounded-3xl p-6 max-w-xl w-full border border-zinc-200 shadow-2xl space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-950 text-base">Transferir Carreira entre Computadores</h3>
              <p className="text-[11px] text-zinc-500">Mude de navegador ou dispositivo sem perder nenhum progresso.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={status === "exporting" || status === "importing"}
            className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 text-zinc-600 rounded-xl text-xs font-semibold transition"
          >
            Fechar
          </button>
        </div>

        {/* Informative Explanation */}
        <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-4 text-xs text-zinc-600 space-y-3 leading-relaxed">
          <div className="flex items-center gap-1.5 text-zinc-900 font-bold">
            <Shield className="w-4 h-4 text-amber-500 shrink-0" />
            Transferência Leve & Rápida de Carreira
          </div>
          <p>
            O backup exporta todas as suas configurações de carreira, histórico de lances/fatos, fotos e edições de revistas em um arquivo leve (.zip ou .json).
          </p>

          {/* Advice Warning Notice for Video Media */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-amber-900 flex items-start gap-2.5">
            <HardDrive className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-[11px]">
              <p className="font-bold text-amber-950">
                📹 Aviso Importante sobre Vídeos nos Lances:
              </p>
              <p className="leading-snug">
                Para manter o arquivo de backup super leve e rápido para download/transferência, <strong>as mídias de vídeo não são anexadas ao arquivo de exportação</strong>. Apenas as mídias de imagem, estatísticas e relatos textuais são exportados.
              </p>
              <p className="font-medium text-amber-800 underline decoration-amber-400">
                💡 Aconselhamos fazer o backup dos seus arquivos brutos de vídeo em um Pen Drive ou no seu armazenamento em nuvem (Google Drive, OneDrive ou Dropbox).
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic States */}
        {status === "idle" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Export Section */}
            <div className="border border-zinc-200 hover:border-amber-200 bg-white hover:bg-amber-50/10 rounded-2xl p-4 flex flex-col justify-between space-y-4 transition">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-sm text-zinc-900">
                  <Download className="w-4 h-4 text-amber-600 shrink-0" />
                  Passo 1: Exportar no PC Atual
                </div>
                <p className="text-[11px] text-zinc-500 leading-normal">
                  Gera um pacote (.zip) seguro contendo suas configurações, revistas e todas as mídias e gravações de vídeo sem estouro de memória.
                </p>
              </div>
              <button
                onClick={handleExport}
                className="w-full py-2.5 bg-zinc-950 hover:bg-zinc-900 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 hover:scale-[1.01] cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar Pacote (.zip)</span>
              </button>
            </div>

            {/* Import Section */}
            <div className="border border-zinc-200 hover:border-amber-200 bg-white hover:bg-amber-50/10 rounded-2xl p-4 flex flex-col justify-between space-y-4 transition">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-sm text-zinc-900">
                  <Upload className="w-4 h-4 text-amber-600 shrink-0" />
                  Passo 2: Importar no Outro PC
                </div>
                <p className="text-[11px] text-zinc-500 leading-normal">
                  No outro computador ou navegador, abra este aplicativo e selecione o arquivo baixado (.zip ou .json) para restaurar sua carreira.
                </p>
              </div>
              <label className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold cursor-pointer transition flex items-center justify-center gap-2 text-center hover:scale-[1.01]">
                <Upload className="w-3.5 h-3.5" />
                <span>Importar (.zip ou .json)</span>
                <input
                  type="file"
                  accept=".zip,.json,.fcbackup"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}

        {/* Loading / Action Statuses */}
        {(status === "exporting" || status === "importing") && (
          <div className="py-8 flex flex-col items-center justify-center space-y-4 text-center">
            <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
            <div className="space-y-1">
              <h4 className="font-bold text-zinc-900 text-sm">
                {status === "exporting" ? "Exportando sua Carreira..." : "Importando sua Carreira..."}
              </h4>
              <p className="text-xs text-zinc-500 max-w-sm animate-pulse">{progressText}</p>
            </div>
          </div>
        )}

        {status === "success" && (
          <div className="py-8 flex flex-col items-center justify-center space-y-3 text-center bg-green-50/50 border border-green-100 rounded-2xl">
            <div className="p-3 bg-green-500 text-white rounded-full">
              <Check className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-green-800 text-sm">Operação Concluída!</h4>
              <p className="text-xs text-zinc-500 max-w-sm">Seus dados foram sincronizados e atualizados localmente.</p>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="py-6 flex flex-col items-center justify-center space-y-3 text-center bg-red-50/50 border border-red-100 rounded-2xl">
            <AlertCircle className="w-10 h-10 text-red-500" />
            <div className="space-y-1 px-4">
              <h4 className="font-bold text-red-800 text-sm">Ocorreu um erro</h4>
              <p className="text-xs text-red-600 leading-normal">{errorMessage}</p>
            </div>
            <button
              onClick={() => setStatus("idle")}
              className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-semibold hover:bg-zinc-800 transition"
            >
              Tentar Novamente
            </button>
          </div>
        )}

        <div className="border-t border-zinc-100 pt-4 flex justify-between items-center text-[10px] text-zinc-400">
          <span>Siga La Pelota - Career Companion</span>
          <span>100% Livre de cookies rastreadores</span>
        </div>
      </motion.div>
    </div>
  );
}
