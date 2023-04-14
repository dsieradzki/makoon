import React, { useCallback } from 'react';
import TileNode from "@/views/ClusterManagement/components/Nodes/TileNode";
import { NodeWithStatus } from "@/store/clusterManagementStore";

type Props = {
    clusterName: string
    nodes: NodeWithStatus[]
    selectedId: string | null
    onClick: (id: string) => void
}

const TileNodes = (props: Props) => {

    const onSelect = useCallback((vmid: string) => () => {
        props.onClick(vmid);
    }, [])

    return (
        <div className="flex items-center flex-wrap">
            {
                props.nodes.length == 0 &&
                <div className="w-full text-2xl text-stone-600 text-center">No nodes</div>
            }
            {
                props.nodes.map((wNode, idx) =>
                    <TileNode
                        node={wNode}
                        clusterName={props.clusterName}
                        selected={wNode.vmId.toString() === props.selectedId}
                        onClick={onSelect(wNode.vmId.toString())}
                        key={idx}
                        className="mr-4 mt-4"/>
                )
            }
        </div>
    );
};

export default TileNodes;