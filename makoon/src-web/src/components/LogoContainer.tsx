import React from 'react';
import logo from "../assets/images/makonn_logo.svg";

const LogoContainer = (props: React.PropsWithChildren) => {
    return (
        <div className="p-5 flex flex-col items-center justify-center h-full">
            <div className="w-full flex justify-center">
                <div className="w-full max-w-[800px]">
                    <div className="flex text-5xl primary-text-color items-end">
                        <span className="font-">M</span>akoon
                        <div className="text-left text-sm text-stone-600 ml-1 mb-[2px]">v{APP_VERSION}</div>
                    </div>
                    <div className="flex flex-col justify-center">
                        <div className="text-left">Kubernetes Cluster Management for Proxmox VE</div>
                    </div>
                </div>
            </div>
            <div className="flex items-center">
                <img title="Makoon" alt="Makoon logo" className="mb-10" src={logo} width={250} height={250}/>
                <div className="primary-text-color font-extralight" style={{fontSize: "300px"}}>/</div>
                <div className="flex flex-col ml-10">
                    {props.children}
                </div>
            </div>
        </div>
    );
};

export default LogoContainer;