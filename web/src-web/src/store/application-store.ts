import { makeAutoObservable } from "mobx";


export class ApplicationStore {
    error: string = "";

    constructor() {
        makeAutoObservable(this)
    }

    throwError(message: string) {
        this.error = message
    }

    clearError() {
        this.error = ""
    }

    isError(): boolean {
        return this.error.length > 0
    }
}

const applicationStore = new ApplicationStore()
export default applicationStore