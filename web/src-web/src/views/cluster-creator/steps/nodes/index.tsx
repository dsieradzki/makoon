import React, {useContext, useEffect, useImperativeHandle} from "react";
import {observer} from "mobx-react-lite";
import {ClusterNodeType} from "@/api/model";
import {ClusterCreatorStoreContext, CreatorNavigation, StepProps} from "@/views/cluster-creator/context";
import NodesSection from "@/views/cluster-creator/steps/nodes/NodesSection";
import {autorun} from "mobx";


const NodesStep = (props: StepProps, ref: any) => {

    useImperativeHandle(ref, () => ({
        async next(): Promise<void> {
            await props.onNext();
        },
        async previous(): Promise<void> {
            await props.onPrevious();
        },
    } as CreatorNavigation));

    const clusterStore = useContext(ClusterCreatorStoreContext)

    useEffect(() => {
        autorun(() => {
            if (clusterStore.masterNodes.length == 0) {
                props.nextDisabled(true)
                return
            }

            let notValid = false;
            for (const node of clusterStore.cluster.nodes) {
                if (node.storagePool.length == 0 || node.ipAddress.length == 0) {
                    notValid = true;
                    break;
                }
            }
            props.nextDisabled(notValid)
        });
    }, []);

    return <>
        <div className="mt-10"></div>
        <NodesSection clusterName={clusterStore.cluster.clusterName}
                      nodes={clusterStore.masterNodes}
                      title="Master nodes"
                      nodeType={ClusterNodeType.Master}/>
        <NodesSection clusterName={clusterStore.cluster.clusterName}
                      nodes={clusterStore.workerNodes}
                      title="Workers nodes"
                      nodeType={ClusterNodeType.Worker}/>
    </>
}

export default observer(React.forwardRef(NodesStep));
