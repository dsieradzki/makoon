import React, { useState } from 'react';
import { Button } from "primereact/button";
import projectStore from "@/store/projectStore";
import { GetProxmoxIp, Logout } from "@wails/auth/Service";
import { useNavigate } from "react-router-dom";
import { useOnFirstMount } from "@/reactHooks";

type Props = {
    title: string
}
const Header = (props: Props) => {
    const navigate = useNavigate()
    const [proxmoxIp, setProxmoxIp] = useState("")

    useOnFirstMount(async () => {
        setProxmoxIp(await GetProxmoxIp())
    })

    const onLogoutHandler = async () => {
        await Logout()
        navigate("/login")
    }

    return (
        <div className="flex justify-between pt-10 pl-10 pr-10 pb-8">
            <div className="flex justify-start items-center">
                <div className="text-4xl">K<span className="primary-text-color font-bold">4</span>Prox</div>
                <span className="primary-text-color text-4xl mx-2">/</span>
                <div className="text-3xl">{props.title}</div>
            </div>
            <div className="flex items-center">
                <p className="pi pi-server mr-2" style={{fontSize: "1.5rem"}}/>
                <p className="pi pi-angle-double-left primary-text-color mr-2"/>
                <span title="Proxmox IP">{proxmoxIp}</span>
                <span className="primary-text-color text-4xl mx-2">/</span>
                <Button disabled={projectStore.provisioningInProgress} onClick={onLogoutHandler} icon="pi pi-sign-out"
                        className="p-button-rounded p-button-secondary p-button-text" style={{color: "#FFFFFF"}}
                        aria-label="Logout"/>
            </div>
        </div>
    );
};

export default Header;