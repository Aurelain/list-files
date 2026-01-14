const HANDLES = 'handles';
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
const main = async () => {
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

    await setup();
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
const setup = async () => {
    document.getElementById('reset').addEventListener('click', async () => {
        show('tutorial', 1);
        show('toolbar', 0);
        originalList.length = 0;
        document.getElementById('flat').innerHTML = '';
    });
    document.getElementById('allow-upstream').addEventListener('click', async () => {
        let dirHandle;
        try {
            dirHandle = await window.showDirectoryPicker();
        } catch (e) {}
        if (dirHandle) {
            await addDirHandle(dirHandle);
        }
        await renderTable();
    });
    document.getElementById('refresh-upstream').addEventListener('click', async () => {
        const dirHandles = await getDirHandles();
        for (const handle of dirHandles) {
            await verifyPermission(handle);
        }
        await renderTable();
    });
    document.getElementById('clear-upstream').addEventListener('click', async () => {
        await deleteDatabase();
        await renderTable();
    });
};

/**
 *
 */
const verifyPermission = async (dirHandle) => {
    if ((await dirHandle.queryPermission()) === 'granted') {
        return true;
    }
    return await dirHandle.requestPermission() === 'granted';
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
    await renderTable();
};

/**
 *
 */
const renderTable = async () => {
    // Prepare page:
    show('tutorial', 0);
    show('toolbar', 1);
    const flat = document.getElementById('flat');
    flat.innerHTML = '';
    const table = document.createElement('table');
    const tableBody = document.createElement('tbody');
    table.appendChild(tableBody);

    const groups = await resolveList(originalList);
    for (const group of groups) {
        const [first] = group;
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.innerHTML = first.path;
        if (first.path.match(/jpg$|png$|jpeg$|webp$|gif$/i)) {
            const div = document.createElement('div');
            div.append(...previewGroup(group));
            td.appendChild(div);
        }
        tr.appendChild(td);
        tableBody.appendChild(tr);
    }

    flat.appendChild(table);
};

/**
 *
 */
const previewGroup = (group) => {
    const output = [];
    for (const {file} of group) {
        let img;
        if (file) {
            img = convertFileToImgElement(file);
        } else {
            img = document.createElement('img');
            img.classList.add('unresolved');
        }
        output.push(img);
    }
    return output;
}

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
const parsePaths = (input) => {
    const invalidChars = /[<>:"|?*&\r\n\t]+/;
    return input.split(invalidChars).filter(part => part.length > 0);
};

/**
 *
 */
const getDirHandles = async () => {
    return await read(HANDLES) || [];
};

/**
 *
 */
const addDirHandle = async (dirHandle) => {
    const handles = await getDirHandles();
    handles.push(dirHandle);
    await write(HANDLES, handles);
};

/**
 *
 */
const show = (id, force) => {
    const flag = force === undefined? false : !Boolean(force);
    document.getElementById(id).classList.toggle('hidden', flag);
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
