import React from 'react';
import Table from "@/components/Table/Table";
import { observer } from "mobx-react-lite";
import taskLogStore from "@/store/taskLogStore";
import { tasklog } from "@wails/models";
import { inspect } from "util";
import styles from "./TaskLog.module.css"

const toHumanReadableEventName = function (name: string): string {
    const withSpaces = name.replace(new RegExp("_", 'g'), " ");
    return withSpaces.charAt(0).toUpperCase() + withSpaces.substring(1);
}
const generateKey = (log: tasklog.Task) => {
    return log.name + log.createTime + log.correlationId
}
const TaskLog = () => {
    const renderStatus = (status: string) => {
        switch (status) {
            case "":
                return <div className="flex items-center h-[24px]">
                    <i className="pi pi-minus text-base ml-2"></i></div>
            case "started":
                return <div className="flex items-center h-[24px]">
                    <i className="pi pi-spin pi-spinner text-base ml-2"></i></div>
            case "finished":
                return <div className="flex items-center h-[24px]">
                    <i className="pi pi-check text-base text-green-500 ml-2"></i></div>
            case "error":
                return <div className="flex items-center h-[24px]">
                    <i className="pi pi-times text-base text-red-500 ml-2"></i></div>
        }
    }
    return (
        <Table>
            <Table.Header>Status</Table.Header>
            <Table.Header>Time</Table.Header>
            <Table.Header>Name</Table.Header>
            <Table.Header>Duration</Table.Header>
            <Table.Header>Details</Table.Header>
            {
                taskLogStore.logs.map(log =>
                    <Table.Row key={generateKey(log)}>
                        <Table.Column className={styles.tableRow}>{renderStatus(log.state)}</Table.Column>
                        <Table.Column className={styles.tableRow}>{new Date(log.createTime).toLocaleString()}</Table.Column>
                        <Table.Column className={styles.tableRow}>{toHumanReadableEventName(log.name)}</Table.Column>
                        <Table.Column className={styles.tableRow}>{log.duration} sec</Table.Column>
                        <Table.Column className={`${styles.tableRow} ${styles.longText}`} title={log.details.join("\n")}>{log.details}</Table.Column>
                    </Table.Row>)
            }
        </Table>
    );
};

export default observer(TaskLog);