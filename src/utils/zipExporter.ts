import JSZip from "jszip";
import { Magazine, TimelineEntry, MediaType } from "../types";
import { JOURNALISTS } from "../types";

// Helper to compress/convert base64 images to clean binary blobs
async function base64ToBlob(base64Data: string): Promise<{ blob: Blob; ext: string }> {
  const parts = base64Data.split(";base64,");
  const contentType = parts[0].split(":")[1] || "image/jpeg";
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);
  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }
  const ext = contentType.split("/")[1] || "jpg";
  return {
    blob: new Blob([uInt8Array], { type: contentType }),
    ext
  };
}

// Simple markdown parser to clean HTML
function markdownToHtml(md: string, marginClass: string = "mb-3"): string {
  if (!md) return "";
  let html = md;
  // Replace headers
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-xs font-bold my-1 text-zinc-900 font-sans uppercase">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-sm font-black my-1 text-zinc-900 font-sans uppercase">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-base font-black my-2 text-zinc-900 font-sans uppercase">$1</h1>');
  // Bold & Italic
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // Paragraphs
  const blocks = html.split('\n\n');
  const processed = blocks.map(p => {
    const trimmed = p.trim();
    if (!trimmed) return "";
    if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || trimmed.startsWith('<li')) {
      return trimmed;
    }
    return `<p class="${marginClass} leading-relaxed font-serif text-justify text-zinc-800">${trimmed}</p>`;
  });
  return processed.filter(Boolean).join('\n');
}

function getDynamicFontStyles(text: string): { fontSize: string; dropCapSize: string; marginClass: string } {
  if (!text) {
    return { 
      fontSize: "font-size: 13px; line-height: 1.55;", 
      dropCapSize: "font-size: 38px; margin-top: 3px;", 
      marginClass: "mb-3" 
    };
  }
  const len = text.length;
  if (len > 2400) {
    return { 
      fontSize: "font-size: 9px; line-height: 1.35;", 
      dropCapSize: "font-size: 22px; margin-top: 0px;", 
      marginClass: "mb-1.5" 
    };
  } else if (len > 1800) {
    return { 
      fontSize: "font-size: 10px; line-height: 1.42;", 
      dropCapSize: "font-size: 26px; margin-top: 1px;", 
      marginClass: "mb-2" 
    };
  } else if (len > 1200) {
    return { 
      fontSize: "font-size: 11.5px; line-height: 1.48;", 
      dropCapSize: "font-size: 32px; margin-top: 2px;", 
      marginClass: "mb-2.5" 
    };
  }
  return { 
    fontSize: "font-size: 13px; line-height: 1.55;", 
    dropCapSize: "font-size: 38px; margin-top: 3px;", 
    marginClass: "mb-3" 
  };
}

// Extract drop cap (Capitular) structure for beautiful start
function renderDropCapHtml(text: string): string {
  if (!text) return "";
  const cleanText = text.replace(/^[\s\n\r]+/, "");
  const { fontSize, dropCapSize, marginClass } = getDynamicFontStyles(text);

  if (cleanText.startsWith("#") || cleanText.startsWith("*") || cleanText.startsWith(">")) {
    return `<div style="${fontSize}">${markdownToHtml(cleanText, marginClass)}</div>`;
  }
  const firstLetter = cleanText.charAt(0);
  const restOfText = cleanText.substring(1);

  return `
    <div class="drop-cap-wrapper" style="${fontSize}">
      <span class="drop-cap" style="${dropCapSize}">${firstLetter}</span>
      ${markdownToHtml(restOfText, marginClass)}
    </div>
  `;
}

