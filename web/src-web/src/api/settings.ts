import axios from "axios";
import {AvailableKubeVersion, AvailableOsImage} from "@/api/model";

export namespace settings {
    export function os_images() {
        return axios.get<AvailableOsImage[]>("/api/v1/os-images").then(r => r.data);
    }

    export function kube_versions() {
        return axios.get<AvailableKubeVersion[]>("/api/v1/kube-versions").then(r => r.data);
    }
}