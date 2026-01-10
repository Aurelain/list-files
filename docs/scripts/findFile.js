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
    return null;
}

/**
 *
 * @param dirHandle
 * @param pathFragment
 * @param currentPath
 * @returns {Promise<*|void|File|null>}
 */
async function findInDirectory(dirHandle, pathFragment, currentPath = '') {
    for await (const [name, handle] of dirHandle.entries()) {
        const fullPath = currentPath ? `${currentPath}/${name}` : name;
        if (fullPath.endsWith(pathFragment)) {
            const indexBefore = fullPath.length - pathFragment.length - 1;
            if (indexBefore === -1 || fullPath.charAt(indexBefore) === '/') {
                return {
                    file: await handle.getFile(),
                    fullPath,
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