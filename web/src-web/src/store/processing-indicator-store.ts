import { makeAutoObservable } from "mobx";

export class ProcessingIndicatorStore {
    loaders: { [key: string]: boolean } = {}

    constructor() {
        makeAutoObservable(this)
    }

    startProcessing(key: string) {
        this.loaders[key] = true
    }

    stopProcessing(key: string) {
        delete this.loaders[key]
    }

    status(key: string): boolean {
        return this.loaders[key]
    }
}


const processingIndicatorStore = new ProcessingIndicatorStore()

export const wrapWithProcessingIndicator = async <T>(key: string, fn: () => Promise<T>): Promise<T> => {
    console.debug("API CALL [%s] START", key);
    processingIndicatorStore.startProcessing(key)
    try {
        return await fn()
    } finally {
        processingIndicatorStore.stopProcessing(key)
        console.debug("API CALL [%s] STOP", key);
    }
}

export default processingIndicatorStore