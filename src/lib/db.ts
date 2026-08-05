import { CareerSettings, TimelineEntry, Magazine, MediaType } from "../types";
import { initFirebase } from "./firebase";
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs, writeBatch } from "firebase/firestore";

const DB_NAME = "FCCareerCompanionDB";
const DB_VERSION = 1;

export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error("Falha ao abrir o banco de dados local."));
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("timeline")) {
        db.createObjectStore("timeline", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("magazines")) {
        db.createObjectStore("magazines", { keyPath: "id" });
      }
    };
  });
}

// Global state to hold Firebase reference once loaded
let fbAuth: any = null;
let fbDb: any = null;
let fbUser: any = null;
let isFirebaseReady = false;

// Initialize Firebase link
export async function setupFirebaseSync(): Promise<{ status: "connected" | "offline"; syncedItemsCount: number }> {
  try {
    const { auth, db, user } = await initFirebase();
    if (auth && db && user) {
      fbAuth = auth;
      fbDb = db;
      fbUser = user;
      isFirebaseReady = true;

      // Run automatic initial sync
      const syncedItemsCount = await runInitialSync();
      return { status: "connected", syncedItemsCount };
    }
  } catch (error) {
    console.warn("Failed to set up Firebase sync, staying in offline-local mode:", error);
  }
  return { status: "offline", syncedItemsCount: 0 };
}

// Initial Sync Logic:
// If Firestore contains data, download and populate local IndexedDB (restoring account).
// If Firestore is empty but local has data, upload local data to Firestore (backup).
async function runInitialSync(): Promise<number> {
  if (!isFirebaseReady || !fbUser) return 0;
  const userId = fbUser.uid;

  // 1. Get Firestore settings
  const settingsDocRef = doc(fbDb, "users", userId, "settings", "current_career");
  const settingsSnap = await getDoc(settingsDocRef);
  const firestoreHasData = settingsSnap.exists();

  const localSettings = await getSettings();
  const localTimeline = await getTimelineEntries();
  const localMagazines = await getMagazines();

  let syncedCount = 0;

  if (firestoreHasData) {
    console.log("Firebase sync: Firestore has existing data. Restoring local database...");
    
    // Download settings
    const remoteSettings = settingsSnap.data() as CareerSettings;
    await saveSettingsLocally(remoteSettings);
    syncedCount++;

    // Map existing local video blobs so they aren't destroyed on restore
    const localEntries = await getTimelineEntries();
    const localVideoBlobs = new Map<string, Blob>();
    for (const entry of localEntries) {
      if (entry.videoBlob) {
        localVideoBlobs.set(entry.id, entry.videoBlob);
      }
    }

    // Download timeline entries
    const timelineColRef = collection(fbDb, "users", userId, "timeline");
    const timelineSnap = await getDocs(timelineColRef);
    const db = await initDB();
    
    // Clear local timeline first to prevent orphans
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("timeline", "readwrite");
      tx.objectStore("timeline").clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject();
    });

    for (const d of timelineSnap.docs) {
      const entry = d.data() as TimelineEntry;
      // Preserve existing local videoBlob if it existed
      if (localVideoBlobs.has(entry.id)) {
        entry.videoBlob = localVideoBlobs.get(entry.id);
      }
      await addTimelineEntryLocally(entry);
      syncedCount++;
    }

    // Download magazines
    const magazinesColRef = collection(fbDb, "users", userId, "magazines");
    const magazinesSnap = await getDocs(magazinesColRef);
    
    // Clear local magazines first
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("magazines", "readwrite");
      tx.objectStore("magazines").clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject();
    });

    for (const d of magazinesSnap.docs) {
      const mag = d.data() as Magazine;
      await saveMagazineLocally(mag);
      syncedCount++;
    }

    console.log(`Firebase sync complete. Restored ${syncedCount} items locally.`);
  } else if (localSettings || localTimeline.length > 0 || localMagazines.length > 0) {
    console.log("Firebase sync: Firestore is empty, but local IndexedDB contains data. Backing up to Firestore...");
    
    const batch = writeBatch(fbDb);

    if (localSettings) {
      const cleanedSettings = cleanForFirestore(localSettings);
      batch.set(doc(fbDb, "users", userId, "settings", "current_career"), cleanedSettings);
      syncedCount++;
    }

    for (const entry of localTimeline) {
      const firestoreEntry = { ...entry };
      if (firestoreEntry.videoUrl && firestoreEntry.videoUrl.length > 500000) {
        delete firestoreEntry.videoUrl;
      }
      if ('videoBlob' in firestoreEntry) {
        delete firestoreEntry.videoBlob;
      }
      const cleanedEntry = cleanForFirestore(firestoreEntry);
      batch.set(doc(fbDb, "users", userId, "timeline", entry.id), cleanedEntry);
      syncedCount++;
    }

    for (const mag of localMagazines) {
      const cleanedMag = cleanForFirestore(mag);
      batch.set(doc(fbDb, "users", userId, "magazines", mag.id), cleanedMag);
      syncedCount++;
    }

    await batch.commit();
    console.log(`Firebase backup complete. Backed up ${syncedCount} items to the cloud.`);
  }

  return syncedCount;
}

