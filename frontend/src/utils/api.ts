import { wrapWithProcessingIndicator } from "@/store/processingIndicatorStoreUi";
import { LogError } from "@wails-runtime/runtime";
import applicationStore from "@/store/applicationStore";


export async function apiCall<T>(fn: () => Promise<T>, callKey: string = Math.random().toString(16)): Promise<T> {
    return wrapWithProcessingIndicator(callKey, async () => {
        try {
            return await fn()
        } catch (e: any) {
            LogError(e)
            console.error(e)
            applicationStore.throwError(e)
            throw e
        }
    })
}