import WizardNavigator from "@/views/ClusterWizard/WizardNavigator";
import { ProgressSpinner } from "primereact/progressspinner";
import { observer } from "mobx-react-lite";
import processingIndicatorStoreUi from "@/store/processingIndicatorStoreUi";
import { PROCESSING_INDICATOR_GENERATE_DEFAULT_CLUSTER } from "@/store/clusterWizardStore";

const StartStep = () => {
    const isGenerating = processingIndicatorStoreUi.status(PROCESSING_INDICATOR_GENERATE_DEFAULT_CLUSTER)

    return <>
        <WizardNavigator previousHidden={true} nextDisabled={isGenerating}/>
        <div className="flex flex-col justify-center">
            <div className="text-7xl mt-20 mb-5 primary-text-color">Welcome</div>
            <div className="text-2xl">
                <p>
                    With K4Prox you will create multi node MicroK8S cluster based on Ubuntu Cloud image.
                </p>
            </div>
            {
                isGenerating &&
                <div className="flex flex-col items-center justify-center">
                    <ProgressSpinner strokeWidth="8"/>
                    <span className="mt-5 text-center">Generating project...</span>
                </div>
            }
        </div>
    </>
}

export default observer(StartStep)