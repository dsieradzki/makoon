import {Tag} from "primereact/tag";
import React from "react";
import {ProgressSpinner} from "primereact/progressspinner";
import {VmStatus} from "@/api/model";

type VmStatusComponentProps = {
    status: VmStatus | null;
    className?: string
}
const VmStatusInfo = (props: VmStatusComponentProps) => {
    switch (props.status) {
        case VmStatus.Running:
            return <i className={`pi pi-check-circle text-success ${props.className ?? ""}`} title="VM is runnig"></i>
        case VmStatus.Stopped:
            return <i className={`pi pi-times-circle text-danger ${props.className ?? ""}`} title="VM is stopped"></i>
        case null:
            return <ProgressSpinner className={props.className} style={{width: '15px', height: '15px'}} strokeWidth="10"/>

    }
}

export default VmStatusInfo