export function toHumanReadableSize(valInBytes?: number): String {
    if (!valInBytes) {
        return `0 KB`
    }
    let val = valInBytes / 1024;
    if (val < 1024) {
        return `${toFixed(val)} KB`
    }

    val = val / 1024;
    if (val < 1024) {
        return `${toFixed(val)} MB`
    }

    val = val / 1024;
    return `${toFixed(val)} GB`;
}

function toFixed(val: number): String {
    return val.toFixed(2);
}