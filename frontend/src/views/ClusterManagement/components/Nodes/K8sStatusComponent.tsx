import { Tag } from "primereact/tag";
import React from "react";
import { K8sStatus } from "@/store/projectStore";
import { ProgressSpinner } from 'primereact/progressspinner';

type K8sStatusComponentProps = {
    status: K8sStatus
    vmStatusProblem: boolean
    className?: string
}
const K8sStatusComponent = (props: K8sStatusComponentProps) => {
    switch (props.status) {
        case "ready":
            return <Tag className={`${props.className} h-[23px]`}
                        severity={props.vmStatusProblem ? "warning" : "success"} value="Ready"/>
        case "unknown":
            return <Tag className={`${props.className} h-[23px]`} severity="danger" value="Unknown"/>
        case "not_ready":
            return <Tag className={`${props.className} h-[23px]`} severity="danger" value="Not ready"/>
        case "loading":
            return <Tag className={`${props.className} h-[23px]`} severity="warning" value={
                <div className="flex justify-center items-center w-[60px]">
                    <ProgressSpinner style={{width: '15px', height: '15px'}} strokeWidth="10"/>
                </div>
            }/>
    }
}

export default K8sStatusComponent