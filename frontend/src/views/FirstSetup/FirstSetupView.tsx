import React from 'react';
import Header from "@/components/Header";
import Panel from "@/components/Panel";
import { useNavigate } from "react-router-dom";
import Block from "@/components/Block";
import { AcceptAndSetupApp } from "@wails/database/Service";
import { LOG_FILE_NAME_1, LOG_FILE_NAME_2 } from "@/constants";
import { apiCall } from "@/utils/api";

const FirstSetupView = () => {
    const navigate = useNavigate()
    return <>
        <Header title="First setup"/>

        <div className="flex justify-center">
            <div className="max-w-[1024px] w-[1024px]">
                <div className="w-full flex flex-col mt-10">
                    <div className="text-2xl mb-5">Application needs to store data to work properly, please get familiar
                        with information below.
                    </div>

                    <div className="text-lg font-bold">Remote: <span className="text-sm italic text-stone-600">(home directory in Proxmox)</span>
                    </div>
                    <div className="mt-4">
                        <Panel className="mb-4">
                            <div>~/k4prox/k4prox-db.yaml</div>

                            <div className="italic text-stone-600 mt-1">
                                Main configuration file used by K4Prox, this file will contain cluster configs, SSH
                                keys and passwords for your K8S nodes.<br/>
                            </div>
                        </Panel>
                        <Panel>
                            <div>~/k4prox/&lt;ubuntu_cloud&gt;.img</div>

                            <div className="italic text-stone-600 mt-1">
                                Ubuntu cloud image, will be imported as hard disk for Kubernetes nodes.
                            </div>
                        </Panel>
                    </div>
                    <div className="text-lg font-bold mt-4">Local: <span className="text-sm italic text-stone-600">(local home directory)</span>
                    </div>
                    <div className="mt-4">
                        <Panel className="mb-4">
                            <div>
                                <div>{LOG_FILE_NAME_1} <span
                                    className="text-sm italic text-stone-600">- Windows, Linux</span>
                                </div>
                                <div>{LOG_FILE_NAME_2} <span className="text-sm italic text-stone-600">- macOS</span>
                                </div>
                            </div>

                            <div className="italic text-stone-600 mt-1">
                                Log file can help with troubleshooting when something went wrong.
                            </div>
                        </Panel>
                    </div>
                    <div className="flex justify-center">
                        <Block
                            onClick={async () => {
                                await apiCall(() => AcceptAndSetupApp())
                                navigate("/list")
                            }}
                            tooltip="Cancel"
                            className="flex justify-center items-center h-[76px]">

                            <div
                                className="flex items-center justify-start p-2 primary-text-color">
                                <i className={`pi pi-check mr-4`}
                                   style={{fontSize: "1.5rem"}}></i>
                                <span className="text-center">Accept</span>
                            </div>
                        </Block>
                    </div>
                </div>
            </div>
        </div>
    </>
};

export default FirstSetupView;