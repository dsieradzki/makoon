import TheError from "@/components/TheError.vue"
import type { DialogServiceMethods } from "primevue/dialogservice";
import { LogError } from "@wails-runtime/runtime";


export function showError(dialog: DialogServiceMethods, err: any) {
    LogError(err);
    dialog.open(TheError, {
        props: {
            header: 'Unexpected error occurred',
            modal: true
        },
        data: {
            error: err
        }
    });
}