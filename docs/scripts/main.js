const DB_NAME = 'list-files';
const STORE_NAME = 'handles';
const originalList = [];
const resolvedList = [];

/**
 * The only input we actually need is a list of absolute paths. However, there are several ways and formats for this
 * list to get to us:
 * 1. Drag-and-Drop
 * 2. Browse button
 * 3. Paste action
 * 4. Address-bar
 * 5. PostMessage
 */
const main = () => {
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
    if (location.search) {
        notify('Accepted paths from address-bar...');
        add(location.search);
    }

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
    document.getElementById('reset').addEventListener('click', async () => {
        document.getElementById('card').classList.remove('hidden');
        document.getElementById('toolbar').classList.add('hidden');
        originalList.length = 0;
        document.getElementById('flat').innerHTML = '';
    });
};

/**
 *
 * @param input Either an array of files or a string.
 */
const add = async (input) => {
    let added;
    if (typeof input === 'string') {
        const paths = parsePaths(input);
        if (!paths.length) {
            notify('Payload contained no valid paths!');
            return;
        }
        notify(`Payload contained ${paths.length} paths.`);
        added = paths;
    } else {
        added = input;
    }
    originalList.push(...added);
    const resolvedList = await resolveList(originalList);
    renderTable(resolvedList);
};

/**
 *
 */
const renderTable = (items) => {
    document.getElementById('card').classList.add('hidden');
    document.getElementById('toolbar').classList.remove('hidden');
    const flat = document.getElementById('flat');
    for (const item of items) {
        const line = document.createElement('div');
        line.classList.add('line');
        line.innerHTML = item;
        if (typeof item !== 'string') {
            if (item.name.match(/jpg$|png$|jpeg$|webp$|gif$/i)) {
                const img = convertFileToImgElement(item);
                line.appendChild(img);
            }
            console.log(item);
        } else {
            const pick = document.createElement('button');
            pick.classList.add('pick');
            pick.innerHTML = 'Allow upstream';
            pick.addEventListener('click', onPickClick);
            line.appendChild(pick);
        }
        flat.appendChild(line);
    }
};



/**
 *
 */
const convertFileToImgElement = (file) => {
    const img = document.createElement('img');
    const url = URL.createObjectURL(file);
    img.src = url;
    img.onload = () => URL.revokeObjectURL(url); // clean up the object URL once the image is loaded
    return img;
}

/**
 *
 */
const onPickClick = async () => {
    let dirHandle;
    try {
        dirHandle = await window.showDirectoryPicker();
    } catch (e) {
        // The user canceled
        return;
    }
    console.log('dirHandle:', dirHandle);
    await addDirHandle(dirHandle);
    const dirHandles = await getDirHandles();
    console.log('dirHandles:', dirHandles);
}

/**
 *
 */
const parsePaths = (input) => {
    const invalidChars = /[<>:"|?*&\r\n\t]+/;
    return input.split(invalidChars).filter(part => part.length > 0);
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

document.addEventListener('DOMContentLoaded', main);
