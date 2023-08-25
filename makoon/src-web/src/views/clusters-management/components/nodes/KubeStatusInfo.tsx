import { Tag } from "primereact/tag";
import React from "react";
import { ProgressSpinner } from 'primereact/progressspinner';
import { KubeStatus } from "@/api/model";

type K8sStatusComponentProps = {
    status: KubeStatus | null
    vmStatusProblem: boolean
    className?: string
}
const KubeStatusInfo = (props: K8sStatusComponentProps) => {
    switch (props.status) {
        case KubeStatus.Ready:
            return <i className={`pi pi-check-circle ${props.vmStatusProblem ? "text-warning" : "text-success"}  ${props.className ?? ""}`} title="Ready"></i>
        case KubeStatus.Unknown:
            return <i className={`pi pi-question-circle text-unavailable ${props.className ?? ""}`} title="Unknown"></i>
        case KubeStatus.NotReady:
            return <i className={`pi pi-times-circle text-danger ${props.className ?? ""}`} title="Not ready"></i>
        case null:
            return<ProgressSpinner className={props.className} style={{width: '15px', height: '15px'}} strokeWidth="10"/>

    }
}

export default KubeStatusInfo