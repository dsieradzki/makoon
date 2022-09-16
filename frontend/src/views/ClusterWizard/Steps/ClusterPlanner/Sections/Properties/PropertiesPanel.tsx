import React from "react";


const panels: { [key: string]: React.LazyExoticComponent<React.FC> } = {
    "ArgoCdProperties": React.lazy(() => import("./ArgoCdProperties")),
    "CustomHelmAppProperties": React.lazy(() => import("./CustomHelmAppProperties")),
    "CustomK8sResourceProperties": React.lazy(() => import("./CustomK8sResourceProperties")),
    "IngressProperties": React.lazy(() => import("./IngressProperties")),
    "MetalLbProperties": React.lazy(() => import("./MetalLbProperties")),
    "MetricsServerProperties": React.lazy(() => import("./MetricsServerProperties")),
    "NodeProperties": React.lazy(() => import("./NodeProperties")),
    "OpenEbsProperties": React.lazy(() => import("./OpenEbsProperties")),
    "PortainerProperties": React.lazy(() => import("./PortainerProperties"))
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