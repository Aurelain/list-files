/**
 *
 * @param pathFragment
 * @param dirHandles
 */
async function findFiles(pathFragment, dirHandles) {
    pathFragment = pathFragment.replace(/^\//, '');
    const output = [];
    for (const dirHandle of dirHandles) {
        output.push(...await findInDirectory(dirHandle, pathFragment));
    }
    if (!output.length) {
        output.push({
            file: null,
            path: pathFragment,
        });
    }
    return output;
}

/**
 *
 * @param dirHandle
 * @param pathFragment
 * @param currentPath
 */
async function findInDirectory(dirHandle, pathFragment, currentPath = '') {
    const output = [];
    const entries = await getFiles(dirHandle);
    for (const [name, handle] of entries) {
        const fullPath = currentPath ? `${currentPath}/${name}` : name;
        if (fullPath.includes(pathFragment)) {
            output.push({
                file: await handle.getFile(),
                path: fullPath,
            });
        }
    }
    for (const [name, handle] of entries) {
        const fullPath = currentPath ? `${currentPath}/${name}` : name;
        if (handle.kind === 'directory') {
            output.push(...await findInDirectory(handle,pathFragment,fullPath));
        }
    }
    return output;
}

/**
 *
 * @param dirHandle
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