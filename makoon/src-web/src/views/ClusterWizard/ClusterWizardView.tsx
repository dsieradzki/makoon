import { Steps } from "primereact/steps";
import { useContext, useState } from "react";
import StartStep from "./Steps/StartStep";
import { Button } from "primereact/button";
import NodesStep from "@/views/ClusterWizard/Steps/Nodes/NodesStep";
import { observer } from "mobx-react-lite";
import { useOnFirstMount } from "@/utils/hooks";
import { Dialog } from "primereact/dialog";
import AppsStep from "@/views/ClusterWizard/Steps/Apps/AppsStep";
import Header from "@/components/Header";
import React from 'react';
import { ClusterWizardStore } from "@/store/clusterWizardStore";
import { useNavigate } from "react-router-dom";
import ClusterStep from "@/views/ClusterWizard/Steps/Cluster/ClusterStep";
import SettingsStep from "@/views/ClusterWizard/Steps/Settings/SettingsStep";

export type WizardNavigationContextType = {
    goPrevious: () => void;
    goNext: () => void;
}
export const WizardNavigationContext = React.createContext<WizardNavigationContextType>({} as WizardNavigationContextType)
export const ClusterWizardStoreContext = React.createContext<ClusterWizardStore>({} as ClusterWizardStore)

const steps = [
    {label: 'Start'},
    {label: 'Settings'},
    {label: 'Cluster'},
    {label: 'Nodes'},
    {label: 'Apps'},
];

const ClusterWizardView = () => {
    const navigate = useNavigate()
    const [activeIndex, setActiveIndex] = useState(0);
    const [showProvisioningConfirmation, setShowProvisioningConfirmation] = useState(false)
    const [clusterRequestInProgress, setClusterRequestInProgress] = useState(false)
    const clusterStore = useContext(ClusterWizardStoreContext)


    useOnFirstMount(async () => {
        await clusterStore.generateDefaultCluster()
    })

    const renderStep = () => {
        let stepComponent: React.ReactNode;
        switch (activeIndex) {
            case 0:
                stepComponent = <StartStep/>
                break
            case 1:
                stepComponent = <SettingsStep/>
                break
            case 2:
                stepComponent = <ClusterStep/>
                break
            case 3:
                stepComponent = <NodesStep/>
                break
            case 4:
                stepComponent = <AppsStep/>
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
        if (activeIndex == 4) {
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
        clusterStore
            .provisionCluster(clusterStore.cluster)
            .then(() => {
                setClusterRequestInProgress(false);
                setShowProvisioningConfirmation(false)
                console.info("Request for cluster creation has been created successfully")
                navigate("/list")
            })
    }

    const footerConfirmProvisioning = (
        <div>
            <Button disabled={clusterRequestInProgress} label="No" className="p-button-text" icon="pi pi-times"
                    onClick={() => {
                        setShowProvisioningConfirmation(false)
                    }}/>
            <Button disabled={clusterRequestInProgress} label="Yes" icon="pi pi-check"
                    onClick={startClusterProvisioning}/>
        </div>
    );

    const provisionConfirmationContent = () => {
        return <div className="p-5">
            <div className="font-bold text-3xl">Are you sure you want to start cluster creation?</div>
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
        <Header title="Cluster creator"/>
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