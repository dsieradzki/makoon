import {Steps} from "primereact/steps";
import React, {useRef, useState} from "react";
import {Button} from "primereact/button";
import {observer} from "mobx-react-lite";
import {useOnFirstMount} from "@/utils/hooks";
import {Dialog} from "primereact/dialog";
import SettingsStep from "@/views/cluster-creator/steps/settings";
import ClusterStep from "@/views/cluster-creator/steps/cluster";
import NodesStep from "@/views/cluster-creator/steps/nodes";
import AppsStep from "@/views/cluster-creator/steps/apps";
import {ClusterCreatorStoreContext, CreatorNavigation, CreatorNavigationContext} from "@/views/cluster-creator/context";
import WorkloadsStep from "@/views/cluster-creator/steps/workloads";
import {ClusterCreatorStore, PROCESSING_INDICATOR_GENERATE_DEFAULT_CLUSTER} from "@/store/cluster-creator-store";
import processingIndicatorStore from "@/store/processing-indicator-store";
import CreatorNavigator from "@/views/cluster-creator/CreatorNavigator";

const steps = [
    {label: 'Settings'},
    {label: 'Cluster'},
    {label: 'Nodes'},
    {label: 'Apps'},
    {label: 'Workloads'},
];

type Props = {
    onHide: () => void
};
const ClusterCreator = (props: Props) => {

    const [creatorStore] = useState(() => new ClusterCreatorStore());
    const [activeIndex, setActiveIndex] = useState(0);
    const [showProvisioningConfirmation, setShowProvisioningConfirmation] = useState(false)
    const [clusterRequestInProgress, setClusterRequestInProgress] = useState(false)

    const isGenerating = processingIndicatorStore.status(PROCESSING_INDICATOR_GENERATE_DEFAULT_CLUSTER)

    useOnFirstMount(async () => {
        await creatorStore.generateDefaultCluster()
    })

    const stepRef = useRef<CreatorNavigation>(null);
    const [nextDisabled, setNextDisabled] = useState(false);
    const [previousDisabled, setPreviousDisabled] = useState(false);

    const renderStep = () => {
        let stepComponent: React.ReactNode;
        switch (activeIndex) {
            case 0:
                stepComponent = <SettingsStep
                    ref={stepRef}
                    nextDisabled={setNextDisabled}
                    previousDisabled={setPreviousDisabled}
                    onNext={async () => {
                        nextStep();
                    }}
                    onPrevious={async () => {
                        previousStep();
                    }}
                />;
                break;
            case 1:
                stepComponent = <ClusterStep
                    ref={stepRef}
                    nextDisabled={setNextDisabled}
                    previousDisabled={setPreviousDisabled}
                    onNext={async () => {
                        nextStep();
                    }}
                    onPrevious={async () => {
                        previousStep();
                    }}
                />;
                break;
            case 2:
                stepComponent = <NodesStep
                    ref={stepRef}
                    nextDisabled={setNextDisabled}
                    previousDisabled={setPreviousDisabled}
                    onNext={async () => {
                        nextStep();
                    }}
                    onPrevious={async () => {
                        previousStep();
                    }}
                />;
                break;
            case 3:
                stepComponent = <AppsStep
                    ref={stepRef}
                    nextDisabled={setNextDisabled}
                    previousDisabled={setPreviousDisabled}
                    onNext={async () => {
                        nextStep();
                    }}
                    onPrevious={async () => {
                        previousStep();
                    }}
                />;
                break;
            case 4:
                stepComponent = <WorkloadsStep
                    ref={stepRef}
                    nextDisabled={setNextDisabled}
                    previousDisabled={setPreviousDisabled}
                    onNext={async () => {
                        nextStep();
                    }}
                    onPrevious={async () => {
                        previousStep();
                    }}
                />;
                break;
            default:
                stepComponent = <></>;
        }
        return (
            <CreatorNavigationContext.Provider value={{goPrevious: previousStep, goNext: nextStep}}>
                {stepComponent}
            </CreatorNavigationContext.Provider>
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
        setClusterRequestInProgress(true);
        creatorStore
            .provisionCluster(creatorStore.cluster)
            .then(() => {
                setClusterRequestInProgress(false);
                setShowProvisioningConfirmation(false);
                console.info("Request for cluster creation has been created successfully")
                props.onHide();
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
            <div className="text-2xl">Are you sure you want to start cluster creation?</div>
        </div>
    }


    return <ClusterCreatorStoreContext.Provider
        value={creatorStore}>
        <Dialog header="Cluster creator"
                visible
                className="w-[95vw] h-[95vh] lg:w-[85vw] lg:h-[85vh] 2xl:w-[75vw] 2xl:h-[75vh]"
                maximizable
                modal draggable={false}
                onHide={props.onHide}
                closable={!isGenerating}
                footer={<CreatorNavigator
                    nextDisabled={nextDisabled}
                    previousDisabled={previousDisabled}
                    previousHidden={activeIndex == 0}
                    onNext={async () => {
                        stepRef.current?.next();
                    }}
                    onPrevious={async () => {
                        stepRef.current?.previous();
                    }}
                />}
        >
            <Dialog header="Confirmation" footer={footerConfirmProvisioning} visible={showProvisioningConfirmation} modal
                    draggable={false}
                    onHide={() => {
                        setShowProvisioningConfirmation(false)
                    }}>
                {provisionConfirmationContent()}
            </Dialog>
            <div className="mt-8 flex flex-col">
                <Steps model={steps} activeIndex={activeIndex}/>
                <div className="flex justify-center">
                    <div className="max-w-[1024px] w-[1024px] pt-8">
                        {renderStep()}
                    </div>
                </div>
            </div>
        </Dialog>
    </ClusterCreatorStoreContext.Provider>

}

export default observer(ClusterCreator)