import { Steps } from "primereact/steps";
import { useContext, useState } from "react";
import StartStep from "./Steps/StartStep";
import { Button } from "primereact/button";
import NodesStep from "@/views/ClusterWizard/Steps/Nodes/NodesStep";
import ProvisioningStep from "@/views/ClusterWizard/Steps/Provisioning/ProvisioningStep";
import { observer } from "mobx-react-lite";
import { LogDebug, LogInfo } from "@wails-runtime/runtime";
import { useOnFirstMount } from "@/utils/hooks";
import { k4p } from "@wails/models";
import { InputSwitch } from "primereact/inputswitch";
import { Dialog } from "primereact/dialog";
import AppsStep from "@/views/ClusterWizard/Steps/Apps/AppsStep";
import Header from "@/components/Header";
import GeneralSettingsStep from "@/views/ClusterWizard/Steps/GeneralSettingsStep";
import React from 'react';
import { ClusterWizardStore } from "@/store/clusterWizardStore";
import { useNavigate } from "react-router-dom";

export type WizardNavigationContextType = {
    goPrevious: () => void;
    goNext: () => void;
}
export const WizardNavigationContext = React.createContext<WizardNavigationContextType>({} as WizardNavigationContextType)
export const ClusterWizardStoreContext = React.createContext<ClusterWizardStore>({} as ClusterWizardStore)

const steps = [
    {label: 'Start'},
    {label: 'Settings'},
    {label: 'Nodes'},
    {label: 'Apps'},
    {label: 'Provisioning'}
];

