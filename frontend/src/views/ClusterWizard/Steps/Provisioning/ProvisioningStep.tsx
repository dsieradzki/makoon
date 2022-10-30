import React, { useContext, useState } from 'react';
import { ProgressSpinner } from "primereact/progressspinner";
import "./ProvisioningStep.css"
import TaskLog from "@/views/ClusterWizard/Steps/Provisioning/TaskLog/TaskLog";
import { observer } from "mobx-react-lite";
import taskLogStore from "@/store/taskLogStore";
import { Button } from "primereact/button";
import { useNavigate } from "react-router-dom";
import { ClusterWizardStoreContext } from "@/views/ClusterWizard/ClusterWizardView";

const progressSpinnerStyles = {
    margin: "0"
}
const showMoreButtonStyles = {
    fontSize: "3rem"
}

const ProvisioningStep = () => {
    const navigate = useNavigate()
    const clusterStore = useContext(ClusterWizardStoreContext)
    const [isLogTableVisible, setLogTableVisibility] = useState(false)
    const toggleLogsVisibility = () => {
        setLogTableVisibility(e => !e)
    }
    return (
        <div>
            {clusterStore.provisioningInProgress
                ? <div className="w-full pt-20 flex items-center justify-center">
                    <ProgressSpinner strokeWidth="8" style={progressSpinnerStyles}/>
                    <div className="ml-4">
                        <div>{taskLogStore.lastThreeLogs[0]?.name}</div>
                        <div className="text-stone-400">{taskLogStore.lastThreeLogs[1]?.name}</div>
                        <div className="text-stone-700">{taskLogStore.lastThreeLogs[2]?.name}</div>
                    </div>
                </div>
                : <>
                    {
                        clusterStore.provisioningFinishedSuccessfully
                            ? <div className="flex flex-col items-center justify-center">
                                <div className="text-5xl pt-20">Cluster is ready!</div>
                            </div>
                            : <div className="flex flex-col items-center justify-center">
                                <div className="text-5xl pt-20 p-error">Cluster creation error!</div>
                            </div>
                    }
                    <div className="mt-4 flex justify-center">
                        <Button onClick={() => {
                            if (clusterStore.provisioningFinishedSuccessfully) {
                                navigate(`/cluster/${clusterStore.cluster.clusterName}`)
                            } else {
                                navigate("/list")
                            }
                        }}>
                            Close
                        </Button>
                    </div>
                </>
            }
            <div className="flex justify-center mt-10 mb-10">
                <i onClick={toggleLogsVisibility} title="Show details"
                   className={`expandLogs pi primary-text-color cursor-pointer ${isLogTableVisible ? "pi-chevron-up" : "pi-chevron-down"}`}
                   style={showMoreButtonStyles}></i>
            </div>
            {isLogTableVisible && <TaskLog/>}
        </div>
    );
};

export default observer(ProvisioningStep);