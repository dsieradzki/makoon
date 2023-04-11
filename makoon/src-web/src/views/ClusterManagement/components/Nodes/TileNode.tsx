import Block from "@/components/Block";
import React from "react";
import VmStatusComponent from "@/views/ClusterManagement/components/Nodes/VmStatusComponent";
import K8sStatusComponent from "@/views/ClusterManagement/components/Nodes/K8sStatusComponent";
import {NodeWithStatus} from "@/store/clusterManagementStore";
import {VmStatus} from "@/api/model";

type Props = {
    clusterName: string
    node: NodeWithStatus
    selected?: boolean,
    onClick?: (node: NodeWithStatus) => void
    className?: string
}

const valuePillStyle = {
    backgroundColor: "var(--surface-100)"
}
const TileNode = (props: Props) => {

    const handeOnClick = () => {
        if (props.onClick) {
            props.onClick(props.node)
        }
    }
    return <Block title={props.clusterName+"-"+props.node.name} selected={props.selected} onClick={handeOnClick} className={props.className}>
        <div className="flex flex-col">
            <div className="bg-stone-800 rounded-xl p-4 mt-3">
                <table className="w-full">
                    <tbody>
                    <tr>
                        <td className="w-1/2 pt-1 font-bold">Vmid</td>
                        <td className="w-1/2 pt-1">
                            <div style={valuePillStyle} className="ml-1 px-2 rounded-xl min-h-[30px] flex items-center justify-center">{props.node.vmId}</div>
                        </td>
                    </tr>

                    <tr>
                        <td className="w-1/2 pt-1 font-bold">Cores</td>
                        <td className="w-1/2 pt-1">
                            <div style={valuePillStyle} className="ml-1 px-2 rounded-xl min-h-[30px] flex items-center justify-center">{props.node.cores}</div>
                        </td>
                    </tr>
                    <tr>
                        <td className="w-1/2 pt-1  font-bold">Memory</td>
                        <td className="w-1/2 pt-1">
                            <div style={valuePillStyle} className="ml-1 px-2 rounded-xl min-h-[30px] flex items-center justify-center">{props.node.memory} MB
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td className="w-1/2 pt-1  font-bold">
                            <div className="flex items-center">
                                IP
                            </div>
                        </td>
                        <td className="w-1/2 pt-1">
                            <div style={valuePillStyle} className="ml-1 px-2 rounded-xl min-h-[30px] flex items-center justify-center">
                                {props.node.ipAddress ? props.node.ipAddress : '[REQUIRED]'}
                            </div>
                        </td>
                    </tr>
                    </tbody>
                </table>
            </div>
            <div className="bg-stone-800 rounded-xl p-4 mt-3">
                <table className="w-full">
                    <tbody>
                    <tr>
                        <td className="w-1/3 pt-1 font-bold">
                            VM
                        </td>
                        <td className="w-2/3 pt-1">
                            <div className="flex justify-center">
                                <VmStatusComponent className="w-full" status={props.node.vmStatus}/>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td className="w-1/3 pt-1 font-bold">K8S</td>
                        <td className="w-2/3 pt-1">
                            <div className="flex justify-center">
                                <K8sStatusComponent className="w-full" status={props.node.kubeStatus} vmStatusProblem={props.node.vmStatus == VmStatus.Stopped}/>
                            </div>
                        </td>
                    </tr>
                    </tbody>
                </table>
            </div>

        </div>
    </Block>
}

export default TileNode