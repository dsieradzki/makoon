import React from "react";

export const CLUSTER_MANAGEMENT_HELM_APP_PROPERTIES_PANEL_NAME = "ClusterManagementHelmAppProperties"
export const CLUSTER_MANAGER_K8S_RESOURCES_PROPERTIES_PANEL_NAME = "ClusterManagerK8sResourceProperties"
export const HELM_APP_PROPERTIES_PANEL_NAME = "HelmAppProperties"
export const K8S_RESOURCES_PROPERTIES_PANEL_NAME = "K8sResourceProperties"
export const NODE_PROPERTIES_PANEL_NAME = "NodeProperties"
export const MANAGEMENT_ADD_NODE_PROPERTIES_PANEL_NAME = "ManagementAddNodeProperties"
export const MANAGEMENT_EDIT_NODE_PROPERTIES_PANEL_NAME = "ManagementEditNodeProperties"

const panels: { [key: string]: React.LazyExoticComponent<React.FC> } = {
    "HelmAppProperties": React.lazy(() => import("../views/ClusterWizard/Steps/Apps/Sections/Properties/HelmAppProperties")),
    "K8sResourceProperties": React.lazy(() => import("../views/ClusterWizard/Steps/Apps/Sections/Properties/K8sResourceProperties")),
    "NodeProperties": React.lazy(() => import("../views/ClusterWizard/Steps/Nodes/Sections/Properties/NodeProperties")),
    "ManagementAddNodeProperties": React.lazy(() => import("../views/ClusterManagement/components/Nodes/Properties/ManagementAddNodeProperties")),
    "ManagementEditNodeProperties": React.lazy(() => import("../views/ClusterManagement/components/Nodes/Properties/ManagementEditNodeProperties")),
    "ClusterManagementHelmAppProperties": React.lazy(() => import("../views/ClusterManagement/components/Apps/Properties/ClusterManagementHelmAppProperties")),
    "ClusterManagerK8sResourceProperties": React.lazy(() => import("../views/ClusterManagement/components/Apps/Properties/ClusterManagerK8sResourceProperties")),
};
type Props = {
    componentName: string
}
const PropertiesPanel = (props: Props) => {

    const PropertiesComponent = panels[props.componentName]
    return <React.Suspense>
        <PropertiesComponent/>
    </React.Suspense>
}
export default PropertiesPanel