// --- LOCAL ACCESS IMPLEMENTATIONS ---

async function saveSettingsLocally(settings: CareerSettings): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction("settings", "readwrite");
      const store = transaction.objectStore("settings");
      const request = store.put({ id: "current_career", ...settings });

      request.onsuccess = () => resolve();
      request.onerror = (e) => {
        console.error("IndexedDB settings save error:", request.error);
        reject(new Error("Falha ao salvar as configurações localmente: " + (request.error?.message || "Erro desconhecido")));
      };
    } catch (err: any) {
      console.error("IndexedDB settings transaction exception:", err);
      reject(err);
    }
  });
}

// Helper to check if an object is a Blob or File, using duck typing to prevent realm-mismatch issues in sandboxed iframe contexts
function isBlobOrFile(obj: any): boolean {
  if (!obj || typeof obj !== "object") return false;
  return (
    obj instanceof Blob ||
    obj instanceof File ||
    (typeof obj.size === "number" &&
     typeof obj.type === "string" &&
     typeof obj.slice === "function")
  );
}

// Helper to recursively strip undefined properties and non-serializable objects (like Blobs) for Firestore
function cleanForFirestore(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (isBlobOrFile(obj)) return null; // never write raw files to Firestore
  
  if (Array.isArray(obj)) {
    return obj.map(cleanForFirestore).filter(v => v !== null && v !== undefined);
  }
  
  if (typeof obj === "object" && !(obj instanceof Date)) {
    const cleaned: any = {};
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (val !== undefined && val !== null) {
        const cleanedVal = cleanForFirestore(val);
        if (cleanedVal !== null && cleanedVal !== undefined) {
          cleaned[key] = cleanedVal;
        }
      }
    }
    return cleaned;
  }
  
  return obj;
}

// Helpers to serialize and deserialize videoBlob for IndexedDB to prevent DataCloneError inside iframe contexts
async function serializeEntryForIndexedDB(entry: TimelineEntry): Promise<any> {
  const serialized = { ...entry };
  
  // Strip out undefined properties so IndexedDB stays clean
  for (const key of Object.keys(serialized)) {
    if (serialized[key as keyof TimelineEntry] === undefined) {
      delete serialized[key as keyof TimelineEntry];
    }
  }

  if (isBlobOrFile(entry.videoBlob)) {
    try {
      const arrayBuffer = await entry.videoBlob!.arrayBuffer();
      (serialized as any).videoArrayBuffer = arrayBuffer;
      (serialized as any).videoMimeType = entry.videoBlob!.type;
      delete serialized.videoBlob;
    } catch (err) {
      console.warn("Failed to convert videoBlob to ArrayBuffer for IndexedDB:", err);
    }
  }
  return serialized;
}

