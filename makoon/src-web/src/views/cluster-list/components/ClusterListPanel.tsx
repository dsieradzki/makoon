import {observer} from "mobx-react-lite";
import {DataTable} from "primereact/datatable";
import {Column} from "primereact/column";
import Panel from "@/components/Panel";
import React, {useState} from "react";
import {useOnFirstMount} from "@/utils/hooks";
import ClusterStatus from "@/views/cluster-list/components/ClusterStatus";
import clustersListStore from "@/store/clusters-list-store";
import {useNavigate} from "react-router-dom";
import {ClusterHeader} from "@/api/model";

const ClusterListPanel = () => {
    const navigate = useNavigate();
    useOnFirstMount(async () => {
        await clustersListStore.loadClusters()
    })

    const [selectedProduct, setSelectedProduct] = useState<any>();
    const goToClusterManagement = (clusterName: string) => {
        navigate(`/cluster/${clusterName}`)
    }
    return <Panel className="grow min-h-0">
        <DataTable value={clustersListStore.clusters}
                   dataKey="name"
                   selection={selectedProduct}
                   onSelectionChange={(e) => {
                       goToClusterManagement((e.value as ClusterHeader).name)
                   }}
                   tableStyle={{minWidth: '50rem'}}
                   selectionMode="single"
                   scrollable
                   scrollHeight="flex">
            <Column field="name" header="Name" className="font-semibold"></Column>
            <Column field="nodesCount" header="Nodes"></Column>
            <Column field="coresSum" header="CPU" body={(r) => r.coresSum + " cores"}></Column>
            <Column field="memorySum" header="Memory" body={(r) => r.memorySum + " MB"}></Column>
            <Column field="diskSizeSum" header="Storage" body={(r) => r.diskSizeSum + " GB"}></Column>
            <Column field="status" header="Status" body={(s) => <ClusterStatus status={s.status}/>}></Column>
        </DataTable>
    </Panel>
}

export default observer(ClusterListPanel)