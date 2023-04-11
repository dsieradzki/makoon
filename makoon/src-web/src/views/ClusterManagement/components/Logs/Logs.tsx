import React, { useEffect, useRef } from 'react';
import Table from "@/components/Table/Table";
import LogLevel from "@/views/ClusterManagement/components/Logs/LogLevel";
import clusterManagementStore from "@/store/clusterManagementStore";
import { observer } from "mobx-react-lite";

const Logs = () => {
    const nodesStatusRequestFinish = useRef(true);
    useEffect(() => {
        const readTaskLogInterval = setInterval(async () => {
            if (nodesStatusRequestFinish.current) {
                nodesStatusRequestFinish.current = false;
                await clusterManagementStore.loadLogs(clusterManagementStore.cluster.clusterName);
                nodesStatusRequestFinish.current = true;
            } else {
            }
        }, 5000);
        return () => {
            clearInterval(readTaskLogInterval);
        }
    }, [])

    return (
        <div className="pb-4">
            <Table>
                <Table.Header>Date</Table.Header>
                <Table.Header>Level</Table.Header>
                <Table.Header>Message</Table.Header>
                {
                    clusterManagementStore.logs.map((e, idx) =>
                        <Table.Row key={idx}>
                            <Table.Column>{new Date(e.date).toLocaleString()}</Table.Column>
                            <Table.Column><LogLevel value={e.level}/></Table.Column>
                            <Table.Column>{e.message}</Table.Column>
                        </Table.Row>)
                }
            </Table>
        </div>
    );
};

export default observer(Logs);