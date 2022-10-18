import React from 'react';
import AddonSwitch from "@/views/ClusterWizard/Steps/Apps/Sections/Properties/components/AddonSwitch";


const MetricsServerProperties = () => {
    return (
        <div className="flex flex-col w-full h-full items-center">
            <div className="grow w-full">
                <div className="text-3xl text-center font-bold mt-5 flex items-center justify-center">
                    <span className="mr-2">Metrics Server</span>
                    <AddonSwitch name="metrics-server"/>
                </div>
                <div className="p-5">
                    Metrics Server is a scalable, efficient source of container resource metrics for Kubernetes built-in
                    autoscaling pipelines.
                </div>
            </div>
        </div>
    );
};

export default MetricsServerProperties;