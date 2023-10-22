import React from "react";
import {ClusterState} from "@/api/model";

type Props = {
    status: ClusterState;
    className?: string
}
const ClusterStatus = (props: Props) => {
    switch (props.status) {
        case ClusterState.Pending:
            return <i className={`pi pi-hourglass text-unavailable ${props.className ?? ""}`} title="Pending"></i>
        case ClusterState.Creating:
            return <i className={`pi pi-bolt text-warning ${props.className ?? ""}`} title="Creating"></i>
        case ClusterState.Sync:
            return <i className={`pi pi-check-circle text-success ${props.className ?? ""}`} title="Sync"></i>
        case ClusterState.OutOfSync:
            return <i className={`pi pi-exclamation-circle text-unavailable ${props.className ?? ""}`} title="Out of sync"></i>
        case ClusterState.Destroying:
            return <i className={`pi pi-trash text-warning ${props.className ?? ""}`} title="Destroying"></i>
        case ClusterState.Error:
            return <i className={`pi pi-times-circle text-danger ${props.className ?? ""}`} title="Error"></i>
    }
}

export default ClusterStatus