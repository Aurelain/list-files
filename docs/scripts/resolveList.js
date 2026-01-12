/**
 *
 */
const resolveList = async (list) => {
    const dirHandles = await getDirHandles();
    const simple = [];
    for (const item of list) {
        if (typeof item === 'string') {
            simple.push(...await findFiles(item, dirHandles));
        } else {
            // TODO: handle dirs
            simple.push({
                file: item,
                path: item.name,
            });
        }
    }
    return groupList(simple);
}

/**
 *
 */
const groupList = (list) => {
    const map = {};
    const output = [];
    for (const item of list) {
        const stem = item.path.split('/').pop().replace(/\.[^.]*$/, '');
        if (!map[stem]) {
            map[stem] = [];
            output.push(map[stem]);
        }
        map[stem].push(item);
    }
    return output;

}