function deserializeEntryFromIndexedDB(entry: any): TimelineEntry {
  if (entry && entry.videoArrayBuffer && entry.videoMimeType) {
    try {
      entry.videoBlob = new Blob([entry.videoArrayBuffer], { type: entry.videoMimeType });
      delete entry.videoArrayBuffer;
      delete entry.videoMimeType;
    } catch (err) {
      console.error("Failed to reconstruct videoBlob from ArrayBuffer:", err);
    }
  }
  return entry as TimelineEntry;
}

async function addTimelineEntryLocally(entry: TimelineEntry): Promise<void> {
  const db = await initDB();
  const serialized = await serializeEntryForIndexedDB(entry);
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction("timeline", "readwrite");
      const store = transaction.objectStore("timeline");
      const request = store.put(serialized);

      request.onsuccess = () => resolve();
      request.onerror = (e) => {
        console.error("IndexedDB timeline save error:", request.error);
        reject(new Error("Falha ao salvar linha do tempo localmente: " + (request.error?.message || "Erro desconhecido")));
      };
    } catch (err: any) {
      console.error("IndexedDB timeline transaction exception:", err);
      reject(err);
    }
  });
}

async function saveMagazineLocally(magazine: Magazine): Promise<void> {
  const db = await initDB();
  const cleaned = cleanForFirestore(magazine); // Ensure clean serializable object for safety
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction("magazines", "readwrite");
      const store = transaction.objectStore("magazines");
      const request = store.put(cleaned);

      request.onsuccess = () => resolve();
      request.onerror = (e) => {
        console.error("IndexedDB magazine save error:", request.error);
        reject(new Error("Falha ao salvar revista localmente: " + (request.error?.message || "Erro desconhecido")));
      };
    } catch (err: any) {
      console.error("IndexedDB magazine transaction exception:", err);
      reject(err);
    }
  });
}

// --- PUBLIC DATABASE API (COMBINED LOCAL + FIREBASE) ---

export async function saveSettings(settings: CareerSettings): Promise<void> {
  // Always write locally first for immediate responsiveness
  await saveSettingsLocally(settings);

  // If Firebase is authenticated, also write to Firestore
  if (isFirebaseReady && fbUser && fbDb) {
    try {
      const docRef = doc(fbDb, "users", fbUser.uid, "settings", "current_career");
      const cleaned = cleanForFirestore(settings);
      await setDoc(docRef, cleaned);
      console.log("Settings backed up to Firebase.");
    } catch (e) {
      console.warn("Failed to write settings to Firebase, will retry on next sync:", e);
    }
  }
}

export async function getSettings(): Promise<CareerSettings | null> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("settings", "readonly");
    const store = transaction.objectStore("settings");
    const request = store.get("current_career");

    request.onsuccess = () => {
      resolve(request.result || null);
    };
    request.onerror = () => reject(new Error("Falha ao recuperar as configurações da carreira."));
  });
}

export async function addTimelineEntry(entry: TimelineEntry): Promise<void> {
  await addTimelineEntryLocally(entry);

  if (isFirebaseReady && fbUser && fbDb) {
    try {
      const docRef = doc(fbDb, "users", fbUser.uid, "timeline", entry.id);
      
      // Clean up the entry before saving to Firestore to avoid size limit exceptions!
      const firestoreEntry = { ...entry };
      if (firestoreEntry.videoUrl && firestoreEntry.videoUrl.length > 500000) {
        // Strip out heavy video payload from Firestore doc, the client plays it locally or uses the thumbnail
        delete firestoreEntry.videoUrl;
      }
      
      const cleaned = cleanForFirestore(firestoreEntry);
      
      await setDoc(docRef, cleaned);
      console.log("Timeline entry backed up to Firebase.");
    } catch (e) {
      console.warn("Failed to write timeline entry to Firebase:", e);
    }
  }
}

