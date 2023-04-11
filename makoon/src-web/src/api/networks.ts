import axios from "axios";
import { AvailableNetwork } from "@/api/model";

export namespace networks {
    export function bridges(node: string): Promise<AvailableNetwork[]> {
        return axios.get<AvailableNetwork[]>(`/api/v1/nodes/${node}/networks/bridges`).then(e => e.data)
    }
}
