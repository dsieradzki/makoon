import React, { useEffect, useRef, useState } from 'react';
import Header from "@/components/Header";
import { observer } from "mobx-react-lite";
import { useOnFirstMount } from "@/utils/hooks";
import Block from "@/components/Block";
import { LogDebug } from "@wails-runtime/runtime";
import NodesSection from "@/views/ClusterManagement/components/Nodes/NodesSection";
import { Sidebar } from "primereact/sidebar";
import uiPropertiesPanelStore from "@/store/uiPropertiesPanelStore";
import PropertiesPanel from "@/components/PropertiesPanel";
import { useNavigate, useParams } from "react-router-dom";
import { SaveKubeConfigDialog, SaveSshAuthorizationKeyDialog, SaveSshPrivateKeyDialog } from "@wails/database/Service";
import clusterManagementStore from "@/store/clusterManagementStore";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import HiddenPassword from "@/components/HiddenPassword";
import { DeleteCluster } from "@wails/management/Service";
import { ProgressSpinner } from "primereact/progressspinner";
import Panel from "@/components/Panel";
import { apiCall } from "@/utils/api";
import processingIndicatorStoreUi from "@/store/processingIndicatorStoreUi";


const LOADING_INDICATOR_DELETE_CLUSTER = "DELETE_CLUSTER";
const ClusterManagementView = () => {
    const navigate = useNavigate()
    let {clusterName} = useParams();

    const clusterNameParam = clusterName || ""

    useOnFirstMount(async () => {
        await clusterManagementStore.loadProject(clusterNameParam)
        await clusterManagementStore.updateNodesStatus()
    })
    const nodesStatusRequestFinish = useRef(true);
    const [showDeleteCluster, setShowDeleteCluster] = useState(false)
    const [clusterNameToConfirmDelete, setClusterNameToConfirmDelete] = useState("")
    const deletionInProgress = processingIndicatorStoreUi.status(LOADING_INDICATOR_DELETE_CLUSTER)

    useEffect(() => {
        const readTaskLogInterval = setInterval(async () => {
            if (nodesStatusRequestFinish.current) {
                nodesStatusRequestFinish.current = false;
                let start = performance.now();
                await clusterManagementStore.updateNodesStatus()
                nodesStatusRequestFinish.current = true;
                LogDebug('Time taken to execute updateNodesStatus function: [' + (performance.now() - start) + '] milliseconds');
            } else {
                LogDebug("Last update request took longer than expected. Skip next request.")
            }
        }, 5000);
        return () => {
            clearInterval(readTaskLogInterval);
        }
    }, [])

    const onSaveKubeConfig = async function () {
        await apiCall(() => SaveKubeConfigDialog(clusterNameParam))
        LogDebug("kube config saved")
    }

    const onClusterDeleteConfirmation = () => {
        setShowDeleteCluster(true)
    }
    const isClusterNameMatch = clusterNameToConfirmDelete == clusterManagementStore.cluster.clusterName

    const onClusterDelete = async () => {
        await apiCall(() => DeleteCluster(clusterManagementStore.cluster.clusterName), LOADING_INDICATOR_DELETE_CLUSTER)
        setShowDeleteCluster(false)
        navigate("/list")
    }
    const onSaveSshPrivateKey = async function () {
        await apiCall(() => SaveSshPrivateKeyDialog(clusterNameParam))
        LogDebug("ssh private key saved")
    }

    const onSaveSshAuthorizationKey = async function () {
        await apiCall(() => SaveSshAuthorizationKeyDialog(clusterNameParam))
        LogDebug("ssh private key saved")
    }

    let onHideHandler = () => uiPropertiesPanelStore.hidePanel();
    return <>
        <Header title="Cluster management" titlePath={[clusterManagementStore.cluster.clusterName]}/>
        <Sidebar visible={uiPropertiesPanelStore.isPanelVisible}
                 onHide={onHideHandler}
                 className="p-sidebar-md"
                 position="right">
            {uiPropertiesPanelStore.selectedPropertiesPanelKey &&
                <PropertiesPanel componentName={uiPropertiesPanelStore.selectedPropertiesPanelKey}/>}
        </Sidebar>
        <Dialog header="Are you sure?"
                footer={
                    <div>
                        <Button disabled={deletionInProgress} label="No" className="p-button-text" icon="pi pi-times"
                                onClick={() => {
                                    setShowDeleteCluster(false)
                                }}/>
                        <Button disabled={!isClusterNameMatch || deletionInProgress} label="Yes" icon="pi pi-check"
                                onClick={onClusterDelete}/>
                    </div>}
                visible={showDeleteCluster}
                modal
                draggable={false}
                onHide={() => {
                    if (!deletionInProgress) {
                        setShowDeleteCluster(false)
                    }
                }}>
            {
                !deletionInProgress &&
                <div className="p-5">
                    <div className="mb-4 text-2xl">All VM's will be deleted.</div>
                    <div>To confirm, fill cluster name:</div>
                    <InputText value={clusterNameToConfirmDelete}
                               onChange={event => setClusterNameToConfirmDelete(event.target.value)}
                               className="w-full"/>
                </div>
            }
            {
                deletionInProgress &&
                <div className="flex flex-col items-center justify-center">
                    <ProgressSpinner strokeWidth="8"/>
                    <span className="mt-5 text-center">Deleting cluster...</span>
                </div>
            }
        </Dialog>
        <div className="flex justify-center">
            <div className="max-w-[1024px] w-[1024px]">
                <div className="w-full flex mt-10">
                    <div className="mr-4">
                        <Block onClick={() => {
                            navigate("/list")
                        }}
                               tooltip="Back to cluster list"
                               className="flex justify-center items-center w-[76px] h-[76px]">
                            <i className="pi pi-arrow-left primary-text-color" style={{fontSize: "1.5rem"}}></i>
                        </Block>
                    </div>
                    <Panel className="grow">
                        <div className="flex mb-5">
                            <div className="flex flex-col">
                                <div className="text-xl my-3">
                                    Nodes
                                </div>
                                <div className="mb-2">
                                    <span className="italic mr-2">Username:</span><span
                                    className="font-bold">{clusterManagementStore.cluster.nodeUsername}</span>
                                </div>

                                <div className="mb-2">
                                    <span className="italic mr-2">Password:</span><span
                                    className="font-bold">
                                    <HiddenPassword password={clusterManagementStore.cluster.nodePassword}/>
                                </span>
                                </div>
                                <div className="mb-2">
                                    <span className="italic mr-2">Disk size:</span><span
                                    className="font-bold">{clusterManagementStore.cluster.nodeDiskSize} GB</span>
                                </div>
                            </div>
                            <div className="ml-10 flex flex-col">
                                <div className="text-xl my-3">
                                    Network
                                </div>
                                <div className="mb-2">
                                    <span className="italic mr-2">Network bridge:</span><span
                                    className="font-bold">{clusterManagementStore.cluster.network?.bridge}</span>
                                </div>
                                <div className="mb-2">
                                    <span className="italic mr-2">Subnet mask:</span><span
                                    className="font-bold">{clusterManagementStore.cluster.network?.subnetMask}</span>
                                </div>
                                <div className="mb-2">
                                    <span className="italic mr-2">Gateway:</span><span
                                    className="font-bold">{clusterManagementStore.cluster.network?.gateway}</span>
                                </div>
                                <div>
                                    <span className="italic mr-2">DNS server:</span><span
                                    className="font-bold">{clusterManagementStore.cluster.network?.dnsServer}</span>
                                </div>
                            </div>
                        </div>
                    </Panel>
                    <div className="flex flex-col ml-4">
                        <div className="flex">
                            <Block onClick={onSaveKubeConfig}
                                   className="mb-4 flex justify-start items-center w-[300px] mr-4">
                                <div className="flex items-center justify-start p-2">
                                    <i className="pi pi-cloud primary-text-color mr-4" style={{fontSize: "2rem"}}></i>
                                    <span className="text-center">Export Kubernetes config</span>
                                </div>
                            </Block>
                            <Block onClick={onClusterDeleteConfirmation}
                                   tooltip="Delete cluster"
                                   className="flex justify-center items-center w-[76px] mb-4">
                                <i className="pi pi-trash danger" style={{fontSize: "1.5rem"}}></i>
                            </Block>
                        </div>

                        <Block onClick={onSaveSshPrivateKey}
                               className="mb-4 flex justify-start items-center ">
                            <div className="flex items-center justify-start p-2">
                                <i className="pi pi-key primary-text-color mr-4" style={{fontSize: "2rem"}}></i>
                                <span className="text-center">Export ssh private key</span>
                            </div>
                        </Block>
                        <Block onClick={onSaveSshAuthorizationKey}
                               className="flex justify-start items-center">
                            <div className="flex items-center justify-start p-2">
                                <i className="pi pi-key primary-text-color mr-4" style={{fontSize: "2rem"}}></i>
                                <span className="text-center">Export ssh authorization key</span>
                            </div>
                        </Block>
                    </div>
                </div>
                <div className="border-t-2 border-stone-800 my-5 mt-20"/>
                <NodesSection nodes={clusterManagementStore.masterNodesWithStatus} title="Master nodes"
                              onAddNode={() => {
                              }}/>
                <div className="border-t-2 border-stone-800 my-5 mt-20"/>
                <NodesSection nodes={clusterManagementStore.workerNodesWithStatus} title="Workers nodes"
                              onAddNode={() => {
                              }}/>
            </div>
        </div>
    </>;
};

export default observer(ClusterManagementView);