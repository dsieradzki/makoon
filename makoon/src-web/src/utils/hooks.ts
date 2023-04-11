import { useEffect, useRef } from "react";

export function useOnFirstMount(fn: () => Promise<any>) {
    const alreadyInitialized = useRef(false)
    useEffect(() => {
        if (!alreadyInitialized.current) {
            alreadyInitialized.current = true
            fn()
                .then(() => {
                })
                .catch(e => {
                    console.error(e)
                })

        }
    }, [])
}