export async function exportMagazineToZip(
  magazine: Magazine,
  timelineEntries: TimelineEntry[],
  onProgress?: (msg: string) => void,
  options?: { excludeLargeVideos?: boolean; largeVideoThresholdMB?: number }
): Promise<Blob> {
  const zip = new JSZip();
  const assetsFolder = zip.folder("assets")!;
  const journalist = JOURNALISTS.find((j) => j.id === magazine.journalistId) || JOURNALISTS[0];

  onProgress?.("Iniciando exportação...");

  // Fetch PageFlip browser script for standalone offline execution
  onProgress?.("Otimizando scripts para funcionamento offline...");
  let pageFlipJsContent = "";
  try {
    const res = await fetch("https://cdn.jsdelivr.net/npm/page-flip@2.0.7/dist/js/page-flip.browser.js");
    if (res.ok) {
      pageFlipJsContent = await res.text();
    }
  } catch (err) {
    console.warn("Could not fetch page-flip.browser.js for offline support, will fall back to online CDN link", err);
  }

  if (pageFlipJsContent) {
    assetsFolder.file("page-flip.browser.js", pageFlipJsContent);
  }

  // 1. Convert Cover Image
  let coverFilename = "";
  const rawCoverUrl = magazine.coverImageUrl || timelineEntries.find(e => e.mediaUrl)?.mediaUrl;
  if (rawCoverUrl && rawCoverUrl.startsWith("data:image/")) {
    try {
      onProgress?.("Processando imagem de capa...");
      const { blob, ext } = await base64ToBlob(rawCoverUrl);
      coverFilename = `assets/cover.${ext}`;
      assetsFolder.file(`cover.${ext}`, blob);
    } catch (err) {
      console.error("Failed to package cover image:", err);
    }
  }

  // 2. Process page media assets and map filenames
  const pagesHtmlList: string[] = [];
  
  for (let i = 0; i < magazine.pages.length; i++) {
    const page = magazine.pages[i];
    onProgress?.(`Processando mídias da página ${i + 1}...`);

    let pageImageFile = "";
    let pageVideoFile = "";
    let mediaType: MediaType = "image";

    // Find the timeline entry linked to this page
    let entry: TimelineEntry | undefined = undefined;
    if (page.suggestedEntryId) {
      entry = timelineEntries.find(e => e.id === page.suggestedEntryId);
    }
    if (!entry) {
      // Find entry by index if not explicitly linked
      const entriesWithMedia = timelineEntries.filter(e => e.mediaUrl || e.videoUrl);
      entry = entriesWithMedia[i] || timelineEntries.find(e => e.mediaUrl || e.videoUrl);
    }

    let pageExternalVideoUrl = "";

    if (entry) {
      mediaType = entry.mediaType || "image";

      // Check if entry has a web video URL (YouTube, Streamable, Vimeo, Imgur, direct MP4)
      if (entry.videoUrl && (entry.videoUrl.startsWith("http://") || entry.videoUrl.startsWith("https://"))) {
        pageExternalVideoUrl = entry.videoUrl;
      }

      // Save page image (either the image itself or video thumbnail)
      if (entry.mediaUrl && entry.mediaUrl.startsWith("data:image/")) {
        try {
          const { blob, ext } = await base64ToBlob(entry.mediaUrl);
          pageImageFile = `assets/page_${i}_media.${ext}`;
          assetsFolder.file(`page_${i}_media.${ext}`, blob);
        } catch (err) {
          console.error(`Error saving image for page ${i}:`, err);
        }
      }

      // Save video file if it exists locally
      if (mediaType === "video" && !pageExternalVideoUrl) {
        let videoBlob: Blob | null = null;
        if (entry.videoBlob) {
          videoBlob = entry.videoBlob;
        } else if (entry.videoUrl) {
          try {
            const res = await fetch(entry.videoUrl);
            videoBlob = await res.blob();
          } catch (err) {
            console.warn(`Could not fetch video URL directly for page ${i}:`, err);
          }
        }

        if (videoBlob) {
          const thresholdBytes = (options?.largeVideoThresholdMB || 95) * 1024 * 1024;
          const isTooLarge = videoBlob.size > thresholdBytes;

          if (options?.excludeLargeVideos && isTooLarge) {
            console.log(`Skipping large video assets/page_${i}_video.mp4 (${(videoBlob.size / (1024 * 1024)).toFixed(1)}MB) for GitHub optimization.`);
            // pageVideoFile remains empty so that the HTML falls back to the static pageImageFile (the extracted frame)
          } else {
            pageVideoFile = `assets/page_${i}_video.mp4`;
            assetsFolder.file(`page_${i}_video.mp4`, videoBlob);
          }
        }
      }
    }

    // Build the markup for this chronicle spread (Page idx text on left, Page idx visual on right)
    const textHtml = `
      <div class="page-item" data-page-num="${3 + i * 2}">
        <div class="page-header border-b">
          <div>
            <span class="kicker">REPORTE DE CAMPO</span>
            <h2 class="page-title">${page.title}</h2>
          </div>
          <span class="header-tag">MATÉRIA ${i + 1}</span>
        </div>
        <div class="page-content py-3">
          ${renderDropCapHtml(page.content)}
        </div>
        <div class="page-footer border-t">
          <span>SIGA LA PELOTA COMPANION</span>
          <span>PÁGINA ${3 + i * 2}</span>
        </div>
      </div>
    `;

    let visualInner = "";
    if (pageExternalVideoUrl) {
      if (pageExternalVideoUrl.includes("youtube.com") || pageExternalVideoUrl.includes("youtu.be")) {
        const ytId = pageExternalVideoUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1];
        visualInner = `<div class="video-container" style="height:100%;"><iframe src="https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0" style="width:100%;height:100%;border:0;" allowfullscreen></iframe></div>`;
      } else if (pageExternalVideoUrl.includes("streamable.com")) {
        const stId = pageExternalVideoUrl.match(/streamable\.com\/(?:e\/)?([a-zA-Z0-9]+)/)?.[1];
        visualInner = `<div class="video-container" style="height:100%;"><iframe src="https://streamable.com/e/${stId}?autoplay=1" style="width:100%;height:100%;border:0;" allowfullscreen></iframe></div>`;
      } else {
        let directUrl = pageExternalVideoUrl;
        if (directUrl.includes("imgur.com")) {
          directUrl = directUrl.replace(/\.gifv$/i, ".mp4");
          const imgurId = directUrl.match(/(?:imgur\.com\/(?:a\/|gallery\/|v\/)?|i\.imgur\.com\/)([a-zA-Z0-9]+)/)?.[1];
          if (imgurId && !/\.(mp4|webm)$/i.test(directUrl)) {
            directUrl = `https://i.imgur.com/${imgurId}.mp4`;
          }
        }
        visualInner = `
          <div class="video-container">
            <video src="${directUrl}" playsinline loop muted controls style="width:100%;height:100%;object-fit:contain;"></video>
            <div class="video-sound-badge">VÍDEO COM ÁUDIO 🔊</div>
          </div>
        `;
      }
    } else if (pageVideoFile) {
      const trimFragment = (entry?.videoStartTime !== undefined && entry?.videoEndTime !== undefined) 
        ? `#t=${entry.videoStartTime},${entry.videoEndTime}` 
        : "";
      visualInner = `
        <div class="video-container">
          <video src="${pageVideoFile}${trimFragment}" playsinline loop muted controls></video>
          <div class="video-sound-badge">VÍDEO COM ÁUDIO 🔊</div>
        </div>
      `;
    } else if (pageImageFile) {
      visualInner = `
        <div class="image-wrapper" onclick="openZoom('${pageImageFile}', '${page.title.replace(/'/g, "\\'")}', '${(page.caption || "").replace(/'/g, "\\'")}', 'image')">
          <img src="${pageImageFile}" alt="${page.title}">
          <div class="zoom-overlay">VER EM TELA CHEIA 🔍</div>
        </div>
      `;
    } else {
      visualInner = `
        <div class="empty-media">
          <span>📸 Registro de Campo</span>
        </div>
      `;
    }

    const visualHtml = `
      <div class="page-item" data-page-num="${4 + i * 2}">
        <div class="page-header border-b">
          <span class="kicker font-bold">REGISTRO ILUSTRADO</span>
          <span class="header-tag">PÁGINA ${4 + i * 2}</span>
        </div>
        <div class="page-content visual-content">
          <div class="media-box">
            ${visualInner}
            ${page.caption ? `<p class="media-caption">${page.caption}</p>` : ""}
          </div>
        </div>
        <div class="page-footer border-t">
          <span>SIGA LA PELOTA COMPANION</span>
          <span>PÁGINA ${4 + i * 2}</span>
        </div>
      </div>
    `;

    pagesHtmlList.push(textHtml);
    pagesHtmlList.push(visualHtml);
  }

  // 3. Build cover HTML
  const coverHtml = `
    <!-- Capa -->
    <div class="page-item --hard" data-density="hard">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(40,40,40,0.2)_0%,transparent_80%)] pointer-events-none" style="position: absolute; inset: 0; pointer-events: none; background: radial-gradient(circle at center, rgba(40,40,40,0.2) 0%, transparent 80%);"></div>
      
      <div class="cover-header relative z-10 border-b border-zinc-800 pb-3 flex items-center justify-between w-full" style="display: flex; width: 100%; border-bottom: 1px solid #27272a; padding-bottom: 12px; justify-content: space-between; align-items: center; position: relative; z-index: 10;">
        <div>
          <span class="text-sports-red font-bold tracking-widest text-[8px] font-mono block uppercase" style="color: var(--sports-red); font-size: 8px; font-family: monospace; font-weight: bold; letter-spacing: 0.1em; text-transform: uppercase;">EDIÇÃO ESPECIAL</span>
          <div class="text-sm font-black tracking-tighter uppercase font-sans mt-0.5 flex items-center gap-1 text-zinc-100" style="color: #f4f4f5; font-size: 14px; font-weight: 900; margin-top: 2px;">
            ⚽ <span class="text-amber-500 font-extrabold" style="color: var(--amber);">SIGA LA PELOTA</span>
          </div>
        </div>
        <div class="text-right">
          <span class="block text-[7px] font-mono text-zinc-500" style="font-size: 7px; color: #71717a; font-family: monospace; display: block;">AUTOR DA EDIÇÃO:</span>
          <span class="journalist-badge" style="display: inline-block; font-size: 10px; color: var(--amber); font-weight: bold; background-color: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2); padding: 2px 8px; border-radius: 4px; text-transform: uppercase; font-family: monospace;">${journalist.name}</span>
        </div>
      </div>

      <div class="cover-body relative z-10 flex flex-col gap-3 my-auto w-full" style="display: flex; flex-direction: column; align-items: center; gap: 12px; margin: auto 0; width: 100%; position: relative; z-index: 10;">
        <div class="space-y-1.5 text-center" style="text-align: center;">
          <span class="period-badge" style="display: inline-block; font-size: 10px; background-color: var(--amber); color: #09090b; padding: 3px 12px; border-radius: 99px; font-weight: 900; text-transform: uppercase; font-family: monospace;">🏆 ${magazine.period}</span>
          <h1 class="cover-title" style="font-size: 22px; font-weight: 900; text-transform: uppercase; line-height: 1.1; margin-top: 8px; color: white;">${magazine.title}</h1>
          <p class="cover-subtitle" style="font-family: 'Playfair Display', serif; font-style: italic; color: #d4d4d8; font-size: 13px; border-left: 2px solid var(--amber); padding-left: 8px; text-align: left; margin: 8px auto 0 auto; max-width: 90%;">"${magazine.subtitle}"</p>
        </div>

        ${coverFilename ? `
          <div class="cover-image-frame" onclick="openZoom('${coverFilename}', '${magazine.title.replace(/'/g, "\\'")}', 'Capa do Relatório', 'image')">
            <img src="${coverFilename}" alt="Destaque de Capa">
            <div class="zoom-text">🔍 Clique para zoom</div>
          </div>
        ` : `
          <div class="cover-logo-placeholder">⚽</div>
        `}
      </div>

      <div class="cover-footer relative z-10 border-t border-zinc-800 pt-3 flex justify-between items-center w-full text-zinc-500 text-[8px]" style="display: flex; justify-content: space-between; border-top: 1px solid #1f1f23; padding-top: 12px; font-size: 9px; color: #71717a; width: 100%; position: relative; z-index: 10;">
        <span class="font-mono tracking-wider uppercase" style="font-family: monospace;">© SIGA LA PELOTA COMPANION</span>
        <span class="footer-badge" style="background-color: rgba(218, 41, 28, 0.1); border: 1px solid rgba(218, 41, 28, 0.2); color: var(--sports-red); font-weight: bold; padding: 1px 6px; border-radius: 3px;">ANÁLISE REALISTA</span>
      </div>
    </div>
  `;

  // 4. Build editorial spread HTML
  const editorialSpreadHtml = `
    <!-- Editorial Column Left: Columnist Card -->
    <div class="page-item" data-page-num="1">
      <div class="page-header border-b">
        <div>
          <span class="kicker">OPINIÃO & CRÔNICA</span>
          <h2 class="page-title text-zinc-950">A VOZ DO CRONISTA</h2>
        </div>
        <span class="header-tag">SEÇÃO DO EDITOR</span>
      </div>
      <div class="page-content py-4 flex flex-col justify-center items-center text-center space-y-4" style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; margin: auto 0;">
        <div class="columnist-avatar">${journalist.avatar}</div>
        <div>
          <h3 class="columnist-name" style="font-size: 14px; font-weight: bold; color: var(--text-dark);">${journalist.name}</h3>
          <span class="columnist-title">Colunista Convidado</span>
        </div>
        <p class="columnist-bio" style="font-family: 'Playfair Display', serif; font-style: italic; color: #4b5563; font-size: 11px; line-height: 1.5;">"${journalist.bio}"</p>
        <div class="signature-box border-t" style="width: 100%; border-top: 1px solid #e4e4e7; padding-top: 8px; text-align: center;">
          <span class="signature-label" style="font-family: monospace; font-size: 8px; color: #a1a1aa; display: block;">ASSINATURA DO AUTOR</span>
          <span class="signature-name" style="font-family: 'Playfair Display', serif; font-style: italic; font-size: 14px; font-weight: bold; color: #374151; display: block; margin-top: 2px;">🖋️ ${journalist.name}</span>
        </div>
      </div>
      <div class="page-footer border-t">
        <span>EDIÇÃO DE COLECIONADOR</span>
        <span>PÁGINA 1</span>
      </div>
    </div>

    <!-- Editorial Column Right: Editorial Text -->
    <div class="page-item" data-page-num="2">
      <div class="page-header border-b">
        <span class="kicker font-bold text-sports-red">EDITORIAL EDITORIALIZADO</span>
        <span class="header-tag">PÁGINA 2</span>
      </div>
      <div class="page-content py-3">
        ${renderDropCapHtml(magazine.editorialText)}
      </div>
      <div class="page-footer border-t">
        <span>CRÔNICA DA SEMANA</span>
        <span>PÁGINA 2</span>
      </div>
    </div>
  `;

  // Total pages
  const totalPages = 4 + magazine.pages.length * 2;

  // 5. Generate index.html content
  const indexHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${magazine.title} - Edição de Colecionador</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-color: #09090b;
      --paper-color: #FAF6F0;
      --text-dark: #18181b;
      --sports-red: #da291c;
      --amber: #f59e0b;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: var(--bg-color);
      color: #f4f4f5;
      font-family: "Inter", sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      overflow-x: hidden;
    }

    /* Header Navigation bar */
    .top-bar {
      background-color: #18181b;
      border-bottom: 1px solid #27272a;
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 40;
    }

    .top-bar-left {
      display: flex;
      flex-direction: column;
    }

    .meta-period {
      font-size: 10px;
      font-family: "JetBrains Mono", monospace;
      color: var(--amber);
      font-weight: 900;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }

    .meta-title {
      font-size: 14px;
      font-weight: bold;
      color: #fafafa;
    }

    .top-bar-right {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .page-indicator {
      font-size: 12px;
      font-family: "JetBrains Mono", monospace;
      color: #a1a1aa;
    }

    /* Buttons */
    .btn {
      background-color: #27272a;
      color: #e4e4e7;
      border: 1px solid #3f3f46;
      padding: 6px 14px;
      font-size: 12px;
      font-weight: bold;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }

    .btn:hover:not(:disabled) {
      background-color: #3f3f46;
      border-color: #52525b;
    }

    .btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .btn-amber {
      background-color: var(--amber);
      color: #09090b;
      border-color: #fbbf24;
    }

    .btn-amber:hover {
      background-color: #fbbf24;
    }

    /* Main reader stage */
    .reader-stage {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      position: relative;
    }

    /* The Spreads Container */
    .book-wrapper {
      width: 100%;
      max-width: 960px;
      position: relative;
    }

    /* PageFlip book wrapper */
    #book {
      margin: 0 auto;
      box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.4);
      border-radius: 12px;
      background: #09090b;
      overflow: hidden;
      opacity: 0;
      transition: opacity 0.4s ease;
    }

    /* Book Page general style */
    .page-item {
      background-color: var(--paper-color);
      color: var(--text-dark);
      padding: 28px;
      width: 450px;
      height: 600px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
      position: relative;
      box-shadow: inset 0 0 30px rgba(0,0,0,0.03);
    }

    .page-item.--hard {
      background-color: #09090b;
      color: white;
      border: 1px solid #18181b;
      box-shadow: inset 0 0 50px rgba(0,0,0,0.6);
      padding: 36px;
    }

    /* Inner Page headers/footers */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-bottom: 8px;
      border-bottom: 1px solid #d4d4d8;
    }

    .kicker {
      font-size: 8px;
      font-family: "JetBrains Mono", monospace;
      letter-spacing: 0.12em;
      color: #71717a;
      text-transform: uppercase;
      font-weight: bold;
      display: block;
    }

    .page-title {
      font-size: 12px;
      font-weight: 900;
      color: var(--text-dark);
      text-transform: uppercase;
      margin-top: 2px;
    }

    .header-tag {
      font-family: "JetBrains Mono", monospace;
      font-size: 8px;
      color: #71717a;
    }

    /* Scrollable Page Content & Thin Scrollbar styles */
    .page-content {
      flex: 1;
      overflow-y: auto;
      margin: 12px 0;
      padding-right: 4px;
    }

    .page-content::-webkit-scrollbar {
      width: 5px;
    }
    .page-content::-webkit-scrollbar-track {
      background: transparent;
    }
    .page-content::-webkit-scrollbar-thumb {
      background-color: rgba(0,0,0,0.15);
      border-radius: 10px;
    }
    .page-content::-webkit-scrollbar-thumb:hover {
      background-color: rgba(0,0,0,0.3);
    }

    .page-footer {
      display: flex;
      justify-content: space-between;
      border-top: 1px solid #e4e4e7;
      padding-top: 8px;
      font-family: "JetBrains Mono", monospace;
      font-size: 8px;
      color: #a1a1aa;
    }

    /* Typographic details */
    .drop-cap-wrapper {
      text-align: justify;
    }

    .drop-cap {
      float: left;
      font-weight: bold;
      font-family: "Inter", sans-serif;
      color: var(--sports-red);
      line-height: 0.8;
      margin-right: 6px;
      user-select: none;
    }

    /* Columnist bio styles */
    .columnist-avatar {
      font-size: 40px;
      background-color: white;
      width: 54px;
      height: 54px;
      border-radius: 999px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03);
      border: 1px solid #e4e4e7;
    }

    .columnist-name {
      font-size: 14px;
      font-weight: bold;
      color: var(--text-dark);
    }

    .columnist-title {
      font-family: "JetBrains Mono", monospace;
      font-size: 8px;
      color: #71717a;
      text-transform: uppercase;
      display: block;
      margin-top: 2px;
    }

    .columnist-bio {
      font-family: "Playfair Display", serif;
      font-style: italic;
      color: #4b5563;
      font-size: 11px;
      line-height: 1.5;
    }

    /* Visual page containers */
    .media-box {
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 12px;
    }

    .image-wrapper {
      width: 100%;
      aspect-ratio: 16/9;
      background-color: #000;
      border-radius: 6px;
      overflow: hidden;
      border: 1px solid #e4e4e7;
      position: relative;
      cursor: pointer;
    }

    .image-wrapper img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      transition: transform 0.2s;
    }

    .image-wrapper:hover img {
      transform: scale(1.02);
    }

    .zoom-overlay {
      position: absolute;
      inset: 0;
      background-color: rgba(0,0,0,0.4);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.2s;
      font-size: 10px;
      font-weight: bold;
      letter-spacing: 0.05em;
    }

    .image-wrapper:hover .zoom-overlay {
      opacity: 1;
    }

    .video-container {
      width: 100%;
      aspect-ratio: 16/9;
      background-color: #000;
      border-radius: 6px;
      overflow: hidden;
      border: 1px solid #e4e4e7;
      position: relative;
    }

    .video-container video {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .video-sound-badge {
      position: absolute;
      top: 8px;
      right: 8px;
      background-color: rgba(0,0,0,0.7);
      color: #f59e0b;
      padding: 3px 8px;
      font-size: 8px;
      font-family: "JetBrains Mono", monospace;
      font-weight: bold;
      border-radius: 4px;
      pointer-events: none;
    }

    .media-caption {
      font-family: "Playfair Display", serif;
      font-style: italic;
      font-size: 10px;
      color: #6b7280;
      text-align: center;
      line-height: 1.4;
    }

    .empty-media {
      width: 100%;
      aspect-ratio: 16/9;
      background-color: #e4e4e7;
      border: 1px dashed #a1a1aa;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #71717a;
      font-family: "JetBrains Mono", monospace;
      font-size: 11px;
    }

    /* Quick control navigators at the bottom of the stage */
    .controls-panel {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      align-items: center;
      gap: 8px;
      margin-top: 16px;
      max-width: 90%;
    }

    /* Modal for zoom frame */
    .zoom-modal {
      display: none;
      position: fixed;
      inset: 0;
      background-color: rgba(0,0,0,0.9);
      z-index: 50;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }

    .zoom-modal.active {
      display: flex;
    }

    .zoom-box {
      width: 100%;
      max-width: 800px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      position: relative;
    }

    .zoom-close {
      position: absolute;
      top: -36px;
      right: 0;
      background-color: rgba(255,255,255,0.15);
      border: none;
      color: white;
      width: 28px;
      height: 28px;
      border-radius: 999px;
      font-size: 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }

    .zoom-close:hover {
      background-color: rgba(255,255,255,0.3);
    }

    .zoom-content {
      width: 100%;
      background-color: #121214;
      border: 1px solid #27272a;
      border-radius: 12px;
      overflow: hidden;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .zoom-media-asset {
      max-width: 100%;
      max-height: 70vh;
      object-fit: contain;
    }

    .zoom-caption-box {
      text-align: center;
    }

    .zoom-title {
      font-weight: bold;
      color: white;
      font-size: 14px;
    }

    .zoom-desc {
      font-family: "Playfair Display", serif;
      font-style: italic;
      color: #a1a1aa;
      font-size: 11px;
      margin-top: 4px;
    }

    /* Help floating block */
    .help-tooltip {
      margin-top: 12px;
      font-size: 10px;
      color: #71717a;
      font-family: "JetBrains Mono", monospace;
    }

    @keyframes pulse {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 0.9; }
    }

    /* Print media rules to prevent cutoff on paper */
    @media print {
      body, .reader-stage {
        background: white !important;
        color: black !important;
      }
      .top-bar, .controls-panel, .help-tooltip {
        display: none !important;
      }
      #book {
        display: block !important;
        opacity: 1 !important;
        box-shadow: none !important;
        width: auto !important;
        height: auto !important;
        background: transparent !important;
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
        padding: 24px 0 !important;
        overflow: visible !important;
      }
      .page-item.--hard {
        background: white !important;
        color: black !important;
        border: none !important;
        box-shadow: none !important;
      }
      .page-content {
        overflow: visible !important;
        height: auto !important;
      }
      video, .video-container {
        display: none !important;
      }
    }
  </style>
