const DB_NAME = window.location.href.replace(/[^/]*$/, '');
const STORE_NAME = 'store';

/**
 *
 */
const openDB = async (version) => {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, version);
        req.onupgradeneeded = e => e.target.result.createObjectStore(STORE_NAME);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
};

/**
 *
 */
const deleteDatabase = () => {
    return new Promise((resolve, reject) => {
        const req = indexedDB.deleteDatabase(DB_NAME);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
        req.onblocked = () => console.warn('Database deletion blocked.');
    });
};


/**
 *
 */
const read = async (key) => {
    const dbs = await indexedDB.databases();
    if (!dbs.find(db => db.name === DB_NAME)) {
        return;
    }
    const db = await openDB();
    if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.close();
        return;
    }
    return new Promise((resolve, reject) => {
        const request = db.transaction(STORE_NAME).objectStore(STORE_NAME).get(key);
        request.onsuccess = () => {
            resolve(request.result);
            db.close();
        }
        request.onerror = () => {
            reject(request.error);
            db.close();
        }
    });
};

/**
 *
 */
const write = async (key, value) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(value, key);
        tx.onsuccess = () => {
            resolve();
            db.close();
        }
        tx.onerror = () => {
            reject(tx.error);
            db.close();
        }
    });
};