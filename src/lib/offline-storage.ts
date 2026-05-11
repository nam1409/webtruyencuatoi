/**
 * ZenStory Offline Storage & Encryption System
 * Uses Web Crypto API (AES-GCM) for military-grade encryption
 * Uses IndexedDB for persistent local storage
 */

const DB_NAME = "ZenStoryOfflineDB";
const DB_VERSION = 1;
const STORE_CHAPTERS = "chapters";
const STORE_KEYS = "keys";

// Encryption Algorithm Configuration
const ALGO = "AES-GCM";

/**
 * Initialize the Offline Database
 */
async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_CHAPTERS)) {
        db.createObjectStore(STORE_CHAPTERS, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_KEYS)) {
        db.createObjectStore(STORE_KEYS, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get or Generate a persistent encryption key for this device
 */
async function getEncryptionKey(): Promise<CryptoKey> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_KEYS, "readonly");
    const store = transaction.objectStore(STORE_KEYS);
    const request = store.get("master_key");

    request.onsuccess = async () => {
      if (request.result) {
        // Key exists, import it
        const key = await window.crypto.subtle.importKey(
          "jwk",
          request.result.keyData,
          { name: ALGO },
          true,
          ["encrypt", "decrypt"]
        );
        resolve(key);
      } else {
        // Generate new master key
        const newKey = await window.crypto.subtle.generateKey(
          { name: ALGO, length: 256 },
          true,
          ["encrypt", "decrypt"]
        );
        const keyData = await window.crypto.subtle.exportKey("jwk", newKey);

        // Save it
        const saveTransaction = db.transaction(STORE_KEYS, "readwrite");
        saveTransaction.objectStore(STORE_KEYS).put({ id: "master_key", keyData });
        resolve(newKey);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Encrypt and Save a chapter
 */
export async function saveChapterOffline(storyId: string, chapterId: string, content: string, metadata: any) {
  try {
    const key = await getEncryptionKey();
    const encoder = new TextEncoder();
    const data = encoder.encode(content);

    // Generate a random Initialization Vector (IV) for each encryption
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const encryptedData = await window.crypto.subtle.encrypt(
      { name: ALGO, iv },
      key,
      data
    );

    const db = await initDB();
    const transaction = db.transaction(STORE_CHAPTERS, "readwrite");
    const store = transaction.objectStore(STORE_CHAPTERS);

    await new Promise((resolve, reject) => {
      const request = store.put({
        id: `${storyId}_${chapterId}`,
        storyId,
        chapterId,
        encryptedContent: encryptedData,
        iv: iv,
        metadata,
        savedAt: new Date().toISOString()
      });
      request.onsuccess = resolve;
      request.onerror = reject;
    });

    return true;
  } catch (error) {
    console.error("Failed to save offline:", error);
    return false;
  }
}

/**
 * Get and Decrypt a chapter
 */
export async function getOfflineChapter(storyId: string, chapterId: string): Promise<string | null> {
  try {
    const db = await initDB();
    const id = `${storyId}_${chapterId}`;

    const record: any = await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_CHAPTERS, "readonly");
      const request = transaction.objectStore(STORE_CHAPTERS).get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (!record) return null;

    const key = await getEncryptionKey();
    const decryptedData = await window.crypto.subtle.decrypt(
      { name: ALGO, iv: record.iv },
      key,
      record.encryptedContent
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
  } catch (error) {
    console.error("Failed to read offline:", error);
    return null;
  }
}

/**
 * Check if a chapter is available offline
 */
export async function isChapterOffline(storyId: string, chapterId: string): Promise<boolean> {
  const db = await initDB();
  const id = `${storyId}_${chapterId}`;
  return new Promise((resolve) => {
    const transaction = db.transaction(STORE_CHAPTERS, "readonly");
    const request = transaction.objectStore(STORE_CHAPTERS).get(id);
    request.onsuccess = () => resolve(!!request.result);
    request.onerror = () => resolve(false);
  });
}

/**
 * Check if a story has any chapters available offline
 */
export async function isStoryOffline(storyId: string): Promise<boolean> {
  const db = await initDB();
  return new Promise((resolve) => {
    const transaction = db.transaction(STORE_CHAPTERS, "readonly");
    const store = transaction.objectStore(STORE_CHAPTERS);
    const request = store.openCursor();
    request.onsuccess = (event: any) => {
      const cursor = event.target.result;
      if (cursor) {
        if (cursor.value.storyId === storyId) {
          resolve(true);
          return;
        }
        cursor.continue();
      } else {
        resolve(false);
      }
    };
    request.onerror = () => resolve(false);
  });
}

/**
 * Delete offline content
 */
export async function removeOfflineStory(storyId: string) {
  const db = await initDB();
  const transaction = db.transaction(STORE_CHAPTERS, "readwrite");
  const store = transaction.objectStore(STORE_CHAPTERS);
  // const index = store.index ? null : null; // IndexedDB index handling if needed

  // In a simple way, iterate and delete
  return new Promise((resolve, reject) => {
    const request = store.openCursor();
    request.onsuccess = (event: any) => {
      const cursor = event.target.result;
      if (cursor) {
        if (cursor.value.storyId === storyId) {
          cursor.delete();
        }
        cursor.continue();
      } else {
        resolve(true);
      }
    };
    request.onerror = reject;
  });
}

/**
 * Get all stories that have at least one chapter saved offline
 */
export async function getOfflineStories(): Promise<any[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_CHAPTERS, "readonly");
    const store = transaction.objectStore(STORE_CHAPTERS);
    const request = store.openCursor();
    const storiesMap = new Map();

    request.onsuccess = (event: any) => {
      const cursor = event.target.result;
      if (cursor) {
        const data = cursor.value;
        if (!storiesMap.has(data.storyId)) {
          storiesMap.set(data.storyId, {
            id: data.storyId,
            title: data.metadata.storyTitle || "Truyện đã tải",
            slug: data.metadata.storySlug,
            coverUrl: data.metadata.coverUrl, // Thêm coverUrl vào đây
            chapterCount: 1,
            lastSavedAt: data.savedAt
          });
        } else {
          const existing = storiesMap.get(data.storyId);
          existing.chapterCount++;
        }
        cursor.continue();
      } else {
        resolve(Array.from(storiesMap.values()));
      }
    };
    request.onerror = reject;
  });
}
