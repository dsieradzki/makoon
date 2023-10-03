import { LoginRequest } from "@/api/model";
import axios, { AxiosError } from 'axios';

export namespace auth {
    export function getLoggedInHostIp(): Promise<string> {
        return axios.get("/api/v1/host-ip").then(e => e.data)
    }

    export function login(req: LoginRequest): Promise<number> {
        return axios.post("/api/v1/login", req).then(e => e.status).catch((e: AxiosError) => e.response?.status ?? 400);
    }

    export function logout(): Promise<void> {
        return axios.post("/api/v1/logout")
    }
}