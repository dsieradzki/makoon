import React, {useEffect, useRef} from 'react';
import NodesSection from "@/views/ClusterManagement/components/Nodes/NodesSection";
import clusterManagementStore from "@/store/clusterManagementStore";
import {observer} from "mobx-react-lite";
import {useOnFirstMount} from "@/utils/hooks";
import uiPropertiesPanelStore from "@/store/uiPropertiesPanelStore";
import {MANAGEMENT_ADD_NODE_PROPERTIES_PANEL_NAME} from "@/components/PropertiesPanel";

const Nodes = () => {
    useOnFirstMount(async () => {
        await clusterManagementStore.updateClusterNodeVmStatuses();
        await clusterManagementStore.updateClusterKubeStatuses();
    })

    const refresh = useRef(true);
    useEffect(() => {
        const readTaskLogInterval = setInterval(async () => {
            if (refresh.current) {
                refresh.current = false;
                await clusterManagementStore.updateClusterNodeVmStatuses();
                await clusterManagementStore.updateClusterKubeStatuses();
                await clusterManagementStore.updateNodesIfThereIsAnyLock();
                refresh.current = true;
            } else {
            }
        }, 5000);
        return () => {
            clearInterval(readTaskLogInterval);
        }
    }, [])

    return <>
        <NodesSection nodes={clusterManagementStore.masterNodesWithStatus} title="Master nodes"
                      clusterName={clusterManagementStore.cluster.clusterName}
                      onAddNode={() => {
                          uiPropertiesPanelStore.selectPanel(MANAGEMENT_ADD_NODE_PROPERTIES_PANEL_NAME, "master")
                      }}/>
        <div className="border-t-2 border-stone-800 my-5 mt-20"/>
        <NodesSection nodes={clusterManagementStore.workerNodesWithStatus} title="Workers nodes"
                      clusterName={clusterManagementStore.cluster.clusterName}
                      onAddNode={() => {
                          uiPropertiesPanelStore.selectPanel(MANAGEMENT_ADD_NODE_PROPERTIES_PANEL_NAME, "worker")
                      }}/>
    </>
};

export default observer(Nodes);