</head>
<body>

  <!-- Top bar -->
  <header class="top-bar">
    <div class="top-bar-left">
      <span class="meta-period">${magazine.period.toUpperCase()}</span>
      <h1 class="meta-title">${magazine.title}</h1>
    </div>
    <div class="top-bar-right">
      <span class="page-indicator" id="page-indicator">CARREGANDO...</span>
      <button class="btn" id="prev-btn" onclick="prevSpread()" disabled>
        ◀ Anterior
      </button>
      <button class="btn btn-amber" id="next-btn" onclick="nextSpread()">
        Próximo ▶
      </button>
    </div>
  </header>

  <!-- Reader Stage -->
  <main class="reader-stage">
    <div class="book-wrapper">
      <div id="book">
        
        ${coverHtml}
        
        ${editorialSpreadHtml}
        
        ${pagesHtmlList.join("\n")}
        
      </div>
    </div>

    <!-- Quick navigation buttons -->
    <div class="controls-panel">
      <button class="btn" onclick="goToPage(0)">Capa</button>
      <button class="btn" onclick="goToPage(1)">Editorial</button>
      ${magazine.pages.map((_, pIdx) => `
        <button class="btn" onclick="goToPage(${3 + pIdx * 2})">Mát. ${pIdx + 1}</button>
      `).join("")}
    </div>

    <div class="help-tooltip">
      💡 Use as setas do teclado (Esquerda / Direita) ou arraste com o mouse para folhear as páginas.
    </div>
  </main>

  <!-- Zoom Frame Modal -->
  <div class="zoom-modal" id="zoom-modal" onclick="closeZoom()">
    <div class="zoom-box" onclick="event.stopPropagation()">
      <button class="zoom-close" onclick="closeZoom()">✕</button>
      <div class="zoom-content" id="zoom-content">
        <!-- Rendered dynamically -->
      </div>
      <div class="zoom-caption-box">
        <div class="zoom-title" id="zoom-title">Título do Frame</div>
        <div class="zoom-desc" id="zoom-desc">Legenda do frame selecionado</div>
      </div>
    </div>
  </div>

  <!-- Load PageFlip browser bundle (local first, fallback to CDN if not available) -->
  <script src="assets/page-flip.browser.js"></script>
  <script>
    if (typeof St === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/page-flip@2.0.7/dist/js/page-flip.browser.js';
      document.head.appendChild(script);
    }
  </script>
  <script>
    let pageFlip = null;
    const totalPages = ${totalPages};
    
    function initBook() {
      try {
        const bookEl = document.getElementById("book");
        pageFlip = new St.PageFlip(bookEl, {
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
          mobileScrollSupport: true
        });

        pageFlip.loadFromHTML(document.querySelectorAll(".page-item"));
        
        // Show book container beautifully once initialized
        bookEl.style.opacity = "1";

        pageFlip.on("flip", (e) => {
          updateUI(e.data);
        });

        updateUI(0);
      } catch (err) {
        console.error("Erro ao inicializar PageFlip:", err);
        // Fallback to simpler scrolling list layout if CDN fails or user offline
        const bookEl = document.getElementById("book");
        if (bookEl) {
          bookEl.style.opacity = "1";
          bookEl.style.display = "flex";
          bookEl.style.flexDirection = "column";
          bookEl.style.gap = "24px";
          bookEl.style.maxWidth = "500px";
        }
        document.getElementById("page-indicator").textContent = "MODO DE COMPATIBILIDADE";
      }
    }

    function updateUI(currentPage) {
      const indicator = document.getElementById("page-indicator");
      if (currentPage === 0) {
        indicator.textContent = "CAPA";
      } else if (currentPage === totalPages - 1) {
        indicator.textContent = "FIM";
      } else {
        indicator.textContent = "PÁGINA " + currentPage + " / " + (totalPages - 2);
      }

      document.getElementById("prev-btn").disabled = currentPage === 0;
      document.getElementById("next-btn").disabled = currentPage === totalPages - 1;

      // Handle video autoplay for the currently visible page
      const pageItems = document.querySelectorAll(".page-item");
      pageItems.forEach((item, idx) => {
        const video = item.querySelector("video");
        if (video) {
          const isCurrentVisible = idx === currentPage || 
            (pageFlip && pageFlip.getOrientation() === "landscape" && (idx === currentPage || idx === currentPage + 1));
          
          if (isCurrentVisible) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        }
      });
    }

    function nextSpread() {
      if (pageFlip) pageFlip.flipNext();
    }

    function prevSpread() {
      if (pageFlip) pageFlip.flipPrev();
    }

    function goToPage(idx) {
      if (pageFlip) pageFlip.turnToPage(idx);
    }

    // Keyboard bindings
    window.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") nextSpread();
      if (e.key === "ArrowLeft") prevSpread();
      if (e.key === "Escape") closeZoom();
    });

    // Zoom Frame Controllers
    function openZoom(src, title, caption, type) {
      const modal = document.getElementById("zoom-modal");
      const content = document.getElementById("zoom-content");
      
      document.getElementById("zoom-title").textContent = title || "";
      document.getElementById("zoom-desc").textContent = caption || "";
      
      if (type === 'image') {
        content.innerHTML = '<img class="zoom-media-asset" src="' + src + '" alt="Zoomed image">';
      }
      
      modal.classList.add("active");
    }

    function closeZoom() {
      document.getElementById("zoom-modal").classList.remove("active");
    }

    // Initialize PageFlip on load
    window.addEventListener("DOMContentLoaded", initBook);

    // Play videos on first click for gesture requirements
    document.addEventListener("click", () => {
      if (pageFlip) {
        const activePage = pageFlip.getCurrentPageIndex();
        const activeItem = document.querySelectorAll(".page-item")[activePage];
        if (activeItem) {
          const video = activeItem.querySelector("video");
          if (video && video.paused) {
            video.play().catch(() => {});
          }
        }
      }
    }, { once: true });
  </script>
</body>
</html>
`;

  onProgress?.("Empacotando arquivos no ZIP...");
  zip.file("index.html", indexHtml);

  const content = await zip.generateAsync({ type: "blob" });
  onProgress?.("Pronto!");
  return content;
}
