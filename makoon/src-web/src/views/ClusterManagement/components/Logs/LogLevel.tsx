import { Tag } from "primereact/tag";
import React from "react";
import { ActionLogEntry, ActionLogLevel, ClusterStatus } from "@/api/model";

type Props = {
    value: ActionLogLevel;
    className?: string
}
const LogLevel = (props: Props) => {
    switch (props.value) {
        case ActionLogLevel.Info:
            return <Tag className={`${props.className} h-[23px]`} severity="info" value="Info"/>
        case ActionLogLevel.Error:
            return <Tag className={`${props.className} h-[23px]`} severity="danger" value="Error"/>
    }
}

export default LogLevel;