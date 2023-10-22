import Panel from "@/components/Panel";
import React, {useEffect, useRef, useState} from "react";
import HiddenPassword from "@/components/HiddenPassword";
import {observer} from "mobx-react-lite";
import {useInterval, useOnFirstMount} from "@/utils/hooks";
import {Button} from "primereact/button";
import {ClusterNodeType, ClusterState, ClusterStatus} from "@/api/model";
import clusterManagementStore from "@/store/cluster-management-store";
import AddNodeDialog from "@/views/clusters-management/components/nodes/AddNodeDialog";
import NodesTable from "@/views/clusters-management/components/nodes/NodesTable";
import EditNodeDialog from "@/views/clusters-management/components/nodes/EditNodeDialog";

const Nodes = () => {
    useOnFirstMount(async () => {
        await clusterManagementStore.updateClusterNodeVmStatuses();
        await clusterManagementStore.updateClusterKubeStatuses();
    });

    useInterval(async () => {
        await clusterManagementStore.updateClusterNodeVmStatuses();
        await clusterManagementStore.updateClusterKubeStatuses();
        await clusterManagementStore.updateNodesIfThereIsAnyLock();
    });

    const locked = clusterManagementStore.cluster.status?.state != ClusterState.Sync;
    const [showAddNodeDialog, setShowAddNodeDialog] = useState(false);
    const [addNoteType, setAddNodeType] = useState<ClusterNodeType>(ClusterNodeType.Master);
    const addNodeDialog = showAddNodeDialog ? <AddNodeDialog nodeType={addNoteType} setVisible={setShowAddNodeDialog}/> : null;
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    return <>
        {addNodeDialog}
        <Panel title="Details" icon="pi-server" className="mb-8">
            <div className="flex justify-evenly">
                <div className="grow flex justify-evenly flex-col md:flex-row">
                    <div className="flex flex-col justify-center">
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
                            className="font-bold">{clusterManagementStore.cluster.diskSize} GiB</span>
                        </div>

                        <div className="mb-2">
                            <span className="italic mr-2">MicroK8S version:</span><span
                            className="font-bold">{clusterManagementStore.cluster.kubeVersion}</span>
                        </div>
                    </div>
                    <span className="border-r-2 border-bg rounded-full w-[0px] hidden md:block"></span>
                    <div className="flex flex-col justify-center py-4">
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

                <span className="border-r-2 border-bg rounded-full w-[0px] hidden md:block"></span>
                <div className="grow flex flex-col 2xl:flex-row items-center justify-center 2xl:justify-evenly">
                    <div className="m-4 flex flex-col items-center justify-center">
                        <div className="text-3xl flex items-center">
                            {clusterManagementStore.cpuSum}
                            <div className="relative" style={{top: "-10px", left: "5px"}}>
                                <div className="absolute text-sm">cores</div>
                            </div>
                        </div>
                        <div className="text-sm">CPU</div>
                    </div>


                    <div className="m-4 flex flex-col items-center justify-center">
                        <div className="text-3xl flex items-center">
                            {clusterManagementStore.ramSum}
                            <div className="relative" style={{top: "-10px", left: "5px"}}>
                                <div className="absolute text-sm">MiB</div>
                            </div>
                        </div>
                        <div className="text-sm">MEMORY</div>
                    </div>


                    <div className="m-4 flex flex-col items-center justify-center">
                        <div className="text-3xl flex items-center">
                            {clusterManagementStore.disksSizeSum}
                            <div className="relative" style={{top: "-10px", left: "5px"}}>
                                <div className="absolute text-sm">GiB</div>
                            </div>
                        </div>
                        <div className="text-sm">STORAGE</div>
                    </div>
                </div>
            </div>
        </Panel>
        {
            selectedNode
                ? <EditNodeDialog vmId={selectedNode} setVisible={(v: boolean) => {
                    if (!v) {
                        setSelectedNode(null);
                    }
                }}/>
                : null
        }
        <Panel
            title={<Panel.Title value="Master nodes">
                <Button disabled={locked} icon="pi pi-plus" rounded outlined aria-label="Add node"
                        onClick={() => {
                            setAddNodeType(ClusterNodeType.Master);
                            setShowAddNodeDialog(true);
                        }}/>
            </Panel.Title>}
            icon="pi-server"
            className="mb-4 grow min-h-[170px]">
            <NodesTable clusterName={clusterManagementStore.cluster.clusterName}
                        nodes={clusterManagementStore.masterNodesWithStatus}
                        selectedNode={selectedNode}
                        onSelectNode={(id) => {
                            if (!locked) {
                                setSelectedNode(id);
                            }
                        }}/>


        </Panel>

        <Panel
            title={<Panel.Title value="Worker nodes">
                <Button disabled={locked} icon="pi pi-plus" rounded outlined aria-label="Add node"
                        onClick={() => {
                            setAddNodeType(ClusterNodeType.Worker);
                            setShowAddNodeDialog(true);
                        }}/>
            </Panel.Title>}
            icon="pi-server"
            className="grow min-h-[170px]">
            <NodesTable clusterName={clusterManagementStore.cluster.clusterName}
                        nodes={clusterManagementStore.workerNodesWithStatus}
                        selectedNode={selectedNode}
                        onSelectNode={(id) => {
                            if (!locked) {
                                setSelectedNode(id);
                            }
                        }}/>
        </Panel>
    </>;
}

export default observer(Nodes);