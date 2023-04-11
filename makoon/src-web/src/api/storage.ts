import axios from "axios";
import { AvailableStorage } from "@/api/model";

export namespace storage {
    export enum StorageContentType {
        Iso = "iso",
        Images = "images",
        Rootdir = "rootdir",
        Vztmpl = "vztmpl",
        Backup = "backup",
        Snippets = "snippets"
    }

    export function storage(node: string, storageContentType: StorageContentType): Promise<AvailableStorage[]> {
        return axios.get<AvailableStorage[]>(`/api/v1/nodes/${node}/storage/${storageContentType}`).then(r => r.data);
    }
}