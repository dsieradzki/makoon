import React, { useContext } from "react";
import { observer } from "mobx-react-lite";
import { Sidebar } from "primereact/sidebar";
import uiPropertiesPanelStore from "@/store/uiPropertiesPanelStore";
import PropertiesPanel from "@/components/PropertiesPanel";
import NodesSection from "@/views/ClusterWizard/Steps/Nodes/Sections/Nodes/NodesSection";
import WizardNavigator from "@/views/ClusterWizard/WizardNavigator";
import { ClusterWizardStoreContext } from "@/views/ClusterWizard/ClusterWizardView";
import { ClusterNodeType } from "@/api/model";


const separator = () => <div className="border-t-2 border-stone-800 my-5"/>

const NodesStep = () => {
    const clusterStore = useContext(ClusterWizardStoreContext)
    let onHideHandler = () => uiPropertiesPanelStore.hidePanel();
    const nodesSettingsAreValid = () => {
        if (clusterStore.masterNodes.length == 0) {
            return false
        }
        for (const node of clusterStore.cluster.nodes) {
            if (node.storagePool.length == 0 || node.ipAddress.length == 0) {
                return false
            }
        }
        return true
    }
    return <>
        <WizardNavigator nextDisabled={!nodesSettingsAreValid()}/>
        <Sidebar visible={uiPropertiesPanelStore.isPanelVisible}
                 onHide={onHideHandler}
                 className="p-sidebar-md"
                 position="right">
            {uiPropertiesPanelStore.selectedPropertiesPanelKey &&
                <PropertiesPanel componentName={uiPropertiesPanelStore.selectedPropertiesPanelKey}/>}
        </Sidebar>
        <div className="mt-10"></div>
        <NodesSection clusterName={clusterStore.cluster.clusterName} nodes={clusterStore.masterNodes} title="Master nodes" onAddNode={()=> clusterStore.addNode(ClusterNodeType.Master)}/>
        {separator()}
        <NodesSection clusterName={clusterStore.cluster.clusterName} nodes={clusterStore.workerNodes} title="Workers nodes" onAddNode={()=>clusterStore.addNode(ClusterNodeType.Worker)}/>
    </>
}

export default observer(NodesStep)