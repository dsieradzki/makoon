import axios from "axios";

export namespace settings {
    export function os_images() {
        return axios.get("/api/v1/os-images").then(r => r.data);
    }

    export function kube_versions() {
        return axios.get("/api/v1/kube-versions").then(r => r.data);
    }
}