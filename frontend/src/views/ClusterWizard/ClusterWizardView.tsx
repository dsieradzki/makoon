import { Steps } from "primereact/steps";
import { useState } from "react";
import StartStep from "./Steps/StartStep";
import { Button } from "primereact/button";
import ClusterPlannerStep from "@/views/ClusterWizard/Steps/ClusterPlanner/ClusterPlannerStep";
import ProvisioningStep from "@/views/ClusterWizard/Steps/Provisioning/ProvisioningStep";
import FinishStep from "@/views/ClusterWizard/Steps/FinishStep";
import { confirmDialog, ConfirmDialog } from "primereact/confirmdialog";
import projectStore from "@/store/projectStore";
import { observer } from "mobx-react-lite";
import { LogInfo } from "@wails-runtime/runtime";
import { useOnFirstMount } from "@/reactHooks";
import { GetProxmoxIp, Logout } from "@wails/auth/Service";
import { useNavigate } from "react-router-dom";

const steps = [
    {label: 'Start'},
    {label: 'Cluster planner'},
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
                return <ClusterPlannerStep/>
            case 2:
                return <ProvisioningStep/>
            case 3:
                return <FinishStep/>
            default:
                return <></>
        }
    }
    const nextStep = () => {
        if (activeIndex == 1) {
            confirmDialog({
                message: 'Are you sure you want to start cluster deployment?',
                header: 'Confirmation',
                icon: 'pi pi-exclamation-triangle',
                accept: () => {
                    setActiveIndex(i => i + 1)
                    projectStore.provisionCluster().then(() => {
                        LogInfo("Cluster created successfully")
                    })
                },
            });
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
        return activeIndex == 0 || activeIndex == 2
    }
    const isNextStepHidden = () => {
        return activeIndex == steps.length - 1 || (projectStore.provisioningInProgress && activeIndex == 2)
    }

    return <>
        <ConfirmDialog/>
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