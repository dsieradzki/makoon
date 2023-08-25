import {Button} from "primereact/button";
import React, {useState} from "react";
import {apiCall} from "@/utils/api";
import api from "@/api/api";
import {useNavigate} from "react-router-dom";
import {useOnFirstMount} from "@/utils/hooks";

export type Props = {
    title: string;
    titlePrefix?: string
    content?: React.ReactNode
}
const header = (props: Props) => {

    const navigate = useNavigate();
    const [hostIp, setHostIp] = useState("");

    // TODO: move this to global place
    useOnFirstMount(async () => {
        setHostIp(await api.auth.getLoggedInHostIp());
    });
    const onLogoutHandler = async () => {
        await apiCall(() => api.auth.logout());
        navigate("/login")
    }
    return <div className="mb-4 flex items-center justify-between" style={{color: "#454560"}}>
        <div className="flex items-end">
            <div>
                {
                    props.titlePrefix
                        ? <div className="text-sm">{props.titlePrefix}</div>
                        : null
                }
                <div className="text-3xl font-semibold pb-1">
                    {props.title}
                </div>
            </div>
            {props.content
                ? <div className="ml-4">
                    {props.content}
                </div>
                : null
            }
        </div>
        <div className="pr-2 flex items-center text-md">
            <p className="pi pi-server mr-2 text-primary" style={{fontSize: "1rem"}}/>
            <div className="text-text mr-4">{hostIp}</div>
            <Button
                onClick={onLogoutHandler}
                icon="pi pi-sign-out" rounded text aria-label="Logout"/>
        </div>
    </div>;
}

export default header;
export const Header = header;