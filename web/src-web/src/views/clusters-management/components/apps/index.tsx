import Panel from "@/components/Panel";
import {useInterval, useOnFirstMount} from "@/utils/hooks";
import React, {useEffect, useRef, useState} from "react";
import {DataTable} from "primereact/datatable";
import {Column} from "primereact/column";
import {observer} from "mobx-react-lite";
import HelmAppStatus from "@/views/clusters-management/components/apps/HelmAppStatus";
import {ClusterState, ClusterStatus, HelmApp} from "@/api/model";
import {Button} from "primereact/button";
import clusterManagementStore, {
    HelmAppWithStatus,
    LOADING_CLUSTER,
    LOADING_INDICATOR_UPDATE_HELM_CHARTS_STATUS
} from "@/store/cluster-management-store";
import HelmAppDialog from "@/views/clusters-management/components/apps/HelmAppDialog";
import processingIndicatorStore from "@/store/processing-indicator-store";
import {replace} from "formik";

const Apps = () => {

    const locked = clusterManagementStore.cluster.status?.state != ClusterState.Sync;

    useOnFirstMount(async () => {
        await clusterManagementStore.updateAppsStatus();
    });

    useInterval(async () => {
        await clusterManagementStore.updateAppsStatus();
    });

    const [showHelmAppDialog, setShowHelmAppDialog] = useState(false);
    const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
    const helmAppDialog = showHelmAppDialog
        ? <HelmAppDialog selectedAppId={selectedAppId}
                         onSubmit={(id: string) => {
                             setSelectedAppId(id);
                         }}
                         onClose={() => {
                             setShowHelmAppDialog(false);
                             setSelectedAppId(null);
                         }}/>
        : null;
    return <>
        {helmAppDialog}
        <Panel
            title={
                <Panel.Title value="Helm apps">
                    <Button
                        disabled={locked}
                        icon="pi pi-plus" rounded outlined aria-label="Add app"
                        onClick={() => {
                            setSelectedAppId(null);
                            setShowHelmAppDialog(true);
                        }}
                    />
                </Panel.Title>
            }
            icon="pi-desktop"
            className="grow min-h-0">
            <DataTable value={clusterManagementStore.helmAppsWithStatus}
                       dataKey="id"
                       emptyMessage="No apps found"
                       selection={clusterManagementStore.helmAppsWithStatus.find((i) => i.id == selectedAppId)}
                       onSelectionChange={(e) => {
                           setSelectedAppId((e.value as HelmApp).id || null);
                           setShowHelmAppDialog(true);
                       }}

                       tableStyle={{minWidth: '50rem'}} scrollable
                       selectionMode="single"
                       isDataSelectable={(e) => {
                           if (!e.data) {
                               return true;
                           }
                           return !!(e.data as HelmAppWithStatus).status
                       }}
                       scrollHeight="flex">
                <Column field="releaseName" header="Release name"/>
                <Column field="chartName" header="Chart name"/>
                <Column field="chartVersion" header="Chart version"
                        body={(r) =>
                            r.chartVersion && r.chartVersion.length > 0
                                ? r.chartVersion
                                : "latest"}
                />
                <Column field="namespace" header="Namespace"/>
                <Column field="status" header="Status"
                        body={(r) => <HelmAppStatus status={r.status}/>}
                />
            </DataTable>
        </Panel>
    </>
}

export default observer(Apps);