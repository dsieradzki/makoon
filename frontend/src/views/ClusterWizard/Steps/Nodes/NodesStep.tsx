import { useOnFirstMount } from "@/reactHooks";
import { LogDebug } from "@wails-runtime/runtime";
import React from "react";
import GeneralSettingsSection from "@/views/ClusterWizard/Steps/Nodes/Sections/GeneralSettingsSection";
import projectStore from "@/store/projectStore";
import { observer } from "mobx-react-lite";
import { Sidebar } from "primereact/sidebar";
import uiPropertiesPanelStore from "@/store/uiPropertiesPanelStore";
import PropertiesPanel from "@/components/PropertiesPanel";
import NodesSection from "@/views/ClusterWizard/Steps/Nodes/Sections/Nodes/NodesSection";


const separator = () => <div className="border-t-2 border-stone-800 my-5"/>

const NodesStep = () => {

    useOnFirstMount(async () => {
        await projectStore.loadProject()
        LogDebug("Project loaded");
    })
    let onHideHandler = () => uiPropertiesPanelStore.hidePanel();

    return <>
        <Sidebar visible={uiPropertiesPanelStore.isPanelVisible}
                 onHide={onHideHandler}
                 className="p-sidebar-md"
                 position="right">
            {uiPropertiesPanelStore.selectedPropertiesPanelKey &&
                <PropertiesPanel componentName={uiPropertiesPanelStore.selectedPropertiesPanelKey}/>}
        </Sidebar>
        <div className="mt-10"></div>
        <GeneralSettingsSection/>
        {separator()}
        <NodesSection nodes={projectStore.masterNodes} title="Master nodes" onAddNode={()=> projectStore.addNode("master")}/>
        {separator()}
        <NodesSection nodes={projectStore.workerNodes} title="Workers nodes" onAddNode={()=>projectStore.addNode("worker")}/>
    </>
}

export default observer(NodesStep)