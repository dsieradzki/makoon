import { defineStore } from 'pinia'
import type { tasklog } from "@wails/models";
import { GetTaskLog } from "@wails/tasklog/Service";

interface State {
    data: tasklog.Task[]
}

export const useTaskLogStore = defineStore({
    id: 'taskLogStore',
    state: (): State => ({
        data: []
    }),
    getters: {
        taskLog: (state: State): tasklog.Task[] => {
            return state.data
        },
        lastThreeLogs: function (): tasklog.Task[] {
            return this.taskLog.slice(0, 3);
        }
    },
    actions: {
        async loadTaskLog() {
            this.data = await GetTaskLog();
        },
    }
})