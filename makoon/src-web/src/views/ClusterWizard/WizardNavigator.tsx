import React, { useContext } from 'react';
import {
    ClusterWizardStoreContext,
    WizardNavigationContext,
    WizardNavigationContextType
} from "@/views/ClusterWizard/ClusterWizardView";
import Block from "@/components/Block";
import { useNavigate } from "react-router-dom";
import processingIndicatorStoreUi from "@/store/processingIndicatorStoreUi";
import { PROCESSING_INDICATOR_GENERATE_DEFAULT_CLUSTER } from "@/store/clusterWizardStore";

type Props = {
    previousDisabled?: boolean;
    nextDisabled?: boolean;
    previousHidden?: boolean;
    nextHidden?: boolean;
    onNext?: () => Promise<void>
}
const WizardNavigator = (props: Props) => {
    const navigate = useNavigate()
    const clusterStore = useContext(ClusterWizardStoreContext)
    const isGenerating = processingIndicatorStoreUi.status(PROCESSING_INDICATOR_GENERATE_DEFAULT_CLUSTER)

    return (
        <WizardNavigationContext.Consumer>
            {(value: WizardNavigationContextType) =>
                <div className="flex justify-between pt-10">
                    <div className="flex">
                        {props.previousHidden
                            ? null
                            : <Block
                                onClick={async () => {
                                    if (!props.previousDisabled) {
                                        value.goPrevious()
                                    }
                                }}
                                tooltip="Previous step"
                                className="flex justify-center items-center w-[76px] h-[76px] mr-4">
                                <i className={`pi pi-chevron-left ${props.previousDisabled ? "text-stone-600" : "primary-text-color"}`}
                                   style={{fontSize: "1.5rem"}}></i>
                            </Block>
                        }
                        <Block
                            onClick={() => {
                                if (isGenerating) {
                                    return
                                }
                                navigate("/list")
                            }}
                            tooltip="Cancel"
                            className="flex justify-center items-center h-[76px]">

                            <div
                                className={`flex items-center justify-start p-2 ${isGenerating ? "text-stone-600" : "danger"}`}>
                                <i className={`pi pi-times mr-4`}
                                   style={{fontSize: "1.5rem"}}></i>
                                <span className="text-center">Cancel</span>
                            </div>
                        </Block>
                    </div>
                    {props.nextHidden
                        ? null
                        : <Block
                            onClick={async () => {
                                if (!props.nextDisabled) {
                                    props.onNext && await props.onNext()
                                    value.goNext()
                                }
                            }}
                            tooltip="Next step"
                            className="flex justify-center items-center w-[76px] h-[76px]">
                            <i className={`pi pi-chevron-right ${props.nextDisabled ? "text-stone-600" : "primary-text-color"}`}
                               style={{fontSize: "1.5rem"}}></i>
                        </Block>

                    }
                </div>}
        </WizardNavigationContext.Consumer>

    );
};

export default WizardNavigator;