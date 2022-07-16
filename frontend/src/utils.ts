export interface Maybe<T> {
    value: T | null;
}

export function RunMaybe<R>(
    fn: (...a: (any | null)[]) => R,
    ...args: (any | Maybe<any> | null)[])
    : Maybe<R> {
    if (args.filter(e => e != null).length > 0) {
        return {
            value: fn(...args)
        } as Maybe<R>
    }
    return {} as Maybe<R>
}