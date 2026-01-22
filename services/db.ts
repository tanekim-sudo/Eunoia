
import { SavedDecision, CustomVoice } from '../types';

const DB_NAME = 'EunoiaDB';
const DB_VERSION = 1;

interface User {
    username: string;
    password: string;
    createdAt: number;
}

// Internal helper to get DB connection
const getDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => reject("Database error: " + (event.target as any).error);

        request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            // Users Store
            if (!db.objectStoreNames.contains('users')) {
                db.createObjectStore('users', { keyPath: 'username' });
            }

            // Decisions Store
            if (!db.objectStoreNames.contains('decisions')) {
                const decisionStore = db.createObjectStore('decisions', { keyPath: 'id' });
                decisionStore.createIndex('username', 'username', { unique: false });
            }

            // Voices Store
            if (!db.objectStoreNames.contains('voices')) {
                const voiceStore = db.createObjectStore('voices', { keyPath: 'id' });
                voiceStore.createIndex('username', 'username', { unique: false });
            }
        };
    });
};

export const db = {
    // --- AUTHENTICATION ---
    async registerUser(username: string, password: string): Promise<void> {
        const database = await getDB();
        return new Promise((resolve, reject) => {
            const tx = database.transaction('users', 'readwrite');
            const store = tx.objectStore('users');
            
            // Check if exists
            const checkReq = store.get(username);
            checkReq.onsuccess = () => {
                if (checkReq.result) {
                    reject(new Error("Username already exists"));
                } else {
                    store.add({ username, password, createdAt: Date.now() });
                    resolve();
                }
            };
            checkReq.onerror = () => reject(checkReq.error);
        });
    },

    async authenticateUser(username: string, password: string): Promise<boolean> {
        const database = await getDB();
        return new Promise((resolve, reject) => {
            const tx = database.transaction('users', 'readonly');
            const store = tx.objectStore('users');
            const request = store.get(username);
            
            request.onsuccess = () => {
                const user = request.result as User;
                if (user && user.password === password) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            };
            request.onerror = () => reject(request.error);
        });
    },

    // --- DECISIONS ---
    async getDecisions(username: string): Promise<SavedDecision[]> {
        const database = await getDB();
        return new Promise((resolve, reject) => {
            const tx = database.transaction('decisions', 'readonly');
            const store = tx.objectStore('decisions');
            const index = store.index('username');
            const request = index.getAll(IDBKeyRange.only(username));

            request.onsuccess = () => {
                // Strip the internal username field before returning to app
                const rawData = request.result;
                const decisions = rawData.map((d: any) => {
                    const { username, ...rest } = d;
                    return rest as SavedDecision;
                });
                resolve(decisions);
            };
            request.onerror = () => reject(request.error);
        });
    },

    async saveDecision(username: string, decision: SavedDecision): Promise<void> {
        const database = await getDB();
        return new Promise((resolve, reject) => {
            const tx = database.transaction('decisions', 'readwrite');
            const store = tx.objectStore('decisions');
            // Store with username for indexing
            store.put({ ...decision, username });
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },

    async deleteDecision(id: string): Promise<void> {
        const database = await getDB();
        return new Promise((resolve, reject) => {
            const tx = database.transaction('decisions', 'readwrite');
            const store = tx.objectStore('decisions');
            store.delete(id);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },

    // --- VOICES ---
    async getVoices(username: string): Promise<CustomVoice[]> {
        const database = await getDB();
        return new Promise((resolve, reject) => {
            const tx = database.transaction('voices', 'readonly');
            const store = tx.objectStore('voices');
            const index = store.index('username');
            const request = index.getAll(IDBKeyRange.only(username));

            request.onsuccess = () => {
                const rawData = request.result;
                const voices = rawData.map((d: any) => {
                    const { username, ...rest } = d;
                    return rest as CustomVoice;
                });
                resolve(voices);
            };
            request.onerror = () => reject(request.error);
        });
    },

    async saveVoice(username: string, voice: CustomVoice): Promise<void> {
        const database = await getDB();
        return new Promise((resolve, reject) => {
            const tx = database.transaction('voices', 'readwrite');
            const store = tx.objectStore('voices');
            store.put({ ...voice, username });
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },

    async deleteVoice(id: string): Promise<void> {
        const database = await getDB();
        return new Promise((resolve, reject) => {
            const tx = database.transaction('voices', 'readwrite');
            const store = tx.objectStore('voices');
            store.delete(id);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }
};
