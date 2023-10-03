import {useEffect, useRef} from "react";
import clusterManagementStore from "@/store/cluster-management-store";

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

export function useAsyncEffect(fn: () => Promise<any>, deps: any[] = []) {
    useEffect(() => {
        fn()
            .then(() => {
            })
            .catch(e => {
                console.error(e)
            })
    }, deps)
}

export function useInterval(fn: () => Promise<any>, interval = 5000) {
    const nodesStatusRequestFinish = useRef(true);
    useEffect(() => {
        const readTaskLogInterval = setInterval(async () => {
            if (nodesStatusRequestFinish.current) {
                nodesStatusRequestFinish.current = false;
                await fn();
                nodesStatusRequestFinish.current = true;
            } else {
            }
        }, interval);
        return () => {
            clearInterval(readTaskLogInterval);
        }
    }, [])
}

