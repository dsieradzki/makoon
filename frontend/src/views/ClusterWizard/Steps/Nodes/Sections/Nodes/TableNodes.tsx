import React from 'react';
import { k4p } from "@wails/models";
import Table from "@/components/Table/Table";


type Props = {
    nodes: k4p.KubernetesNode[]
    clusterName: string
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
                    {
                        props.nodes.map((kNode, idx) =>
                            <Table.Row
                                key={idx}
                                id={kNode.vmid}
                                selected={kNode.vmid.toString() === props.selectedId}
                                onClick={props.onClick}>
                                <Table.Column className="font-bold">
                                    {props.clusterName}-{kNode.name}
                                </Table.Column>
                                <Table.Column>
                                    {kNode.vmid}
                                </Table.Column>
                                <Table.Column>
                                    {kNode.cores} cores
                                </Table.Column>
                                <Table.Column>
                                    {kNode.memory} MB
                                </Table.Column>
                                <Table.Column>
                                    <span>{kNode.ipAddress}</span>
                                    <p className="ml-2 pi pi-exclamation-triangle text-amber-700"
                                       title="Please verify IP availability on you network. Pinging hosts during project generation not guarantee IP availability."
                                       style={{fontSize: "1rem"}}></p>
                                </Table.Column>
                            </Table.Row>
                        )
                    }

                </Table>
        }
    </>
};

export default TableNodes;