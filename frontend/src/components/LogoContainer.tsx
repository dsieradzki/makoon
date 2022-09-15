import React from 'react';


const LogoContainer = (props: React.PropsWithChildren) => {
    return (
        <div className="p-5 flex flex-col items-center justify-center h-full">
            <div className="flex items-center">
                <div>
                    <div className="text-9xl">K<span className="primary-text-color font-bold">4</span>Prox</div>
                    <div className="flex justify-between">
                        <div>Kubernetes Manager for Proxmox</div>
                        <div className="font-bold">v{APP_VERSION}</div>
                    </div>
                </div>
                <div className="primary-text-color font-extralight" style={{fontSize: "300px"}}>/</div>
                <div className="flex flex-col ml-10">
                    {props.children}
                </div>
            </div>
        </div>
    );
};

export default LogoContainer;