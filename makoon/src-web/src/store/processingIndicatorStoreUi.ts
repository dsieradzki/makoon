import { makeAutoObservable } from "mobx";

export class ProcessingIndicatorStoreUi {
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


const processingIndicatorStoreUi = new ProcessingIndicatorStoreUi()

export const wrapWithProcessingIndicator = async <T>(key: string, fn: () => Promise<T>): Promise<T> => {
    processingIndicatorStoreUi.startProcessing(key)
    try {
        return await fn()
    } finally {
        processingIndicatorStoreUi.stopProcessing(key)
    }
}

export default processingIndicatorStoreUi