import axios from "axios";

export namespace nodes {
    export function nodes(): Promise<string[]> {
        return axios.get("/api/v1/nodes").then(r => r.data)
    }
}
