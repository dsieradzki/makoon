import React from 'react';
import VmStatusInfo from "@/views/clusters-management/components/nodes/VmStatusInfo";
import KubeStatusInfo from "@/views/clusters-management/components/nodes/KubeStatusInfo";
import {ClusterNode, VmStatus} from "@/api/model";
import {ProgressSpinner} from "primereact/progressspinner";
import {DataTable} from "primereact/datatable";
import {Column} from "primereact/column";
import {NodeWithStatus} from "@/store/cluster-management-store";


type Props = {
    clusterName: string
    nodes: NodeWithStatus[]
    selectedNode: string | null
    onSelectNode: (id: any) => void
}
const NodesTable = (props: Props) => {
    return <>
        <DataTable value={props.nodes}
                   emptyMessage="No nodes found"
                   dataKey="vmId"
                   selection={props.nodes.find((i) => i.vmId.toString() == props.selectedNode)}
                   onSelectionChange={(e) => props.onSelectNode((e.value as ClusterNode).vmId)}
                   tableStyle={{minWidth: '50rem'}} selectionMode="single" scrollable scrollHeight="flex">

            <Column field="name" header="Node name" className="font-semibold"
                    body={(r) => {
                        return <>
                            {
                                r.lock &&
                                <span className="mr-2">
                                            <ProgressSpinner style={{width: '15px', height: '15px'}} strokeWidth="10"/>
                                        </span>
                            }
                            {props.clusterName + "-" + r.name}</>
                    }}></Column>
            <Column field="vmId" header="VM Id"/>
            <Column field="cores" header="CPU" body={(r) => r.cores + " cores"}/>
            <Column field="memory" header="Memory" body={(r) => r.memory + " MB"}/>
            <Column field="ipAddress" header="IP Address"/>
            <Column field="storagePool" header="Storage"/>
            <Column field="vmStatus" header="VM"
                    body={(r) => <VmStatusInfo status={r.vmStatus}/>}/>
            <Column field="kubeStatus" header="K8S status"
                    body={(r) => <KubeStatusInfo status={r.kubeStatus}
                                                 vmStatusProblem={r.vmStatus == VmStatus.Stopped}/>}/>
        </DataTable>
    </>
};

export default NodesTable;