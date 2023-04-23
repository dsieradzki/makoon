import React from 'react';
import Table from "@/components/Table/Table";
import VmStatusComponent from "@/views/ClusterManagement/components/Nodes/VmStatusComponent";
import K8sStatusComponent from "@/views/ClusterManagement/components/Nodes/K8sStatusComponent";
import {NodeWithStatus} from "@/store/clusterManagementStore";
import {VmStatus} from "@/api/model";
import {ProgressSpinner} from "primereact/progressspinner";


type Props = {
    clusterName: string
    nodes: NodeWithStatus[]
    selectedId: string | null
    onClick: (id: any) => void
}
const TableNodes = (props: Props) => {
    return <>
        {
            props.nodes.length == 0
                ? <div className="w-full text-2xl text-stone-600 text-center">No nodes</div>
                : <Table>
                    <Table.Header>Node name</Table.Header>
                    <Table.Header>VM Id</Table.Header>
                    <Table.Header>CPU</Table.Header>
                    <Table.Header>RAM</Table.Header>
                    <Table.Header>IP</Table.Header>
                    <Table.Header>VM</Table.Header>
                    <Table.Header>K8S</Table.Header>
                    {
                        props.nodes.map((kNode, idx) =>
                            <Table.Row
                                key={idx}
                                id={kNode.vmId}
                                selected={kNode.vmId.toString() === props.selectedId}
                                onClick={props.onClick}>
                                <Table.Column className="font-bold">
                                    {kNode.lock &&
                                        <span className="mr-2">
                                            <ProgressSpinner style={{width: '15px', height: '15px'}} strokeWidth="10"/>
                                        </span>}
                                    <span>{props.clusterName}-{kNode.name}</span>
                                </Table.Column>
                                <Table.Column>
                                    {kNode.vmId}
                                </Table.Column>
                                <Table.Column>
                                    {kNode.cores} cores
                                </Table.Column>
                                <Table.Column>
                                    {kNode.memory} MB
                                </Table.Column>
                                <Table.Column>
                                    {kNode.ipAddress}
                                </Table.Column>
                                <Table.Column className="max-h-[58px]">
                                    <VmStatusComponent status={kNode.vmStatus}/>
                                </Table.Column>
                                <Table.Column className="max-h-[58px]">
                                    <K8sStatusComponent status={kNode.kubeStatus}
                                                        vmStatusProblem={kNode.vmStatus == VmStatus.Stopped}/>
                                </Table.Column>
                            </Table.Row>
                        )
                    }

                </Table>
        }
    </>
};

export default TableNodes;