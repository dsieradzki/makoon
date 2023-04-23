import React, { useEffect, useState } from 'react';
import Header from "@/components/Header";
import { observer } from "mobx-react-lite";
import { useOnFirstMount } from "@/utils/hooks";
import Block from "@/components/Block";
import { Sidebar } from "primereact/sidebar";
import uiPropertiesPanelStore from "@/store/uiPropertiesPanelStore";
import PropertiesPanel from "@/components/PropertiesPanel";
import { useNavigate, useParams } from "react-router-dom";
import clusterManagementStore from "@/store/clusterManagementStore";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import HiddenPassword from "@/components/HiddenPassword";
import { ProgressSpinner } from "primereact/progressspinner";
import Panel from "@/components/Panel";
import { apiCall } from "@/utils/api";
import processingIndicatorStoreUi from "@/store/processingIndicatorStoreUi";
import Nodes from "@/views/ClusterManagement/components/Nodes/Nodes";
import Apps from "@/views/ClusterManagement/components/Apps/Apps";
import Logs from "@/views/ClusterManagement/components/Logs/Logs";
import api from "@/api/api";
import { ClusterStatus } from "@/api/model";
import * as cluster from "cluster";


const LOADING_INDICATOR_DELETE_CLUSTER = "DELETE_CLUSTER";

enum SelectedView {
    NODES,
    APPS,
    LOGS
}

