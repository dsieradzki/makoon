import { Steps } from "primereact/steps";
import { useState } from "react";
import StartStep from "./Steps/StartStep";
import { Button } from "primereact/button";
import NodesStep from "@/views/ClusterWizard/Steps/Nodes/NodesStep";
import ProvisioningStep from "@/views/ClusterWizard/Steps/Provisioning/ProvisioningStep";
import FinishStep from "@/views/ClusterWizard/Steps/FinishStep";
import projectStore from "@/store/projectStore";
import { observer } from "mobx-react-lite";
import { LogInfo } from "@wails-runtime/runtime";
import { useOnFirstMount } from "@/reactHooks";
import { GetProxmoxIp, Logout } from "@wails/auth/Service";
import { useNavigate } from "react-router-dom";
import { k4p } from "@wails/models";
import { InputSwitch } from "primereact/inputswitch";
import { Dialog } from "primereact/dialog";
import AppsStep from "@/views/ClusterWizard/Steps/Apps/AppsStep";

const steps = [
    {label: 'Start'},
    {label: 'Nodes'},
    {label: 'Apps'},
    {label: 'Provisioning'},
    {label: 'Finish'}
];

type Props = {
    step?: number
}
const ClusterWizardView = (props: Props) => {
    const navigate = useNavigate()
    const [activeIndex, setActiveIndex] = useState(0);
    const [proxmoxIp, setProxmoxIp] = useState("")
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

    useOnFirstMount(async () => {
        props.step && setActiveIndex(props.step)
        setProxmoxIp(await GetProxmoxIp())
    })

    const onLogoutHandler = async () => {
        await Logout()
        navigate("/login")
    }

    const renderStep = () => {
        switch (activeIndex) {
            case 0:
                return <StartStep/>
            case 1:
                return <NodesStep/>
            case 2:
                return <AppsStep/>
            case 3:
                return <ProvisioningStep/>
            case 4:
                return <FinishStep/>
            default:
                return <></>
        }
    }

    const provisionConfirmationContent = () => {
        return <div className="p-4">
            <div className="font-bold text-2xl">Are you sure you want to start cluster creation?</div>
            <div className="mt-4">
                <div className="mb-2">Select steps to perform:</div>
                <div className="flex items-center mt-2">
                    <InputSwitch
                        checked={selectedProvisioningSteps.createVirtualMachines}
                        onChange={(e) =>
                            setSelectedProvisioningSteps(
                                (s) => {
                                    return {...s, createVirtualMachines: e.value}
                                })}
                    />
                    <span className="ml-2">Create virtual machines</span>
                </div>

                <div className="flex items-center mt-2">
                    <InputSwitch
                        checked={selectedProvisioningSteps.setupVirtualMachines}
                        onChange={(e) =>
                            setSelectedProvisioningSteps(
                                (s) => {
                                    return {...s, setupVirtualMachines: e.value}
                                })}
                    /> <span
                    className="ml-2">Setup virtual machines</span>
                </div>

                <div className="flex items-center mt-2">
                    <InputSwitch
                        checked={selectedProvisioningSteps.installKubernetes}
                        onChange={(e) =>
                            setSelectedProvisioningSteps(
                                (s) => {
                                    return {...s, installKubernetes: e.value}
                                })}
                    /> <span className="ml-2">Install Kubernetes</span>
                </div>

                <div className="flex items-center mt-2">
                    <InputSwitch
                        checked={selectedProvisioningSteps.joinNodesToCluster}
                        onChange={(e) =>
                            setSelectedProvisioningSteps(
                                (s) => {
                                    return {...s, joinNodesToCluster: e.value}
                                })}
                    /> <span className="ml-2">Join nodes to cluster</span>
                </div>

                <div className="flex items-center mt-2">
                    <InputSwitch
                        checked={selectedProvisioningSteps.installAddons}
                        onChange={(e) =>
                            setSelectedProvisioningSteps(
                                (s) => {
                                    return {...s, installAddons: e.value}
                                })}
                    /> <span className="ml-2">Install addons</span>
                </div>

                <div className="flex items-center mt-2">
                    <InputSwitch
                        checked={selectedProvisioningSteps.installHelmApps}
                        onChange={(e) =>
                            setSelectedProvisioningSteps(
                                (s) => {
                                    return {...s, installHelmApps: e.value}
                                })}
                    /> <span className="ml-2">Install Helm applications</span>
                </div>

                <div className="flex items-center mt-2">
                    <InputSwitch
                        checked={selectedProvisioningSteps.installCustomHelmApps}
                        onChange={(e) =>
                            setSelectedProvisioningSteps(
                                (s) => {
                                    return {...s, installCustomHelmApps: e.value}
                                })}
                    /> <span
                    className="ml-2">Install custom Helm applications</span>
                </div>

                <div className="flex items-center mt-2">
                    <InputSwitch
                        checked={selectedProvisioningSteps.installCustomK8SResources}
                        onChange={(e) =>
                            setSelectedProvisioningSteps(
                                (s) => {
                                    return {...s, installCustomK8SResources: e.value}
                                })}
                    /> <span
                    className="ml-2">Install custom Kubernetes resources</span>
                </div>
            </div>
        </div>
    }
    const nextStep = () => {
        if (activeIndex == 2) {
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
    const isPreviousStepHidden = () => {
        return activeIndex == 0 || activeIndex == 3
    }
    const isNextStepHidden = () => {
        return activeIndex == steps.length - 1 || (projectStore.provisioningInProgress && activeIndex == 3)
    }

    const startClusterProvisioning = () => {
        setShowProvisioningConfirmation(false)
        setActiveIndex(i => i + 1)
        projectStore.provisionCluster({stages: selectedProvisioningSteps} as k4p.ProvisionRequest).then(() => {
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


    return <>
        <Dialog header="Confirmation" footer={footerConfirmProvisioning} visible={showProvisioningConfirmation} modal draggable={false}
                onHide={() => {
                    setShowProvisioningConfirmation(false)
                }}>
            {provisionConfirmationContent()}
        </Dialog>
        <div className="flex justify-between pt-10 pl-10 pr-10 pb-8">
            <div className="flex justify-start items-center">
                <div className="text-4xl">K<span className="primary-text-color font-bold">4</span>Prox</div>
                <span className="primary-text-color text-4xl mx-2">/</span>
                <div className="text-3xl">Cluster planner</div>
            </div>
            <div className="flex items-center">
                <p className="pi pi-server mr-2" style={{fontSize: "1.5rem"}}/>
                <p className="pi pi-angle-double-left primary-text-color mr-2"/>
                <span title="Proxmox IP">{proxmoxIp}</span>
                <span className="primary-text-color text-4xl mx-2">/</span>
                <Button disabled={projectStore.provisioningInProgress} onClick={onLogoutHandler} icon="pi pi-sign-out"
                        className="p-button-rounded p-button-secondary p-button-text" style={{color: "#FFFFFF"}}
                        aria-label="Logout"/>
            </div>
        </div>
        <div className="flex flex-col">
            <Steps model={steps} activeIndex={activeIndex} className="mx-20"/>
            <div className="flex justify-center">
                <div className="max-w-[1024px] w-[1024px]">
                    <div className="flex justify-between px-10 pt-10">
                        {isPreviousStepHidden()
                            ? <div></div>
                            : <i onClick={previousStep}
                                 className="pi pi-chevron-left cursor-pointer"
                                 title="Previous step"
                                 style={{fontSize: "3rem", color: "var(--primary-color)"}}></i>
                        }

                        {isNextStepHidden()
                            ? <div></div>
                            : <i onClick={nextStep}
                                 className="pi pi-chevron-right cursor-pointer primary-text-color"
                                 title="Next step"
                                 style={{fontSize: "3rem"}}></i>
                        }
                    </div>
                    {renderStep()}
               </div>
           </div>
        </div>
    </>
}

export default observer(ClusterWizardView)