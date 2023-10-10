export function toHumanReadableSize(valInMiB?: number): String {
    if (!valInMiB) {
        return `0 MiB`
    }

    if (valInMiB < 1024) {
        return `${toFixed(valInMiB)} MiB`
    }

    let val = valInMiB / 1024;
    return `${toFixed(val)} GiB`;
}

function toFixed(val: number): String {
    return val.toFixed(2);
}