export async function deleteTimelineEntry(id: string): Promise<void> {
  const db = await initDB();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction("timeline", "readwrite");
    const store = transaction.objectStore("timeline");
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error("Falha ao remover o registro localmente."));
  });

  if (isFirebaseReady && fbUser && fbDb) {
    try {
      const docRef = doc(fbDb, "users", fbUser.uid, "timeline", id);
      await deleteDoc(docRef);
      console.log("Timeline entry deleted from Firebase.");
    } catch (e) {
      console.warn("Failed to delete timeline entry from Firebase:", e);
    }
  }
}

export async function getTimelineEntries(): Promise<TimelineEntry[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("timeline", "readonly");
    const store = transaction.objectStore("timeline");
    const request = store.getAll();

    request.onsuccess = () => {
      const results = request.result || [];
      const deserialized = results.map(deserializeEntryFromIndexedDB);
      resolve(deserialized);
    };
    request.onerror = () => reject(new Error("Falha ao recuperar a linha do tempo."));
  });
}

export async function saveMagazine(magazine: Magazine): Promise<void> {
  await saveMagazineLocally(magazine);

  if (isFirebaseReady && fbUser && fbDb) {
    try {
      const docRef = doc(fbDb, "users", fbUser.uid, "magazines", magazine.id);
      await setDoc(docRef, magazine);
      console.log("Magazine backed up to Firebase.");
    } catch (e) {
      console.warn("Failed to write magazine to Firebase:", e);
    }
  }
}

export async function getMagazines(): Promise<Magazine[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("magazines", "readonly");
    const store = transaction.objectStore("magazines");
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result || []);
    };
    request.onerror = () => reject(new Error("Falha ao recuperar as revistas digitais."));
  });
}

export async function deleteMagazine(id: string): Promise<void> {
  const db = await initDB();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction("magazines", "readwrite");
    const store = transaction.objectStore("magazines");
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error("Falha ao remover a revista digital localmente."));
  });

  if (isFirebaseReady && fbUser && fbDb) {
    try {
      const docRef = doc(fbDb, "users", fbUser.uid, "magazines", id);
      await deleteDoc(docRef);
      console.log("Magazine deleted from Firebase.");
    } catch (e) {
      console.warn("Failed to delete magazine from Firebase:", e);
    }
  }
}

export async function clearAllDB(): Promise<void> {
  const db = await initDB();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(["settings", "timeline", "magazines"], "readwrite");
    
    transaction.objectStore("settings").clear();
    transaction.objectStore("timeline").clear();
    transaction.objectStore("magazines").clear();

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(new Error("Falha ao reiniciar o banco de dados local."));
  });

  if (isFirebaseReady && fbUser && fbDb) {
    try {
      // Clear Firestore collections
      const settingsDocRef = doc(fbDb, "users", fbUser.uid, "settings", "current_career");
      await deleteDoc(settingsDocRef);

      const timelineColRef = collection(fbDb, "users", fbUser.uid, "timeline");
      const timelineSnap = await getDocs(timelineColRef);
      for (const d of timelineSnap.docs) {
        await deleteDoc(doc(fbDb, "users", fbUser.uid, "timeline", d.id));
      }

      const magazinesColRef = collection(fbDb, "users", fbUser.uid, "magazines");
      const magazinesSnap = await getDocs(magazinesColRef);
      for (const d of magazinesSnap.docs) {
        await deleteDoc(doc(fbDb, "users", fbUser.uid, "magazines", d.id));
      }

      console.log("Firebase storage wiped successfully.");
    } catch (e) {
      console.warn("Failed to wipe Firebase storage:", e);
    }
  }
}

// Compress base64 image on the fly to fit within Firestore limits (10MB)
export async function compressBase64Image(base64: string, maxWidth = 600, quality = 0.5): Promise<string> {
  if (!base64 || !base64.startsWith("data:image/")) return base64;
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(base64);
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      const compressed = canvas.toDataURL("image/jpeg", quality);
      resolve(compressed);
    };
    img.onerror = () => {
      resolve(base64);
    };
  });
}

