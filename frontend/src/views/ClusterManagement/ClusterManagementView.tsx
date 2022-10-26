import React, { useEffect, useRef } from 'react';
import Header from "@/components/Header";
import projectStore from "@/store/projectStore";
import { observer } from "mobx-react-lite";
import { useOnFirstMount } from "@/reactHooks";
import Block from "@/components/Block";
import { SaveKubeConfigDialog, SaveSshAuthorizationKeyDialog, SaveSshPrivateKeyDialog } from "@wails/project/Service";
import { LogDebug, LogError } from "@wails-runtime/runtime";
import NodesSection from "@/views/ClusterManagement/components/Nodes/NodesSection";
import { Sidebar } from "primereact/sidebar";
import uiPropertiesPanelStore from "@/store/uiPropertiesPanelStore";
import PropertiesPanel from "@/components/PropertiesPanel";

const collapsedContentStyle = {
    backgroundColor: "var(--surface-card)",
    borderColor: "#292524",
    borderWidth: "2px",
    borderRadius: "15px",
    padding: "15px"
}
const ClusterManagementView = () => {
    useOnFirstMount(async () => {
        await projectStore.loadProject()
        await projectStore.updateNodesStatus()
    })
    const nodesStatusRequestFinish = useRef(true);

    useEffect(() => {
        const readTaskLogInterval = setInterval(async () => {
            if (nodesStatusRequestFinish.current) {
                nodesStatusRequestFinish.current = false;
                let start= performance.now();
                await projectStore.updateNodesStatus()
                nodesStatusRequestFinish.current = true;
                LogDebug('Time taken to execute updateNodesStatus function: ['+ (performance.now()-start) +'] milliseconds');
            } else {
                LogDebug("Last update request took longer than expected. Skip next request.")
            }
        }, 5000);
        return () => {
            clearInterval(readTaskLogInterval);
        }
    }, [])

    const onSaveKubeConfig = async function () {
        try {
            await SaveKubeConfigDialog();
            LogDebug("kube config saved")
        } catch (err: any) {
            LogError(err)
        }
    }
    const onSaveSshPrivateKey = async function () {
        try {
            await SaveSshPrivateKeyDialog();
            LogDebug("ssh private key saved")
        } catch (err: any) {
            LogError(err)
        }

    }
    const onSaveSshAuthorizationKey = async function () {
        try {
            await SaveSshAuthorizationKeyDialog();
            LogDebug("ssh private key saved")
        } catch (err: any) {
            LogError(err)
        }
    }
    let onHideHandler = () => uiPropertiesPanelStore.hidePanel();
    return <>
        <Header title="Cluster management"/>
        <Sidebar visible={uiPropertiesPanelStore.isPanelVisible}
                 onHide={onHideHandler}
                 className="p-sidebar-md"
                 position="right">
            {uiPropertiesPanelStore.selectedPropertiesPanelKey &&
                <PropertiesPanel componentName={uiPropertiesPanelStore.selectedPropertiesPanelKey}/>}
        </Sidebar>
        <div className="flex justify-center">
            <div className="max-w-[1024px] w-[1024px]">
                <div className="w-full flex mt-10">
                    <div className="grow" style={collapsedContentStyle}>
                        <div className="flex mb-5">
                            <div className="flex flex-col">
                                <div className="text-xl my-3">
                                    User
                                </div>
                                <div className="mb-2">
                                    <span className="italic mr-2">Node Username:</span><span
                                    className="font-bold">{projectStore.generalSettings.nodeUsername}</span>
                                </div>

                                <div className="mb-2">
                                    <span className="italic mr-2">Node Password:</span><span
                                    className="font-bold">{projectStore.generalSettings.nodePassword}</span>
                                </div>
                                <div className="text-xl my-3">
                                    Storage
                                </div>
                                <div className="mb-2">
                                    <span className="italic mr-2">Disks size (GB):</span><span
                                    className="font-bold">{projectStore.generalSettings.nodeDiskSize} GB</span>
                                </div>
                            </div>
                            <div className="ml-10 flex flex-col">
                                <div className="text-xl my-3">
                                    Network
                                </div>
                                <div className="mb-2">
                                    <span className="italic mr-2">Proxmox network bridge:</span><span
                                    className="font-bold">{projectStore.generalSettings.network.bridge}</span>
                                </div>
                                <div className="mb-2">
                                    <span className="italic mr-2">Subnet mask (CIDR Notation):</span><span
                                    className="font-bold">{projectStore.generalSettings.network.subnetMask}</span>
                                </div>
                                <div className="mb-2">
                                    <span className="italic mr-2">Gateway:</span><span
                                    className="font-bold">{projectStore.generalSettings.network.gateway}</span>
                                </div>
                                <div>
                                    <span className="italic mr-2">DNS server:</span><span
                                    className="font-bold">{projectStore.generalSettings.network.dnsServer}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col ml-4">
                        <Block onClick={onSaveKubeConfig}
                               className="mb-4 flex justify-start items-center w-[310px]">
                            <div className="flex items-center justify-start p-2">
                                <i className="pi pi-cloud primary-text-color mr-4" style={{fontSize: "2rem"}}></i>
                                <span className="text-center">Save Kubernetes config</span>
                            </div>
                        </Block>
                        <Block onClick={onSaveSshPrivateKey}
                               className="mb-4 flex justify-start items-center w-[310px]">
                            <div className="flex items-center justify-start p-2">
                                <i className="pi pi-key primary-text-color mr-4" style={{fontSize: "2rem"}}></i>
                                <span className="text-center">Save ssh private key</span>
                            </div>
                        </Block>
                        <Block onClick={onSaveSshAuthorizationKey}
                               className="flex justify-start items-center w-[310px]">
                            <div className="flex items-center justify-start p-2">
                                <i className="pi pi-key primary-text-color mr-4" style={{fontSize: "2rem"}}></i>
                                <span className="text-center">Save ssh authorization key</span>
                            </div>
                        </Block>
                    </div>
                </div>
                <div className="border-t-2 border-stone-800 my-5 mt-20"/>
                <NodesSection nodes={projectStore.masterNodesWithStatus} title="Master nodes"
                              onAddNode={() => projectStore.addNode("master")}/>
                <div className="border-t-2 border-stone-800 my-5 mt-20"/>
                <NodesSection nodes={projectStore.workerNodesWithStatus} title="Workers nodes"
                              onAddNode={() => projectStore.addNode("worker")}/>
            </div>
        </div>
    </>;
};

export default observer(ClusterManagementView);