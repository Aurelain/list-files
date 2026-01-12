/**
 *
 * @param pathFragment
 * @param dirHandles
 * @returns {Promise<*|File|null>}
 */
async function findFile(pathFragment, dirHandles) {
    pathFragment = pathFragment.replace(/^\//, '');
    for (const dirHandle of dirHandles) {
        const result = await findInDirectory(dirHandle, pathFragment);
        if (result) {
            return result;
        }
    }
    return {
        file: null,
        path: pathFragment,
    };
}

/**
 *
 * @param dirHandle
 * @param pathFragment
 * @param currentPath
 * @returns {Promise<*|void|File|null>}
 */
async function findInDirectory(dirHandle, pathFragment, currentPath = '') {
    const entries = await getFiles(dirHandle);
    for (const [name, handle] of entries) {
        const fullPath = currentPath ? `${currentPath}/${name}` : name;
        if (fullPath.endsWith(pathFragment)) {
            const indexBefore = fullPath.length - pathFragment.length - 1;
            if (indexBefore === -1 || fullPath.charAt(indexBefore) === '/') {
                return {
                    file: await handle.getFile(),
                    path: fullPath,
                };
            }
        }
        if (handle.kind === 'directory') {
            const found = await findInDirectory(handle,pathFragment,fullPath);
            if (found) {
                return found;
            }
        }
    }
    return null;
}

/**
 *
 * @param dirHandle
 * @returns {Promise<*[]>}
 */
async function getFiles(dirHandle) {
    const entries = [];
    try {
        for await (const entry of dirHandle.entries()) {
            entries.push(entry);
        }
    } catch (error) {}
    return entries;
}