export function pick(src, ...fields) {
    let dst = {};
    for (let f of fields) {
        if (f in src) {
            if (src[f] === null || src[f] === undefined || src[f] === "") {
                continue;
            }
            dst[f] = src[f];
        }
    }
    return dst;
}
