/**
 * Dictée en attente, gardée sur le téléphone (IndexedDB) tant qu'elle n'a
 * pas été transcrite : réseau coupé, app fermée trop tôt… l'idée n'est pas
 * perdue, l'accueil propose de l'envoyer au retour. Une seule dictée en
 * attente à la fois (la plus récente). Tout échec de stockage est ignoré :
 * sans IndexedDB (navigation privée), l'app marche comme avant.
 */

const DB_NAME = "vocalink";
const STORE = "pending-audio";
const KEY = "dictation";

export type PendingAudio = { blob: Blob; savedAt: number };

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest): Promise<T | null> {
  try {
    const db = await openDb();
    return await new Promise<T | null>((resolve) => {
      const request = action(db.transaction(STORE, mode).objectStore(STORE));
      request.onsuccess = () => resolve((request.result as T) ?? null);
      request.onerror = () => resolve(null);
    }).finally(() => db.close());
  } catch {
    return null;
  }
}

export async function savePendingAudio(blob: Blob): Promise<void> {
  await run("readwrite", (store) => store.put({ blob, savedAt: Date.now() } satisfies PendingAudio, KEY));
}

export async function loadPendingAudio(): Promise<PendingAudio | null> {
  const value = await run<PendingAudio>("readonly", (store) => store.get(KEY));
  return value && value.blob instanceof Blob ? value : null;
}

export async function clearPendingAudio(): Promise<void> {
  await run("readwrite", (store) => store.delete(KEY));
}
