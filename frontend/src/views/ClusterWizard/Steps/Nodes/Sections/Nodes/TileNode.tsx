import Block from "@/components/Block";
import { k4p } from "@wails/models";
import React from "react";

type Props = {
    node: k4p.KubernetesNode
    clusterName: string
    selected?: boolean,
    onClick?: (node: k4p.KubernetesNode) => void
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
        <div className="bg-stone-800 rounded-xl p-4 mt-3">
            <table className="w-full">
                <tbody>
                <tr>
                    <td className="w-1/2 pt-1 font-bold">Vmid</td>
                    <td className="w-1/2 pt-1">
                        <div style={valuePillStyle} className="ml-1 px-2 rounded-xl min-h-[30px] flex items-center justify-center">{props.node.vmid}</div>
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
                            <span>IP</span>
                            <p className="ml-2 pi pi-exclamation-triangle text-amber-700"
                               title="Please verify IP availability on you network. Pinging hosts during project generation not guarantee IP availability."
                               style={{fontSize: "1rem"}}></p>

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
    </Block>
}

export default TileNode