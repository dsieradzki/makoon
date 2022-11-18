import React from 'react';
import uiPropertiesPanelStore from "@/store/uiPropertiesPanelStore";
import { Sidebar } from "primereact/sidebar";
import PropertiesPanel from "@/components/PropertiesPanel";
import { observer } from "mobx-react-lite";
import WizardNavigator from "@/views/ClusterWizard/WizardNavigator";
import HelmAppsSection from "@/views/ClusterWizard/Steps/Apps/Sections/HelmAppsSection";
import KubernetesResourcesSection from "@/views/ClusterWizard/Steps/Apps/Sections/KubernetesResourcesSection";

const separator = () => <div className="border-t-2 border-stone-800 my-5"/>

const AppsStep = () => {
    let onHideHandler = () => uiPropertiesPanelStore.hidePanel();
    return <>
        <WizardNavigator/>
        <Sidebar visible={uiPropertiesPanelStore.isPanelVisible}
                 onHide={onHideHandler}
                 className="p-sidebar-lg"
                 position="right">
            {uiPropertiesPanelStore.selectedPropertiesPanelKey &&
                <PropertiesPanel componentName={uiPropertiesPanelStore.selectedPropertiesPanelKey}/>}
        </Sidebar>
        <div className="mt-10"></div>
        <HelmAppsSection/>
        {separator()}
        <KubernetesResourcesSection/>
        {separator()}
    </>
};

export default observer(AppsStep);