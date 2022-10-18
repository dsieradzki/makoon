import React, { useCallback } from 'react';
import { k4p } from "@wails/models";
import TileNode from "@/views/ClusterWizard/Steps/Nodes/Sections/Nodes/TileNode";

type Props = {
    nodes: k4p.KubernetesNode[]
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
