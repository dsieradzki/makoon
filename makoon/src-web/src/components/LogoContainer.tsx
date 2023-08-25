import React from 'react';
import logo from "../assets/images/makonn_logo_wh.svg";

const LogoContainer = (props: React.PropsWithChildren) => {
    return (
        <div className="p-5 flex flex-col items-center justify-center h-full">
            <div className="flex bg-white rounded-2xl">
                <div className="hidden md:flex bg-primary flex-col justify-center items-center p-12 rounded-l-2xl">
                    <div className="w-full flex justify-center -mt-16 -ml-6 mb-8">
                        <div className="w-full max-w-[800px]">
                            <div className="flex text-4xl text-primary-text items-end">
                                <span className="font-">M</span>akoon
                                <div className="text-left text-sm text-primary-text ml-1 mb-[2px]">v{APP_VERSION}</div>
                            </div>
                            <div className="flex flex-col justify-center text-primary-text text-sm">
                                <div className="text-left nowrap whitespace-nowrap">Kubernetes Cluster Management for Proxmox VE</div>
                            </div>
                        </div>
                    </div>

                    <img title="Makoon" alt="Makoon logo" src={logo} width={250} height={250}/>
                </div>
                <div className="flex flex-col ml-10 p-12">
                    {props.children}
                </div>
            </div>
        </div>
    );
};

export default LogoContainer;