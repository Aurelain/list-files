/**
 *
 */
const resolveList = async (list) => {
    const dirHandles = await getDirHandles();
    const simple = [];
    for (const item of list) {
        if (typeof item === 'string') {
            const files = await findFiles(item, dirHandles);
            simple.push(...files);
        } else {
            // TODO: handle dirs
            simple.push({
                file: item,
                path: item.name,
            });
        }
    }
    simple.sort(compareFiles);
    return groupList(simple);
}

/**
 *
 */
const compareFiles = (a, b) => {
    if (a.path < b.path) {
        return -1;
    } else {
        return (a.path > b.path)? 1 : 0;
    }
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