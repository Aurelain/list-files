/**
 *
 */
const resolveList = async (list) => {
    const dirHandles = await getDirHandles();
    const output = [];
    for (const item of list) {
        console.log('item:', item);
        if (typeof item === 'string') {
            output.push(await findFile(item, dirHandles));
        } else {
            output.push({
                file: item,
                path: item.name,
            });
        }
    }
    return output;
}