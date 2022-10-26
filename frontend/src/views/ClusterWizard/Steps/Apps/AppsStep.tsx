import React from 'react';
import uiPropertiesPanelStore from "@/store/uiPropertiesPanelStore";
import { Sidebar } from "primereact/sidebar";
import PropertiesPanel from "@/components/PropertiesPanel";
import AddonsSection from "@/views/ClusterWizard/Steps/Apps/Sections/AddonsSection";
import HelmAppsSection from "@/views/ClusterWizard/Steps/Apps/Sections/HelmAppsSection";
import CustomHelmAppsSection from "@/views/ClusterWizard/Steps/Apps/Sections/CustomHelmAppsSection";
import CustomKubernetesResourcesSection
    from "@/views/ClusterWizard/Steps/Apps/Sections/CustomKubernetesResourcesSection";
import { observer } from "mobx-react-lite";

const separator = () => <div className="border-t-2 border-stone-800 my-5"/>

const AppsStep = () => {
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
        <AddonsSection/>
        {separator()}
        <HelmAppsSection/>
        {separator()}
        <CustomHelmAppsSection/>
        {separator()}
        <CustomKubernetesResourcesSection/>
        {separator()}
    </>
};

export default observer(AppsStep);