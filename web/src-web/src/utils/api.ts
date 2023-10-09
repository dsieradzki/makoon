import {wrapWithProcessingIndicator} from "@/store/processing-indicator-store";
import {AxiosError} from "axios";
import applicationStore from "@/store/application-store";


export async function apiCall<T>(fn: () => Promise<T>, callKey: string = Math.random().toString(16)): Promise<T> {
    return wrapWithProcessingIndicator(callKey, async () => {
        try {
            return await fn()
        } catch (e: any) {
            if (e instanceof AxiosError) {
                console.error(e.cause);
            } else {
                console.error(e)
            }
            applicationStore.throwError(e)
            throw e
        }
    })
}