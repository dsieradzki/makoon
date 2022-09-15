import React from 'react';
import AddonSwitch from "@/views/ClusterWizard/Steps/ClusterPlanner/Sections/Properties/components/AddonSwitch";

const OpenEbsProperties = () => {
    return (
        <div className="flex flex-col w-full h-full items-center">
            <div className="grow w-full">
                <div className="text-3xl text-center font-bold mt-5 flex items-center justify-center">
                    <span className="mr-2">OpenEBS</span>
                    <AddonSwitch name="openebs"/>
                </div>
                <div className="p-5">
                    OpenEBS, is the most widely deployed and easy to use open-source storage solution for Kubernetes.
                </div>

            </div>
        </div>
    );
};

export default OpenEbsProperties;