import React, {useContext, useState} from 'react';
import {observer} from "mobx-react-lite";
import {ClusterNode, ClusterNodeType} from "@/api/model";
import Section from "@/components/Section";
import TableNodes from "@/views/cluster-creator/steps/nodes/TableNodes";
import {Button} from "primereact/button";
import CreatorNodeDialog from "@/views/cluster-creator/steps/nodes/CreatorNodeDialog";
import {ClusterCreatorStoreContext} from "@/views/cluster-creator/context";

type Props = {
    title: string
    nodes: ClusterNode[]
    clusterName: string
    nodeType: ClusterNodeType
}
const NodesSection = (props: Props) => {

    const creatorStore = useContext(ClusterCreatorStoreContext)
    const onClickNodeHandler = (id: any) => {
        setSelectedNodeId(id);
         setShowNodeDialog(true);
    }

    const title = <div className="w-full text-2xl flex items-center justify-between">
        <div className="flex items-center">
            <div className="mr-5">{props.title}</div>
            <Button icon="pi pi-plus" rounded outlined aria-label="Add node"
                    onClick={()=>{
                        creatorStore.addNode(props.nodeType)
                    }}
            />
        </div>

    </div>
    const [showNodeDialog, setShowNodeDialog] = useState(false);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const nodeDialog = showNodeDialog
        ? <CreatorNodeDialog nodeId={selectedNodeId}
                             nodeType={props.nodeType}
                             onClose={() => {
                                 setShowNodeDialog(false);
                                 setSelectedNodeId(null);
                             }}/>
        : null;
    return (
        <Section title={title} titleContainerClass="-ml-5">
            {nodeDialog}
            <TableNodes clusterName={props.clusterName} nodes={props.nodes} selectedId={selectedNodeId} onClick={onClickNodeHandler}/>
        </Section>
    );
};

export default observer(NodesSection);