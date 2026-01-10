const DB_NAME = 'list-files';
const DB_VERSION = 1;
const STORE_NAME = 'handles';
const theList = [];

/**
 * The only input we actually need is a list of absolute paths. However, there are several ways and formats for this
 * list to get to us:
 * 1. Drag-and-Drop
 * 2. Browse button
 * 3. Paste action
 * 4. Address-bar
 * 5. PostMessage
 */
const script = () => {
    // Method 1 (Drag-and-Drop)
    window.addEventListener('dragover', (event) => event.preventDefault());
    window.addEventListener('drop', onWindowDrop);

    // Method 2 (Browse)
    const inputDirs = document.getElementById('input-dirs');
    const inputFiles = document.getElementById('input-files');
    inputDirs.addEventListener('change', onInputChange);
    inputFiles.addEventListener('change', onInputChange);
    document.querySelectorAll('.add-dirs').forEach(b => b.addEventListener('click', () => inputDirs.click()));
    document.querySelectorAll('.add-files').forEach(b => b.addEventListener('click', () => inputFiles.click()));

    // Method 3 (Paste)
    window.addEventListener('paste', onWindowPaste);

    // Method 4 (Address-bar)
    location.search && add(location.search);

    // Method 5 (PostMessage)
    window.addEventListener('message', onWindowMessage);

    // Announce to anyone trying to use Method 5 (PostMessage) that we are ready to provide them with service:
    window.top !== window.self && window.parent.postMessage('READY', '*');

    setup();
};

/**
 * Method 1 (Drag-and-Drop)
 */
const onWindowDrop = (event) => {
    event.preventDefault();
    const {dataTransfer = {}} = event;
    const {files} = dataTransfer;
    if (files?.length > 0) {
        notify(`Dropped ${files.length} files...`);
        add(files);
    } else {
        const text = dataTransfer.getData('text/plain');
        if (text) {
            notify(`Dropped text...`);
            add(text);
        } else {
            notify(`Invalid drop!`);
        }
    }
};

/**
 * Method 2 (Browse)
 */
const onInputChange = (event) => {
    const {files} = event.currentTarget;
    if (files?.length > 0) {
        notify(`Browsed ${files.length} files...`);
        add(files);
    } else {
        notify(`Invalid browse!`); // never happens
    }
};

/**
 * Method 3 (Paste)
 */
const onWindowPaste = (event) => {
    const {clipboardData = {}} = event;
    const {files} = clipboardData;
    if (files?.length > 0) {
        notify(`Pasted ${files.length} files...`);
        add(files);
    } else {
        const text = clipboardData.getData('text/plain');
        if (text) {
            notify(`Pasted text...`);
            add(text);
        } else {
            notify(`Invalid paste!`);
        }
    }
};

/**
 * Method 5 (PostMessage)
 */
const onWindowMessage = (event) => {
    const {data = {}} = event;
    if (data.payload && typeof data.payload === 'string') {
        notify(`Received message...`);
        add(data.payload);
    }
};

/**
 *
 */
const setup = () => {
    document.getElementById('reset').addEventListener('click', () => {
        document.getElementById('card').classList.remove('hidden');
        document.getElementById('toolbar').classList.add('hidden');
        theList.length = 0;
        document.getElementById('flat').innerHTML = '';
    });
};

/**
 *
 * @param input Either an array of files or a string.
 */
const add = (input) => {
    if (typeof input === 'string') {
        const paths = parsePaths(input);
        if (!paths.length) {
            notify('The string contained no valid paths!');
            return;
        }
        appendItems(paths);
    } else {
        appendItems(input);
    }
};

/**
 *
 */
const appendItems = (items) => {
    document.getElementById('card').classList.add('hidden');
    document.getElementById('toolbar').classList.remove('hidden');
    const flat = document.getElementById('flat');
    notify(`Added ${items.length} items.`);
    for (const item of items) {
        const line = document.createElement('div');
        line.classList.add('line');
        line.innerHTML = item;
        flat.appendChild(line);
    }
}

/**
 *
 */
const parsePaths = (input) => {
    const invalidChars = /[<>:"|?*&]+/;
    return input.split(invalidChars).filter(part => part.length > 0);
};

/**
 *
 */
const openDB = async () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, {autoIncrement: true});
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

/**
 *
 */
const addDirHandle = async (dirHandle) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.add(dirHandle);
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

/**
 *
 */
const notify = (text) => {
    const popups = document.getElementById('popups');
    const popup = document.createElement('div');
    popup.classList.add('popup');
    popup.innerHTML = text;
    popup.addEventListener('click', () => popups.removeChild(popup));
    popups.appendChild(popup);
    console.log(text);
    setTimeout(() => popups.removeChild(popup), 1000);
};

document.addEventListener('DOMContentLoaded', script);
