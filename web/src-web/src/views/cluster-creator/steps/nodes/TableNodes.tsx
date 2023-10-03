import React from 'react';
import {ClusterNode} from "@/api/model";
import {DataTable} from "primereact/datatable";
import {Column} from "primereact/column";


type Props = {
    nodes: ClusterNode[]
    clusterName: string
    selectedId: string | null
    onClick: (id: any) => void
}
const TableNodes = (props: Props) => {
    return <>
        <DataTable value={props.nodes}
                   emptyMessage="No nodes found"
                   dataKey="vmId"
                   selection={props.nodes.find((i) => i.vmId.toString() == props.selectedId)}
                   onSelectionChange={(e) => props.onClick((e.value as ClusterNode).vmId)}
                   tableStyle={{minWidth: '50rem'}} selectionMode="single" scrollable scrollHeight="flex">

            <Column field="name" header="Node name" className="font-semibold" body={(r) => props.clusterName + "-" + r.name}></Column>
            <Column field="vmId" header="VM Id"></Column>
            <Column field="cores" header="CPU" body={(r) => r.cores + " cores"}></Column>
            <Column field="memory" header="Memory" body={(r) => r.memory + " MB"}></Column>
            <Column field="ipAddress" header="IP Address" body={(r) => <div>
                <span>{r.ipAddress}</span>
                <p className="ml-2 pi pi-exclamation-triangle text-warning"
                   title="Please verify IP availability on you network. Pinging hosts during project generation not guarantee IP availability."
                   style={{fontSize: "1rem"}}></p>
            </div>}></Column>
            <Column field="storagePool" header="Storage"/>
        </DataTable>
    </>
};

export default TableNodes;