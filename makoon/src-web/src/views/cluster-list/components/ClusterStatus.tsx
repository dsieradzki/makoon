import React from "react";
import {ClusterStatus as ClusterStatusValue} from "@/api/model";

type Props = {
    status: ClusterStatusValue;
    className?: string
}
const ClusterStatus = (props: Props) => {
    switch (props.status) {
        case ClusterStatusValue.Pending:
            return <i className={`pi pi-hourglass text-unavailable ${props.className ?? ""}`} title="Pending"></i>
        case ClusterStatusValue.Creating:
            return <i className={`pi pi-bolt text-warning ${props.className ?? ""}`} title="Creating"></i>
        case ClusterStatusValue.Sync:
            return <i className={`pi pi-check-circle text-success ${props.className ?? ""}`} title="Sync"></i>
        case ClusterStatusValue.OutOfSync:
            return <i className={`pi pi-exclamation-circle text-unavailable ${props.className ?? ""}`} title="Out of sync"></i>
        case ClusterStatusValue.Destroying:
            return <i className={`pi pi-trash text-warning ${props.className ?? ""}`} title="Destroying"></i>
        case ClusterStatusValue.Error:
            return <i className={`pi pi-times-circle text-danger ${props.className ?? ""}`} title="Error"></i>
    }
}

export default ClusterStatus