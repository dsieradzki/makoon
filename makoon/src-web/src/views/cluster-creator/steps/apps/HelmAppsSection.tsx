import React, {useContext, useState} from 'react';
import {observer} from "mobx-react-lite";
import Section from "@/components/Section";
import {ClusterCreatorStoreContext} from "@/views/cluster-creator/context";
import {Button} from "primereact/button";
import {DataTable} from "primereact/datatable";
import {HelmApp} from "@/api/model";
import {Column} from "primereact/column";
import CreatorHelmAppDialog from "@/views/cluster-creator/steps/apps/CreatorHelmAppDialog";


const HelmAppsSection = () => {
    const creatorStore = useContext(ClusterCreatorStoreContext)
    const isSelected = function (id: string): boolean {
        return id == selectedAppId
    }

    const onSelect = (id: string) => {
        setSelectedAppId(id);
        setShowHelmAppDialog(true);
    }


    const [showHelmAppDialog, setShowHelmAppDialog] = useState(false);
    const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
    const helmAppDialog = showHelmAppDialog
        ? <CreatorHelmAppDialog selectedAppId={selectedAppId}
                                onClose={() => {
                                    setShowHelmAppDialog(false);
                                    setSelectedAppId(null);
                                }}/>
        : null;
    return (
        <Section
            title={<>
                <div className="mr-5">Helm apps
                </div>
                <Button icon="pi pi-plus" rounded outlined aria-label="Add Helm app"
                        onClick={() => {
                            setSelectedAppId(null);
                            setShowHelmAppDialog(true)
                        }}/>
            </>}>
            {helmAppDialog}
            <DataTable value={creatorStore.helmApps}
                       emptyMessage="No apps found"
                       dataKey="releaseName"
                       selection={creatorStore.helmApps.find((i) => isSelected(i.releaseName))}
                       onSelectionChange={(e) => onSelect((e.value as HelmApp).releaseName)}
                       tableStyle={{minWidth: '50rem'}} selectionMode="single" scrollable scrollHeight="flex">

                <Column field="releaseName" header="Release name" className="font-semibold"/>
                <Column field="chartName" header="Chart name"/>
                <Column field="chartVersion" header="Version" body={(r) =>
                    r.chartVersion && r.chartVersion.length > 0
                        ? r.chartVersion
                        : "latest"}/>
                <Column field="namespace" header="Namespace"/>
            </DataTable>
        </Section>
    );
};

export default observer(HelmAppsSection);