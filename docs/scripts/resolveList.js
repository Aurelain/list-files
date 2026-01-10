/**
 *
 */
const resolveList = async (list) => {
    const dirHandles = await getDirHandles();
    const output = [];
    for (const item of list) {
        if (typeof item === 'string') {
            const meta = await findFile(item, dirHandles);
            output.push(meta.file);
        } else {
            output.push(item);
        }
    }
    return output;
}