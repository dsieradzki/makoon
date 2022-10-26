import React from "react";


const panels: { [key: string]: React.LazyExoticComponent<React.FC> } = {
    "ArgoCdProperties": React.lazy(() => import("../views/ClusterWizard/Steps/Apps/Sections/Properties/ArgoCdProperties")),
    "CustomHelmAppProperties": React.lazy(() => import("../views/ClusterWizard/Steps/Apps/Sections/Properties/CustomHelmAppProperties")),
    "CustomK8sResourceProperties": React.lazy(() => import("../views/ClusterWizard/Steps/Apps/Sections/Properties/CustomK8sResourceProperties")),
    "IngressProperties": React.lazy(() => import("../views/ClusterWizard/Steps/Apps/Sections/Properties/IngressProperties")),
    "MetalLbProperties": React.lazy(() => import("../views/ClusterWizard/Steps/Apps/Sections/Properties/MetalLbProperties")),
    "MetricsServerProperties": React.lazy(() => import("../views/ClusterWizard/Steps/Apps/Sections/Properties/MetricsServerProperties")),
    "NodeProperties": React.lazy(() => import("../views/ClusterWizard/Steps/Nodes/Sections/Properties/NodeProperties")),
    "NodeReadOnlyProperties": React.lazy(() => import("../views/ClusterManagement/components/Nodes/Properties/NodeReadOnlyProperties")),
    "OpenEbsProperties": React.lazy(() => import("../views/ClusterWizard/Steps/Apps/Sections/Properties/OpenEbsProperties")),
    "PortainerProperties": React.lazy(() => import("../views/ClusterWizard/Steps/Apps/Sections/Properties/PortainerProperties"))
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