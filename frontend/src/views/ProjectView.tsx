import { ProgressSpinner } from "primereact/progressspinner";
import React, { useState } from "react";
import Block from "../components/Block";
import { OpenProjectDialog, SaveProjectDialog } from "@wails/project/Service";
import { useNavigate } from "react-router-dom";
import { LogError } from "../../wailsjs/runtime";
import LogoContainer from "@/components/LogoContainer";

const ProjectView = () => {
    const navigate = useNavigate()
    const [wizardProjectInProgress, setWizardProjectInProgress] = useState(false)
    const [generatingProjectInProgress, setGeneratingProjectInProgress] = useState(false)
    const [openingProjectInProgress, setOpeningProjectInProgress] = useState(false)

    const wizardProjectHandler = async () => {
        try {
            setWizardProjectInProgress(true)
            const isProjectGenerated = await SaveProjectDialog();
            if (isProjectGenerated) {
                navigate("/cluster-planner")
            }
        } catch (err: any) {
            LogError(err)
        } finally {
            setWizardProjectInProgress(false)
        }
    }

    const openProjectHandler = async () => {
        try {
            setOpeningProjectInProgress(true)
            const clusterIsAlreadyCreated = await OpenProjectDialog();
            if (clusterIsAlreadyCreated) {
                navigate("/cluster")
            } else {
                navigate("/cluster-planner-in-progress")
            }
        } catch (err: any) {
            LogError(err)
        } finally {
            setOpeningProjectInProgress(false)
        }
    }

    return <LogoContainer>

        <Block
            notActive={generatingProjectInProgress || openingProjectInProgress || wizardProjectInProgress}
            onClick={wizardProjectHandler}
            className="mr-10 flex justify-center items-center w-[200px] h-[200px] mb-5">

            {
                wizardProjectInProgress
                    ? <div className="flex flex-col items-center justify-center">
                        <ProgressSpinner strokeWidth="8" />
                        <span className="mt-5 text-center">Generating project...</span>
                    </div>
                    : <div className="flex flex-col items-center justify-center">
                        <i className="pi pi-compass text-stone-400" style={{fontSize: "5rem"}}></i>
                        <span className="mt-5 text-center">Cluster planner</span>
                    </div>
            }
        </Block>
        <Block
            notActive={generatingProjectInProgress || openingProjectInProgress || wizardProjectInProgress}
            onClick={openProjectHandler}
            className="flex justify-center items-center w-[200px] h-[200px]">

            {
                openingProjectInProgress
                    ? <div className="flex flex-col items-center justify-center">
                        <ProgressSpinner strokeWidth="8" />
                        <span className="mt-5 text-center">Open Project</span>
                    </div>
                    : <div className="flex flex-col items-center justify-center">
                        <i className="pi pi-folder-open text-stone-400" style={{fontSize: "5rem"}}></i>
                        <span className="mt-5 text-center">Open Project</span>
                    </div>
            }
        </Block>
    </LogoContainer>
}

export default ProjectView