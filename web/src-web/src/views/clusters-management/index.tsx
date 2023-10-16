import {observer} from "mobx-react-lite";
import React, {useState} from "react";
import MainContainer from "@/components/MainContainer";
import {NavLink, Outlet, useNavigate, useParams} from "react-router-dom";
import Content from "@/components/Content";
import {useOnFirstMount} from "@/utils/hooks";
import {Button} from "primereact/button";
import {InputText} from "primereact/inputtext";
import {ProgressSpinner} from "primereact/progressspinner";
import {Dialog} from "primereact/dialog";
import processingIndicatorStore from "@/store/processing-indicator-store";
import {apiCall} from "@/utils/api";
import api from "@/api/api";
import {ClusterStatus} from "@/api/model";
import clusterManagementStore from "@/store/cluster-management-store";

const LOADING_INDICATOR_DELETE_CLUSTER = "DELETE_CLUSTER";

const SubMenu = (props: { icon: string, name: string, to: string }) => {
    return <NavLink to={props.to} className={({isActive}) => {
        return `mt-1 flex items-center py-2 pl-4 pr-2 rounded-xl ${isActive ? "bg-primary text-primary-text" : "text-text"}`
    }} title={props.name}>
        <i className={`pi mr-2 ${props.icon}`}></i>
        <span className="ml-1 hidden md:block">{props.name}</span>
    </NavLink>
}

const SubMenuLinkButton = (props: { icon: string, name: string, onClick: () => void, classNameText?: string, disabled?: boolean }) => {
    return <div className={`flex items-center mt-4 pl-4 ${!props.disabled ? props.classNameText ?? "text-text" : "text-surface-300"}`}
                onClick={() => {
                    !props.disabled && props.onClick();
                }}
                title={props.name}>
        <i className={`pi mr-3 ${props.icon}`}></i>
        <span className="hover:underline hover:cursor-pointer hidden md:block">{props.name}</span>
    </div>
}

const SubMenuLink = (props: { icon: string, name: string, href: string, classNameText?: string }) => {
    return <a href={props.href} className={`flex items-center whitespace-nowrap mt-4 pl-4 ${props.classNameText ?? "text-text"}`}
              title={props.name}
    >
        <i className={`mr-3 pi ${props.icon}`}></i>
        <span className="hidden md:block">{props.name}</span>
    </a>
}
const ClusterManagement = () => {
    const navigate = useNavigate();
    let {clusterName} = useParams();

    const locked = clusterManagementStore.cluster.status != ClusterStatus.Sync
        && clusterManagementStore.cluster.status != ClusterStatus.Error

    useOnFirstMount(async () => {
        if (clusterName) {
            try {
                await clusterManagementStore.loadProject(clusterName);
            } catch (_: any) {
                navigate("/list");
            }
        } else {
            navigate("/list");
        }
    });
    const [showDeleteCluster, setShowDeleteCluster] = useState(false)
    const deletionInProgress = processingIndicatorStore.status(LOADING_INDICATOR_DELETE_CLUSTER)
    const [clusterNameToConfirmDelete, setClusterNameToConfirmDelete] = useState("")
    const isClusterNameMatch = clusterNameToConfirmDelete == clusterManagementStore.cluster.clusterName
    const onClusterDelete = async () => {
        await apiCall(() => api.clusters.deleteCluster(clusterManagementStore.cluster.clusterName), LOADING_INDICATOR_DELETE_CLUSTER)
        setShowDeleteCluster(false)
        navigate("/list")
    }
    return <MainContainer>
        <div className="-ml-12 h-full flex">
            <div className="h-full bg-white rounded-r-2xl py-8 pl-8 pr-4 flex flex-col text-md">
                <SubMenu icon="pi-server" name="Nodes" to={"nodes"}/>
                <SubMenu icon="pi-desktop" name="Helm apps" to={"apps"}/>
                <SubMenu icon="pi-desktop" name="Workloads" to={"workloads"}/>
                <SubMenu icon="pi-info-circle" name="Logs" to={"logs"}/>

                <div className="grow"></div>

                <SubMenuLink icon="pi-cloud"
                             name="Export kubeconfig"
                             href={`/api/v1/clusters/${clusterManagementStore.cluster.clusterName}/export/kubeconfig`}/>
                <SubMenuLink icon="pi-key"
                             name="Export SSH private key"
                             href={`/api/v1/clusters/${clusterManagementStore.cluster.clusterName}/export/privatekey`}
                />
                <SubMenuLink icon="pi-key"
                             name="Export SSH auth key"
                             href={`/api/v1/clusters/${clusterManagementStore.cluster.clusterName}/export/publickey`}
                />

                <SubMenuLinkButton disabled={locked} icon="pi-trash" name="Destroy" classNameText="text-danger" onClick={() => {
                    setShowDeleteCluster(true);
                }}/>
            </div>
            <Content header={{
                titlePrefix: "Cluster",
                title: clusterName ?? ""
            }}
                     className="pr-0">

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
                <Outlet/>
            </Content>
        </div>
    </MainContainer>
};

export default observer(ClusterManagement);
