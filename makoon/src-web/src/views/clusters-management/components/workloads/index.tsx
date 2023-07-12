import Panel from "@/components/Panel";
import {DataTable} from "primereact/datatable";
import {ClusterResource, ClusterStatus} from "@/api/model";
import {Column} from "primereact/column";
import React, {useState} from "react";
import {observer} from "mobx-react-lite";
import {Button} from "primereact/button";
import clusterManagementStore from "@/store/cluster-management-store";
import WorkloadDialog from "@/views/clusters-management/components/workloads/WorkloadsDialog";

const Workloads = () => {

    const locked = clusterManagementStore.cluster.status != ClusterStatus.Sync;

    const [showWorkloadDialog, setShowWorkloadDialog] = useState(false);
    const [selectedWorkloadId, setSelectedWorkloadId] = useState<string | null>(null);
    const workloadDialog = showWorkloadDialog
        ? <WorkloadDialog selectedWorkloadId={selectedWorkloadId}
                          onSubmit={(id: string) => {
                              setSelectedWorkloadId(id);
                          }}
                          onClose={() => {
                              setShowWorkloadDialog(false);
                              setSelectedWorkloadId(null);
                          }}/>
        : null;
    return <>
        {workloadDialog}
        <Panel
            title={
                <div className="flex items-center">
                    <span className="mr-2">Workloads</span>
                    <Button
                        disabled={locked}
                        icon="pi pi-plus" rounded outlined aria-label="Add workload"
                        onClick={() => {
                            setSelectedWorkloadId(null);
                            setShowWorkloadDialog(true);
                        }}
                    />
                </div>
            }
            icon="pi-desktop" className="grow min-h-0">
            <DataTable value={clusterManagementStore.k8SResources}
                       emptyMessage="No workloads found"
                       dataKey="name"
                       selection={clusterManagementStore.k8SResources.find((i) => i.name == selectedWorkloadId)}
                       onSelectionChange={e => {
                           setSelectedWorkloadId((e.value as ClusterResource).id);
                           setShowWorkloadDialog(true);
                       }}
                       tableStyle={{minWidth: '50rem'}}
                       selectionMode="single"
                       scrollable
                       scrollHeight="flex">
                <Column field="name" header="Name"/>
            </DataTable>
        </Panel>
    </>
};
export default observer(Workloads);