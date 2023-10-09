import React, {useContext, useState} from 'react';
import {observer} from "mobx-react-lite";
import Section from "@/components/Section";
import {ClusterCreatorStoreContext} from "@/views/cluster-creator/context";
import {Button} from "primereact/button";
import {DataTable} from "primereact/datatable";
import {ClusterResource} from "@/api/model";
import {Column} from "primereact/column";
import CreatorWorkloadsDialog from "@/views/cluster-creator/steps/workloads/CreatorWorkloadsDialog";


const WorkloadsSection = () => {
    const clusterStore = useContext(ClusterCreatorStoreContext)
    const isSelectedWorkload = function (id: string): boolean {
        return selectedWorkloadId != null;
    }

    const onSelectWorkload = (id: string) => {
        setSelectedWorkloadId(id);
        setShowWorkloadDialog(true);
    }

    const addWorkload = function () {
        setSelectedWorkloadId(null);
        setShowWorkloadDialog(true);
    }

    const [showWorkloadDialog, setShowWorkloadDialog] = useState(false);
    const [selectedWorkloadId, setSelectedWorkloadId] = useState<string | null>(null);
    const workloadDialog = showWorkloadDialog
        ? <CreatorWorkloadsDialog selectedWorkloadId={selectedWorkloadId}
                                  onClose={() => {
                                      setShowWorkloadDialog(false);
                                      setSelectedWorkloadId(null);
                                  }}/>
        : null;
    return (
        <Section
            title={<>
                <div className="mr-5">Workloads</div>
                <Button icon="pi pi-plus" rounded outlined aria-label="Add Workload"
                        onClick={addWorkload}/>
            </>}>
            {workloadDialog}
            <DataTable value={clusterStore.k8SResources}
                       emptyMessage="No resources found"
                       dataKey="name"
                       selection={clusterStore.k8SResources.find((i) => isSelectedWorkload(i.name))}
                       onSelectionChange={(e) => onSelectWorkload((e.value as ClusterResource).name)}
                       tableStyle={{minWidth: '50rem'}} selectionMode="single" scrollable scrollHeight="flex">

                <Column field="name" header="Name" className="font-semibold"/>
            </DataTable>
        </Section>
    );
};

export default observer(WorkloadsSection);