const ClusterManagementView = () => {
    const navigate = useNavigate()
    let {clusterName} = useParams();

    const clusterNameParam = clusterName || ""

    useOnFirstMount(async () => {
        await clusterManagementStore.loadProject(clusterNameParam);
    })

    const [showDeleteCluster, setShowDeleteCluster] = useState(false)
    const [clusterNameToConfirmDelete, setClusterNameToConfirmDelete] = useState("")
    const [selectedTab, setSelectedTab] = useState<SelectedView>(SelectedView.NODES)
    const deletionInProgress = processingIndicatorStoreUi.status(LOADING_INDICATOR_DELETE_CLUSTER)
    const blockingOperationInProgress = clusterManagementStore.cluster.status == ClusterStatus.Creating || clusterManagementStore.cluster.status == ClusterStatus.Destroying;

    useEffect(() => {
        if (blockingOperationInProgress) {
            setSelectedTab(SelectedView.LOGS);
        }
    }, [clusterManagementStore.cluster.status])

    const onClusterDeleteConfirmation = () => {
        setShowDeleteCluster(true)
    }
    const isClusterNameMatch = clusterNameToConfirmDelete == clusterManagementStore.cluster.clusterName

    const onClusterDelete = async () => {
        await apiCall(() => api.clusters.deleteCluster(clusterManagementStore.cluster.clusterName), LOADING_INDICATOR_DELETE_CLUSTER)
        setShowDeleteCluster(false)
        navigate("/list")
    }

    const onHideHandler = () => {
        if (!uiPropertiesPanelStore.isBlocked()) {
            uiPropertiesPanelStore.hidePanel();
        }
    }

    const renderSelectedTab = () => {
        switch (selectedTab) {
            case SelectedView.NODES:
                return <Nodes/>
            case SelectedView.APPS:
                return <Apps/>
            case SelectedView.LOGS:
                return <Logs/>
        }
    }
    return <>
        <Header title="Clusters" titlePath={[clusterManagementStore.cluster.clusterName]}/>
        <Sidebar visible={uiPropertiesPanelStore.isPanelVisible}
                 onHide={onHideHandler}
                 className="p-sidebar-lg"
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
                               className="flex justify-center items-center w-[76px] h-[260px]">
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
                                    className="font-bold">{clusterManagementStore.cluster.diskSize} GB</span>
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
                                    className="font-bold">{clusterManagementStore.cluster.network?.dns}</span>
                                </div>
                            </div>
                        </div>
                    </Panel>
                    <div className="flex flex-col">
                        <div className="flex">
                            <a className={blockingOperationInProgress ? "pointer-events-none" : ""}
                               href={`/api/v1/clusters/${clusterManagementStore.cluster.clusterName}/export/kubeconfig`}>
                                <Block
                                    notActive={blockingOperationInProgress}
                                    className="mb-4 flex justify-start items-center w-[300px] mr-4">
                                    <div className="flex items-center justify-start p-2">
                                        <i className={`pi pi-cloud ${blockingOperationInProgress ? "text-stone-400" : "primary-text-color"} mr-4`}
                                           style={{fontSize: "2rem"}}></i>
                                        <span
                                            className={`text-center ${blockingOperationInProgress ? "text-stone-400" : ""}`}>Export Kubernetes config</span>
                                    </div>
                                </Block>
                            </a>
                            <Block onClick={onClusterDeleteConfirmation}
                                   tooltip="Delete cluster"
                                   className="flex justify-center items-center w-[76px] mb-4">
                                <i className={`pi pi-trash ${blockingOperationInProgress ? "text-stone-400" : "danger"}`}
                                   style={{fontSize: "1.5rem"}}></i>
                            </Block>
                        </div>
                        <a className={blockingOperationInProgress ? "pointer-events-none" : ""}
                           href={`/api/v1/clusters/${clusterManagementStore.cluster.clusterName}/export/privatekey`}>
                            <Block
                                notActive={blockingOperationInProgress}
                                className="mb-4 flex justify-start items-center ">
                                <div className="flex items-center justify-start p-2">
                                    <i className={`pi pi-key mr-4 ${blockingOperationInProgress ? "text-stone-400" : "primary-text-color"}`}
                                       style={{fontSize: "2rem"}}></i>
                                    <span
                                        className={`text-center ${blockingOperationInProgress ? "text-stone-400" : ""}`}>Export ssh private key</span>
                                </div>
                            </Block>
                        </a>

                        <a className={blockingOperationInProgress ? "pointer-events-none" : ""}
                           href={`/api/v1/clusters/${clusterManagementStore.cluster.clusterName}/export/publickey`}>
                            <Block
                                notActive={blockingOperationInProgress}
                                className="flex justify-start items-center">
                                <div className="flex items-center justify-start p-2">
                                    <i className={`pi pi-key ${blockingOperationInProgress ? "text-stone-400" : "primary-text-color"} mr-4`}
                                       style={{fontSize: "2rem"}}></i>
                                    <span
                                        className={`text-center ${blockingOperationInProgress ? "text-stone-400" : ""}`}>Export ssh authorization key</span>
                                </div>
                            </Block>
                        </a>
                    </div>
                </div>
                <div>
                    <div className="flex items-center justify-center mt-20">
                        <Block
                            notActive={blockingOperationInProgress}
                            onClick={() => {
                                setSelectedTab(SelectedView.NODES)
                            }}
                            selected={selectedTab == SelectedView.NODES}
                            className="mb-4 flex justify-start items-center mr-4 w-full">
                            <div className="flex items-center justify-start p-2">
                                <i className={`pi pi-server ${blockingOperationInProgress ? "text-stone-400" : "primary-text-color"} mr-4`}
                                   style={{fontSize: "2rem"}}></i>
                                <span
                                    className={`text-center ${blockingOperationInProgress ? "text-stone-400" : ""}`}>Nodes</span>
                            </div>
                        </Block>

                        <Block
                            notActive={blockingOperationInProgress}
                            onClick={() => {
                                setSelectedTab(SelectedView.APPS)
                            }}
                            selected={selectedTab == SelectedView.APPS}
                            className="mb-4 mr-4 flex justify-start items-center w-full">
                            <div className="flex items-center justify-start p-2">
                                <i className={`pi pi-desktop ${blockingOperationInProgress ? "text-stone-400" : "primary-text-color"} mr-4`}
                                   style={{fontSize: "2rem"}}></i>
                                <span
                                    className={`text-center ${blockingOperationInProgress ? "text-stone-400" : ""}`}>Apps</span>
                            </div>
                        </Block>
                        <Block
                            onClick={() => {
                                setSelectedTab(SelectedView.LOGS)
                            }}
                            selected={selectedTab == SelectedView.LOGS}
                            className="mb-4 flex justify-start items-center w-full">
                            <div className="flex items-center justify-start p-2">
                                <i className="pi pi-info-circle primary-text-color mr-4" style={{fontSize: "2rem"}}></i>
                                <span className="text-center">Logs</span>
                            </div>
                        </Block>
                    </div>
                </div>
                <div className="border-t-2 border-stone-800 my-5 mt-4"/>
                {renderSelectedTab()}
            </div>
        </div>
    </>;
};

export default observer(ClusterManagementView);