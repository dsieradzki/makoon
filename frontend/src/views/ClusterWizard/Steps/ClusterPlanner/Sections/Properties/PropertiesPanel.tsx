import React from "react";

type Props = {
    componentName: string
}
const PropertiesPanel = (props: Props) => {
    const PropertiesComponent = React.lazy(() => import("./" + props.componentName));
    return <React.Suspense>
        <PropertiesComponent/>
    </React.Suspense>
}
export default PropertiesPanel