import Panel from "@/components/Panel";
import React from "react";
import {useAsyncEffect, useInterval} from "@/utils/hooks";
import {observer} from "mobx-react-lite";
import {DataTable} from "primereact/datatable";
import {Column} from "primereact/column";
import {Button} from "primereact/button";
import clusterManagementStore from "@/store/cluster-management-store";
import LogLevel from "@/views/clusters-management/components/cluster-logs/LogLevel";

const Logs = () => {
    useAsyncEffect(async () => {
        if (clusterManagementStore.cluster.clusterName.length > 0) {
            await clusterManagementStore.loadLogs(clusterManagementStore.cluster.clusterName);
        }
    }, [clusterManagementStore.cluster]);

    useInterval(async ()=>{
        await clusterManagementStore.loadLogs(clusterManagementStore.cluster.clusterName);

    });``

    return <Panel title={
        <Panel.Title value="Logs">

            <Button
                icon="pi pi-eraser" rounded outlined aria-label="Clear logs"
                title="Clear logs"
                onClick={async () => {
                    await clusterManagementStore.clearLogs();
                }}
            />
        </Panel.Title>
    }
                  icon="pi-info-circle" className="grow min-h-0">
        <DataTable value={clusterManagementStore.logs}
                   dataKey="date"
                   emptyMessage="No logs found"
                   tableStyle={{minWidth: '50rem'}}
                   scrollable
                   scrollHeight="flex">
            <Column field="message" header="Message"/>
            <Column field="level" header="Level" body={(r) => <LogLevel value={r.level}/>}/>
            <Column field="date" header="Date" body={(r) => new Date(r.date).toLocaleString()}/>
        </DataTable>
    </Panel>;
}

export default observer(Logs);