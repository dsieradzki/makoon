import React, { useState } from 'react';
import AddonSwitch from "@/views/ClusterWizard/Steps/Apps/Sections/Properties/components/AddonSwitch";
import { InputText } from "primereact/inputtext";
import projectStore from "@/store/projectStore";
import { observer } from "mobx-react-lite";
import { useOnFirstMount } from "@/reactHooks";

const addonName = "metallb"
const MetalLbProperties = () => {
    const [startIp, setStartIp] = useState("")
    const [endIp, setEndIp] = useState("")


    const isEnabled = !!projectStore.microK8SAddons.find(e => e.name === addonName);
    const isFormValid = startIp.length >= 7 && endIp.length >= 7

    useOnFirstMount(async () => {
        const feature = projectStore.microK8SAddons.find(e => e.name === addonName);
        if (!feature || feature.args.length == 0) {
            return
        }
        const idxOfSep = feature.args.indexOf("-");
        if (idxOfSep == -1) {
            return;
        }

        setStartIp(feature.args.substring(1, idxOfSep))
        setEndIp(feature.args.substring(idxOfSep + 1))
    })
    const generateArgs = () => {
        return ":" + startIp + "-" + endIp
    }

    const onEnableChangeHandler = (value: boolean) => {
        if (value) {
            projectStore.updateMicroK8SAddonArgs(addonName, generateArgs());
        }
    }
    return (
        <div className="flex flex-col w-full h-full items-center">
            <div className="grow w-full">
                <div className="text-3xl text-center font-bold mt-5 flex items-center justify-center">
                    <span className="mr-2">MetalLB</span>
                    <AddonSwitch
                        tooltip={!isEnabled && !isFormValid ? "Fill ip address, to enable addon" : ""}
                        tooltipOptions={{showOnDisabled: true, position: "bottom"}}
                        disabled={!isFormValid} name="metallb" onChange={onEnableChangeHandler}/>
                </div>
                <div className="p-5">
                    MetalLB is a load-balancer implementation for bare metal Kubernetes clusters, using standard routing
                    protocols.
                </div>
                <div className="p-5">
                    <div className="border-t-2 border-stone-800 text-xl pt-5">
                        IP address range
                    </div>
                    <div className="mt-3">
                        <div className="flex items-end">
                            <div className="mr-4">
                                <div className="mr-1 required">Start</div>
                                <InputText className="w-full p-inputtext-sm"
                                           tooltip={isEnabled ? "To edit ip address, you have to disable addon" : ""}
                                           tooltipOptions={{showOnDisabled: true, position: "bottom"}}
                                           disabled={isEnabled}
                                           value={startIp}
                                           onChange={e => {
                                               setStartIp(e.target.value)
                                           }}></InputText>
                            </div>
                            <div>
                                <div className="mr-1 required">End</div>
                                <InputText className="w-full p-inputtext-sm"
                                           tooltip={isEnabled ? "To edit ip address, you have to disable addon" : ""}
                                           tooltipOptions={{showOnDisabled: true, position: "bottom"}}
                                           disabled={isEnabled}
                                           value={endIp}
                                           onChange={e => {
                                               setEndIp(e.target.value)
                                           }}></InputText>
                            </div>
                        </div>
                    </div>
                    <div className="mt-5 flex flex-col items-center">
                        {!isEnabled &&
                            <div className="mb-1">
                                <div className="text-orange-500">
                                    Check other addons and Helm apps. They depends on load-balancer IP.
                                    When LB is disabled, other services will not work properly.
                                    Please reconfigure them.
                                </div>
                            </div>
                        }
                    </div>
                </div>
            </div>
        </div>
    );
};

export default observer(MetalLbProperties);