const ClusterWizardView = () => {
    const navigate = useNavigate()
    const [activeIndex, setActiveIndex] = useState(0);
    const [selectedProvisioningSteps, setSelectedProvisioningSteps] = useState({
        createVirtualMachines: true,
        setupVirtualMachines: true,
        installKubernetes: true,
        joinNodesToCluster: true,
        installAddons: true,
        installHelmApps: true,
        installCustomHelmApps: true,
        installCustomK8SResources: true
    } as k4p.ProvisionStage)
    const [showProvisioningConfirmation, setShowProvisioningConfirmation] = useState(false)
    const [showManualStepSelection, setManualStepSelection] = useState(false);
    const clusterStore = useContext(ClusterWizardStoreContext)


    useOnFirstMount(async () => {
        LogDebug("Project generation has been stared")
        await clusterStore.generateDefaultCluster()
        LogDebug("Cluster has been generated");
    })

    const renderStep = () => {
        let stepComponent: React.ReactNode;
        switch (activeIndex) {
            case 0:
                stepComponent = <StartStep/>
                break
            case 1:
                stepComponent = <GeneralSettingsStep/>
                break
            case 2:
                stepComponent = <NodesStep/>
                break
            case 3:
                stepComponent = <AppsStep/>
                break
            case 4:
                stepComponent = <ProvisioningStep/>
                break
            default:
                stepComponent = <></>
        }
        return (
            <WizardNavigationContext.Provider value={{goPrevious: previousStep, goNext: nextStep}}>
                {stepComponent}
            </WizardNavigationContext.Provider>
        )
    }

    const nextStep = () => {
        if (activeIndex == 3) {
            setManualStepSelection(false)
            setShowProvisioningConfirmation(true)
        } else {
            if (activeIndex < steps.length - 1) {
                setActiveIndex(i => i + 1)
            }
        }
    }
    const previousStep = () => {
        if (activeIndex > 0) {
            setActiveIndex(i => i - 1)
        }
    }

    const startClusterProvisioning = () => {
        setShowProvisioningConfirmation(false)
        setActiveIndex(i => i + 1)
        clusterStore.provisionCluster({
            stages: selectedProvisioningSteps,
            cluster: clusterStore.cluster
        } as k4p.ProvisionRequest).then(() => {
            LogInfo("Cluster created successfully")
        })
    }

    const footerConfirmProvisioning = (
        <div>
            <Button label="No" className="p-button-text" icon="pi pi-times" onClick={() => {
                setShowProvisioningConfirmation(false)
            }}/>
            <Button label="Yes" icon="pi pi-check" onClick={startClusterProvisioning}/>
        </div>
    );

    const provisionConfirmationContent = () => {
        return <div className="p-5">
            <div className="font-bold text-3xl">Are you sure you want to start cluster creation?</div>
            <div className="flex items-center mt-5">
                <InputSwitch
                    checked={showManualStepSelection}
                    onChange={(e) => {
                        setManualStepSelection(e.target.value)
                    }}
                />
                <div className="ml-3">Show manual steps selection <div className="italic text-sm text-stone-400">(for
                    debug/troubleshooting purposes)</div></div>
            </div>
            {showManualStepSelection &&
                <div className="mt-5">
                    <div className="mb-3 font-bold">Select steps to perform:</div>
                    <div className="flex items-center mt-3">
                        <InputSwitch
                            checked={selectedProvisioningSteps.createVirtualMachines}
                            onChange={(e) =>
                                setSelectedProvisioningSteps(
                                    (s) => {
                                        return {...s, createVirtualMachines: e.value}
                                    })}
                        />
                        <span className="ml-3">Create virtual machines</span>
                    </div>

                    <div className="flex items-center mt-3">
                        <InputSwitch
                            checked={selectedProvisioningSteps.setupVirtualMachines}
                            onChange={(e) =>
                                setSelectedProvisioningSteps(
                                    (s) => {
                                        return {...s, setupVirtualMachines: e.value}
                                    })}
                        /> <span
                        className="ml-3">Setup virtual machines</span>
                    </div>

                    <div className="flex items-center mt-3">
                        <InputSwitch
                            checked={selectedProvisioningSteps.installKubernetes}
                            onChange={(e) =>
                                setSelectedProvisioningSteps(
                                    (s) => {
                                        return {...s, installKubernetes: e.value}
                                    })}
                        /> <span className="ml-3">Install Kubernetes</span>
                    </div>

                    <div className="flex items-center mt-3">
                        <InputSwitch
                            checked={selectedProvisioningSteps.joinNodesToCluster}
                            onChange={(e) =>
                                setSelectedProvisioningSteps(
                                    (s) => {
                                        return {...s, joinNodesToCluster: e.value}
                                    })}
                        /> <span className="ml-3">Join nodes to cluster</span>
                    </div>

                    <div className="flex items-center mt-3">
                        <InputSwitch
                            checked={selectedProvisioningSteps.installCustomHelmApps}
                            onChange={(e) =>
                                setSelectedProvisioningSteps(
                                    (s) => {
                                        return {...s, installCustomHelmApps: e.value}
                                    })}
                        /> <span
                        className="ml-3">Install Helm applications</span>
                    </div>

                    <div className="flex items-center mt-3">
                        <InputSwitch
                            checked={selectedProvisioningSteps.installCustomK8SResources}
                            onChange={(e) =>
                                setSelectedProvisioningSteps(
                                    (s) => {
                                        return {...s, installCustomK8SResources: e.value}
                                    })}
                        /> <span
                        className="ml-3">Install Kubernetes resources</span>
                    </div>
                </div>
            }
        </div>
    }

    return <>
        <Dialog header="Confirmation" footer={footerConfirmProvisioning} visible={showProvisioningConfirmation} modal
                draggable={false}
                onHide={() => {
                    setShowProvisioningConfirmation(false)
                }}>
            {provisionConfirmationContent()}
        </Dialog>
        <Header title="Cluster planner"/>
        <div className="flex flex-col">
            <Steps model={steps} activeIndex={activeIndex} className="mx-20"/>
            <div className="flex justify-center">
                <div className="max-w-[1024px] w-[1024px]">
                    {renderStep()}
                </div>
            </div>
        </div>
    </>
}

export default observer(ClusterWizardView)