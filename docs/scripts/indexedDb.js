/**
 *
 */
const openDB = async (version) => {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, version);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { autoIncrement: true });
            }
        };

        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
};

/**
 *
 */
const addDirHandle = async (dirHandle) => {
    let db = await openDB();

    // If the store does not exist, upgrade the DB
    if (!db.objectStoreNames.contains(STORE_NAME)) {
        const newVersion = db.version + 1;
        db.close();
        db = await openDB(newVersion);
    }

    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).add(dirHandle);

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
};

/**
 *
 */
const getDirHandles = async () => {
    const db = await openDB();
    if (!db.objectStoreNames.contains(STORE_NAME)) {
        console.warn('No store found!');
        return null;
    }
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};
