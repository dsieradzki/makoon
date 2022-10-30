import React from "react";


const panels: { [key: string]: React.LazyExoticComponent<React.FC> } = {
    "CustomHelmAppProperties": React.lazy(() => import("../views/ClusterWizard/Steps/Apps/Sections/Properties/CustomHelmAppProperties")),
    "CustomK8sResourceProperties": React.lazy(() => import("../views/ClusterWizard/Steps/Apps/Sections/Properties/CustomK8sResourceProperties")),
    "NodeProperties": React.lazy(() => import("../views/ClusterWizard/Steps/Nodes/Sections/Properties/NodeProperties")),
    "NodeReadOnlyProperties": React.lazy(() => import("../views/ClusterManagement/components/Nodes/Properties/NodeReadOnlyProperties")),
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