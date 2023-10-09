import logo from "../assets/images/makonn_logo_wh.svg";
import {Link, NavLink} from "react-router-dom";
import {useState} from "react";
import {useOnFirstMount} from "@/utils/hooks";
import api from "@/api/api";


type MenuItemProps = {
    active?: boolean
    name: string
    icon: string
    to: string
}
const MenuItem = (props: MenuItemProps) => {
    return props.active
        ? <NavLink to={props.to} className="bg-white rounded-xl flex items-center justify-start p-3 text-primary-darker">
            <i className={`pi ml-4 mr-5 text-primary ${props.icon}`}></i>
            <div className="font-semibold">{props.name}</div>
        </NavLink>

        : <NavLink to={props.to} className="text-white flex items-center justify-start p-3 mt-3">
            <i className={`pi ml-4 mr-5 ${props.icon}`}></i>
            <div>{props.name}</div>
        </NavLink>
}

const MainMenu = () => {
    const [hostIp, setHostIp] = useState("");

    // TODO: move this to global place
    useOnFirstMount(async () => {
        setHostIp(await api.auth.getLoggedInHostIp());
    });

    return <div className="h-full min-w-[250px] p-3 rounded-2xl shadow shadow-blue-300 flex flex-col bg-primary z-10">
        <div className="mt-3 mb-8 flex justify-center items-center font-bold">
            <img className="mr-2" src={logo} width={50} height={50}/>
            <div className="text-white">Makoon</div>
        </div>
        <div className="grow min-h-0 overflow-x-hidden overflow-y-auto">
            <MenuItem name="Clusters" to="/list" active icon="pi-th-large"/>
            {/*<MenuItem name="Templates" to="/list" icon="pi-box"/>*/}
            {/*<MenuItem name="App stacks" to="/list" icon="pi-box"/>*/}
            {/*<MenuItem name="Settings" to="/list" icon="pi-cog"/>*/}

            <div className="text-white flex items-center justify-start p-3 mt-3">
                <a href={`https://${hostIp}:8006`} target="_blank" className="flex items-center">
                    <i className="pi pi-external-link ml-4 mr-5"></i>
                    <div className="underline">Proxmox</div>
                </a>
            </div>
        </div>
        <div className="grow w-full flex items-end justify-center text-white px-3">
            <a href="https://github.com/dsieradzki/makoon" target="_blank" className="text-sm underline">v{APP_VERSION}</a>
        </div>
    </div>
}

export default MainMenu;
