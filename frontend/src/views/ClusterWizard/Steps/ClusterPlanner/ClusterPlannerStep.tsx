import { useOnFirstMount } from "@/reactHooks";
import { LogDebug } from "@wails-runtime/runtime";
import React from "react";
import GeneralSettingsSection from "@/views/ClusterWizard/Steps/ClusterPlanner/Sections/GeneralSettingsSection";
import MasterNodesSection from "@/views/ClusterWizard/Steps/ClusterPlanner/Sections/Nodes/MasterNodesSection";
import WorkerNodesSection from "@/views/ClusterWizard/Steps/ClusterPlanner/Sections/Nodes/WorkerNodesSection";
import AddonsSection from "@/views/ClusterWizard/Steps/ClusterPlanner/Sections/AddonsSection";
import HelmAppsSection from "@/views/ClusterWizard/Steps/ClusterPlanner/Sections/HelmAppsSection";
import CustomHelmAppsSection from "@/views/ClusterWizard/Steps/ClusterPlanner/Sections/CustomHelmAppsSection";
import CustomKubernetesResourcesSection
    from "@/views/ClusterWizard/Steps/ClusterPlanner/Sections/CustomKubernetesResourcesSection";
import projectStore from "@/store/projectStore";
import { observer } from "mobx-react-lite";
import { Sidebar } from "primereact/sidebar";
import uiPropertiesPanelStore from "@/store/uiPropertiesPanelStore";
import PropertiesPanel from "@/views/ClusterWizard/Steps/ClusterPlanner/Sections/Properties/PropertiesPanel";


const separator = () => <div className="border-t-2 border-stone-800 my-5"/>

const ClusterPlannerStep = () => {

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
        <MasterNodesSection/>
        {separator()}
        <WorkerNodesSection/>
        {separator()}
        <AddonsSection/>
        {separator()}
        <HelmAppsSection/>
        {separator()}
        <CustomHelmAppsSection/>
        {separator()}
        <CustomKubernetesResourcesSection/>
        {separator()}
    </>
}

export default observer(ClusterPlannerStep)