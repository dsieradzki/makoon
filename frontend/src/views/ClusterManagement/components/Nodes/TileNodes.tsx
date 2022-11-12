import React, { useCallback } from 'react';
import TileNode from "@/views/ClusterManagement/components/Nodes/TileNode";
import { KubernetesNodeWithStatus } from "@/store/clusterManagementStore";

type Props = {
    nodes: KubernetesNodeWithStatus[]
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
                        selected={wNode.vmid.toString() === props.selectedId}
                        onClick={onSelect(wNode.vmid.toString())}
                        key={idx}
                        className="mr-4 mt-4"/>
                )
            }
        </div>
    );
};

export default TileNodes;
