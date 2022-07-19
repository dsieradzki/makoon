
export function repackWailsPromise<T>(rp: Promise<T | Error>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        rp
            .then((resp) => {
                if (resp instanceof Error) {
                    reject(resp)
                } else {
                    resolve(resp as T)
                }
            })
            .catch(reject)
    });

}