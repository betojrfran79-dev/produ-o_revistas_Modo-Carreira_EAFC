import JSZip from "jszip";
import { CareerSettings, TimelineEntry, Magazine } from "../types";
import { getSettings, getTimelineEntries, getMagazines, saveSettings, addTimelineEntry, saveMagazine } from "./db";

// Helper to convert base64 to Blob (for legacy JSON imports)
export function base64ToBlob(base64: string): Blob {
  const arr = base64.split(",");
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "video/mp4";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Exports career backup without video media files (only facts, settings, magazines, and image media).
 */
export async function exportCareerBackup(onProgress?: (text: string) => void): Promise<{ blob: Blob; filename: string }> {
  onProgress?.("Acessando banco de dados local...");

  const settings = await getSettings();
  const timelineEntries = await getTimelineEntries();
  const magazines = await getMagazines();

  onProgress?.("Empacotando fatos, estatísticas, fotos e revistas...");

  const zip = new JSZip();

  // Process timeline entries: EXCLUDE local video blobs/files to keep backup lightweight
  const processedTimeline = timelineEntries.map((entry) => {
    const entryCopy = { ...entry };

    // Strip out heavy local video binary blobs and session blob URLs
    delete (entryCopy as any).videoBlob;
    delete (entryCopy as any).videoRefPath;

    if (entryCopy.videoUrl && (entryCopy.videoUrl.startsWith("blob:") || entryCopy.videoUrl.startsWith("data:video"))) {
      delete (entryCopy as any).videoUrl;
    }

    return entryCopy;
  });

  // Strip videos from magazine pages if local blob
  const processedMagazines = magazines.map((mag) => {
    const magCopy = { ...mag };
    if (magCopy.pages) {
      magCopy.pages = magCopy.pages.map((page) => {
        const pageCopy = { ...page };
        if (pageCopy.videoUrl && (pageCopy.videoUrl.startsWith("blob:") || pageCopy.videoUrl.startsWith("data:video"))) {
          delete (pageCopy as any).videoUrl;
        }
        return pageCopy;
      });
    }
    return magCopy;
  });

  const backupData = {
    appIdentifier: "EA_FC_CAREER_COMPANION_BACKUP",
    version: "2.5",
    exportedAt: Date.now(),
    videoExcluded: true, // Flag indicating videos were excluded by user design
    settings,
    timeline: processedTimeline,
    magazines: processedMagazines,
  };

  onProgress?.("Gerando arquivo de backup leve...");
  const jsonString = JSON.stringify(backupData, null, 2);
  zip.file("backup_data.json", jsonString);

  onProgress?.("Compactando pacote (.zip)...");
  const zipBlob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  const dateStr = new Date().toISOString().split("T")[0];
  const teamSanitized = settings?.teamName ? settings.teamName.replace(/[^a-zA-Z0-9]/g, "_") : "carreira";
  const filename = `backup_fc_career_${teamSanitized}_${dateStr}.zip`;

  return { blob: zipBlob, filename };
}

/**
 * Imports a career backup file (.zip or .json)
 */
export async function importCareerBackup(file: File, onProgress?: (text: string) => void): Promise<CareerSettings | null> {
  onProgress?.("Lendo arquivo de transferência...");

  let backupData: any = null;
  let zipArchive: JSZip | null = null;

  const isZip = file.name.endsWith(".zip") || file.name.endsWith(".fcbackup") || file.type.includes("zip");

  if (isZip) {
    onProgress?.("Descompactando pacote de backup (.zip)...");
    zipArchive = await JSZip.loadAsync(file);

    const jsonFile = zipArchive.file("backup_data.json") || zipArchive.file("data.json");
    if (!jsonFile) {
      throw new Error("O arquivo ZIP selecionado não possui um arquivo de backup válido ('backup_data.json').");
    }

    const jsonText = await jsonFile.async("string");
    backupData = JSON.parse(jsonText);
  } else {
    // JSON file
    const fileText = await file.text();
    backupData = JSON.parse(fileText);
  }

  if (backupData.appIdentifier !== "EA_FC_CAREER_COMPANION_BACKUP") {
    throw new Error("Este arquivo não é um backup de carreira válido ou está corrompido.");
  }

  onProgress?.("Restaurando configurações da carreira...");
  let restoredSettings: CareerSettings | null = null;
  if (backupData.settings) {
    await saveSettings(backupData.settings);
    restoredSettings = backupData.settings;
  }

  onProgress?.("Restaurando histórico e fatos da linha do tempo...");
  if (Array.isArray(backupData.timeline)) {
    for (const entry of backupData.timeline) {
      const entryToSave = { ...entry } as TimelineEntry;

      // Legacy zip support for video blobs if present in older backups
      if (entry.videoRefPath && zipArchive && zipArchive.file(entry.videoRefPath)) {
        try {
          const videoFile = zipArchive.file(entry.videoRefPath);
          if (videoFile) {
            const blob = await videoFile.async("blob");
            entryToSave.videoBlob = blob;
            entryToSave.videoUrl = URL.createObjectURL(blob);
          }
        } catch (err) {
          console.warn("Falha ao extrair vídeo legado do zip:", err);
        }
      } else if (entry.videoUrl && entry.videoUrl.startsWith("data:")) {
        try {
          const blob = base64ToBlob(entry.videoUrl);
          entryToSave.videoBlob = blob;
          entryToSave.videoUrl = URL.createObjectURL(blob);
        } catch (err) {
          console.warn("Falha ao reconstruir vídeo base64 legado:", err);
        }
      }

      await addTimelineEntry(entryToSave);
    }
  }

  onProgress?.("Importando edições das revistas digitais...");
  if (Array.isArray(backupData.magazines)) {
    for (const mag of backupData.magazines) {
      await saveMagazine(mag);
    }
  }

  return restoredSettings;
}