export async function shareMagazine(magazine: Magazine, timelineEntries: TimelineEntry[]): Promise<string> {
  if (!isFirebaseReady || !fbDb) {
    const { db } = await initFirebase();
    if (db) {
      fbDb = db;
      isFirebaseReady = true;
    } else {
      throw new Error("O Firebase não pôde ser inicializado. Certifique-se de estar conectado à internet.");
    }
  }

  // Map each page to pre-embed its media
  const pagesWithMedia = await Promise.all(magazine.pages.map(async (page, idx) => {
    let mediaUrl: string | null = page.mediaUrl || null;
    let mediaType: MediaType = page.mediaType || 'image';
    let galleryUrls: string[] | undefined = page.galleryUrls;
    let htmlCode: string | undefined = page.htmlCode;
    let videoUrl: string | null = page.videoUrl || null;
    let videoStartTime: number | undefined = page.videoStartTime;
    let videoEndTime: number | undefined = page.videoEndTime;

    if (page.suggestedEntryId) {
      const entry = timelineEntries.find(e => e.id === page.suggestedEntryId);
      if (entry) {
        if (!mediaUrl && entry.mediaUrl) mediaUrl = entry.mediaUrl;
        if (!page.mediaType && entry.mediaType) mediaType = entry.mediaType;
        if (!galleryUrls && entry.galleryUrls) galleryUrls = entry.galleryUrls;
        if (!htmlCode && entry.htmlCode) htmlCode = entry.htmlCode;
        if (!videoUrl && entry.videoUrl) videoUrl = entry.videoUrl;
        if (videoStartTime === undefined) videoStartTime = entry.videoStartTime;
        if (videoEndTime === undefined) videoEndTime = entry.videoEndTime;
      }
    }

    if (!mediaUrl && !videoUrl && !galleryUrls && !htmlCode) {
      const entriesWithMedia = timelineEntries.filter(e => e.mediaUrl || e.videoUrl || (e.galleryUrls && e.galleryUrls.length > 0) || e.htmlCode);
      if (entriesWithMedia[idx]) {
        const item = entriesWithMedia[idx];
        mediaUrl = item.mediaUrl || null;
        mediaType = item.mediaType || 'image';
        galleryUrls = item.galleryUrls;
        htmlCode = item.htmlCode;
        videoUrl = item.videoUrl || null;
        videoStartTime = item.videoStartTime;
        videoEndTime = item.videoEndTime;
      }
    }

    // Preserve video URL if available (web links or session blob for local preview)
    let finalVideoUrl: string | null = videoUrl;
    if (finalVideoUrl && finalVideoUrl.startsWith("blob:")) {
      finalVideoUrl = null;
    }
    if (!finalVideoUrl && mediaUrl && (mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://'))) {
      if (mediaType === 'video' || /youtube\.com|youtu\.be|streamable\.com|vimeo\.com|imgur\.com|\.mp4|\.webm|\.mov|\.m4v|\.gifv/i.test(mediaUrl)) {
        finalVideoUrl = mediaUrl;
      }
    }

    let compressedGallery: string[] | undefined = undefined;
    if (galleryUrls && galleryUrls.length > 0) {
      compressedGallery = await Promise.all(
        galleryUrls.map(async (gUrl) => {
          if (gUrl.startsWith("data:image/")) {
            return await compressBase64Image(gUrl, 800, 0.6);
          }
          return gUrl;
        })
      );
    }

    let finalMediaType: MediaType = mediaType;
    if (finalVideoUrl) {
      finalMediaType = 'video';
    } else if (mediaType === 'video') {
      // Local video blob was stripped, fallback page media to image
      finalMediaType = 'image';
    } else if (htmlCode) {
      finalMediaType = 'html';
    } else if (compressedGallery && compressedGallery.length > 0) {
      finalMediaType = 'gallery';
    }

    return {
      pageNumber: page.pageNumber,
      title: page.title || "",
      content: page.content || "",
      caption: page.caption || "",
      suggestedEntryId: page.suggestedEntryId || "",
      mediaUrl: mediaUrl || "",
      mediaType: finalMediaType,
      galleryUrls: compressedGallery,
      htmlCode: htmlCode || undefined,
      videoUrl: finalVideoUrl,
      videoStartTime: page.videoStartTime !== undefined ? page.videoStartTime : videoStartTime,
      videoEndTime: page.videoEndTime !== undefined ? page.videoEndTime : videoEndTime
    };
  }));

  let coverImageUrl = magazine.coverImageUrl || timelineEntries.find(e => e.mediaUrl)?.mediaUrl || undefined;
  if (coverImageUrl && coverImageUrl.startsWith("blob:")) {
    coverImageUrl = undefined;
  }
  if (coverImageUrl && coverImageUrl.startsWith("data:image/")) {
    try {
      coverImageUrl = await compressBase64Image(coverImageUrl, 600, 0.5);
    } catch (e) {
      console.warn("Failed to compress cover base64:", e);
    }
  }

  const selfContained: Magazine = {
    id: magazine.id,
    title: magazine.title,
    subtitle: magazine.subtitle || "",
    editorialText: magazine.editorialText || "",
    journalistId: magazine.journalistId || "pvc",
    period: magazine.period || "Edição Especial",
    season: magazine.season || "2024/2025",
    createdAt: magazine.createdAt || Date.now(),
    coverImageUrl: coverImageUrl || "",
    pages: pagesWithMedia
  };

  let cleaned = cleanForFirestore(selfContained);
  let payloadStr = JSON.stringify(cleaned);

  // Firestore hard document limit safety check (1,048,576 bytes)
  if (payloadStr.length > 850000) {
    console.warn("Shared magazine payload is large (" + payloadStr.length + " bytes), performing aggressive image compression...");
    
    // Pass 2: Aggressive image compression
    if (cleaned.coverImageUrl && cleaned.coverImageUrl.startsWith("data:image/")) {
      cleaned.coverImageUrl = await compressBase64Image(cleaned.coverImageUrl, 400, 0.35);
    }

    if (cleaned.pages && Array.isArray(cleaned.pages)) {
      for (const p of cleaned.pages) {
        if (p.mediaUrl && p.mediaUrl.startsWith("data:image/")) {
          p.mediaUrl = await compressBase64Image(p.mediaUrl, 400, 0.35);
        }
        if (p.galleryUrls && Array.isArray(p.galleryUrls)) {
          p.galleryUrls = await Promise.all(p.galleryUrls.map(async (gUrl: string) => {
            if (gUrl.startsWith("data:image/")) {
              return await compressBase64Image(gUrl, 350, 0.35);
            }
            return gUrl;
          }));
        }
      }
    }

    payloadStr = JSON.stringify(cleaned);

    // Pass 3: If still over 900KB, strip heavy local base64 gallery images to fit under 1MB limit
    if (payloadStr.length > 900000) {
      if (cleaned.pages && Array.isArray(cleaned.pages)) {
        for (const p of cleaned.pages) {
          if (p.galleryUrls) {
            p.galleryUrls = p.galleryUrls.filter((u: string) => !u.startsWith("data:image/"));
          }
        }
      }
    }
  }

  const cleanDocId = magazine.id.replace(/[^a-zA-Z0-9_-]/g, "_");
  const docRef = doc(fbDb, "shared_magazines", cleanDocId);
  await setDoc(docRef, cleaned);

  return window.location.origin + window.location.pathname + "?shared_mag=" + cleanDocId;
}

export async function getSharedMagazine(id: string): Promise<Magazine | null> {
  const { db } = await initFirebase();
  if (!db) {
    throw new Error("Não foi possível conectar ao Firebase.");
  }
  
  const cleanDocId = id.replace(/[^a-zA-Z0-9_-]/g, "_");
  const docRef = doc(db, "shared_magazines", cleanDocId);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return snap.data() as Magazine;
  }
  return null;
}

