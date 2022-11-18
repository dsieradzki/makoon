import React from 'react';
import NodesSection from "@/views/ClusterManagement/components/Nodes/NodesSection";
import clusterManagementStore from "@/store/clusterManagementStore";
import { observer } from "mobx-react-lite";

const Nodes = () => {
    return <>
        <NodesSection nodes={clusterManagementStore.masterNodesWithStatus} title="Master nodes"
                      clusterName={clusterManagementStore.cluster.clusterName}
                      onAddNode={() => {
                      }}/>
        <div className="border-t-2 border-stone-800 my-5 mt-20"/>
        <NodesSection nodes={clusterManagementStore.workerNodesWithStatus} title="Workers nodes"
                      clusterName={clusterManagementStore.cluster.clusterName}
                      onAddNode={() => {
                      }}/>
    </>
};

export default observer(Nodes);