import React, { useCallback } from 'react';
import TileNode from "@/views/ClusterWizard/Steps/Nodes/Sections/Nodes/TileNode";
import { ClusterNode } from "@/api/model";

type Props = {
    nodes: ClusterNode[]
    clusterName: string
    selectedId: string | null
    onClick: (id: string) => void
}

const TileNodes = (props: Props) => {

    const onSelect = useCallback((vmId: string) => () => {
        props.onClick(vmId);
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
