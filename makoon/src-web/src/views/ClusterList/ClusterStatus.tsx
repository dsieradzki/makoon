import { Tag } from "primereact/tag";
import React from "react";
import { ClusterStatus as ClusterStatusValue } from "@/api/model";

type Props = {
    status: ClusterStatusValue;
    className?: string
}
const ClusterStatus = (props: Props) => {
    switch (props.status) {
        case ClusterStatusValue.Pending:
            return <Tag className={`${props.className} h-[23px]`} severity="warning" value="Pending"/>
        case ClusterStatusValue.Creating:
            return <Tag className={`${props.className} h-[23px]`} severity="warning" value="Creating"/>
        case ClusterStatusValue.Sync:
            return <>&nbsp;</>
        case ClusterStatusValue.OutOfSync:
            return <Tag className={`${props.className} h-[23px]`} severity="warning" value="Out of sync"/>
        case ClusterStatusValue.Destroying:
            return <Tag className={`${props.className} h-[23px]`} severity="danger" value="Destroying"/>
        case ClusterStatusValue.Error:
            return <Tag className={`${props.className} h-[23px]`} severity="danger" value="Error"/>
    }
}

export default ClusterStatus