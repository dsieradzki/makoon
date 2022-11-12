import { makeAutoObservable, runInAction } from "mobx";
import { tasklog } from "@wails/models";
import { GetTaskLog } from "@wails/tasklog/Service";
import { apiCall } from "@/utils/api";

class TaskLogStore {
    log: tasklog.Task[] = []

    constructor() {
        makeAutoObservable(this)
    }

    get lastThreeLogs(): tasklog.Task[] {
        return this.log.slice(0, 3);
    }

    get logs(): tasklog.Task[] {
        return this.log
    }

    async loadTaskLog() {
        const response = await apiCall(() => GetTaskLog())
        runInAction(() => {
            this.log = response
        })
    }
}

const taskLogStore = new TaskLogStore()
export default taskLogStore