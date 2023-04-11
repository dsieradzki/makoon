import { Tag } from "primereact/tag";
import React from "react";
import { ProgressSpinner } from 'primereact/progressspinner';
import { KubeStatus } from "@/api/model";

type K8sStatusComponentProps = {
    status: KubeStatus | null
    vmStatusProblem: boolean
    className?: string
}
const K8sStatusComponent = (props: K8sStatusComponentProps) => {
    switch (props.status) {
        case KubeStatus.Ready:
            return <Tag className={`${props.className} h-[23px]`}
                        severity={props.vmStatusProblem ? "warning" : "success"} value="Ready"/>
        case KubeStatus.Unknown:
            return <Tag className={`${props.className} h-[23px]`} severity="danger" value="Unknown"/>
        case KubeStatus.NotReady:
            return <Tag className={`${props.className} h-[23px]`} severity="danger" value="Not ready"/>
        case null:
            return <Tag className={`${props.className} h-[23px]`} severity="warning" value={
                <div className="flex justify-center items-center w-[60px]">
                    <ProgressSpinner style={{width: '15px', height: '15px'}} strokeWidth="10"/>
                </div>
            }/>
    }
}

export default K8sStatusComponent