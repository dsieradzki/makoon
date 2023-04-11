import React, { useState } from 'react';
import { Button } from "primereact/button";
import { useNavigate } from "react-router-dom";
import { apiCall } from "@/utils/api";
import { useOnFirstMount } from "@/utils/hooks";
import api from "@/api/api";
import logo from "../assets/images/makonn_logo.svg";

type Props = {
    title: string;
    titlePath?: string[]
} & React.PropsWithChildren

const Header = (props: Props) => {
    const navigate = useNavigate();
    const [hostIp, setHostIp] = useState("");

    useOnFirstMount(async () => {
        setHostIp(await api.auth.getLoggedInHostIp());
    });
    const onLogoutHandler = async () => {
        await apiCall(() => api.auth.logout());
        navigate("/login")
    }

    return (
        <div className="flex justify-between pt-10 pl-10 pr-10 pb-8">
            <div className="flex justify-start items-center">
                <img title="Makoon" alt="Makoon logo" className="mb-1" src={logo} width={40} height={40}/>
                <span className="primary-text-color text-4xl mx-2">/</span>
                <div className="flex items-center">
                    <div className="text-3xl mr-1">
                        {props.title}
                    </div>
                    {
                        props.titlePath && props.titlePath.map((e, idx) =>
                            <div key={idx} className="flex items-center">
                                <span className="primary-text-color text-4xl mx-2">/</span>
                                <div className="text-3xl mr-4 font-bold">
                                    {e}
                                </div>
                            </div>
                        )
                    }
                    <div>
                        {props.children}
                    </div>
                </div>
            </div>
            <div className="flex items-center">
                <p className="pi pi-server mr-2" style={{fontSize: "1.5rem"}}/>
                <p className="pi pi-angle-double-left primary-text-color mr-2"/>
                <span title="Proxmox IP">{hostIp}</span>
                <span className="primary-text-color text-4xl mx-2">/</span>
                <Button disabled={false} onClick={onLogoutHandler} icon="pi pi-sign-out"
                        className="p-button-rounded p-button-secondary p-button-text" style={{color: "#FFFFFF"}}
                        aria-label="Logout"/>
            </div>
        </div>
    );
};

export default Header;