import { Tag } from "primereact/tag";
import React from "react";
import { ProgressSpinner } from 'primereact/progressspinner';
import { AppStatusType } from "@/api/model";

type HelmAppStatusComponentProps = {
    status: AppStatusType | null
    className?: string
}

const HelmAppStatus = (props: HelmAppStatusComponentProps) => {
    switch (props.status) {
        case AppStatusType.Unknown:
            return <Tag className={`${props.className} h-[23px]`} severity="danger" value="Unknown"/>
        case AppStatusType.Deployed:
            return <Tag className={`${props.className} h-[23px]`}
                        severity={"success"} value="Deployed"/>
        case AppStatusType.Uninstalled:
            return <Tag className={`${props.className} h-[23px]`}
                        severity={"warning"} value="Uninstalled"/>
        case AppStatusType.Superseded:
            return <Tag className={`${props.className} h-[23px]`}
                        severity={"warning"} value="Superseded"/>
        case AppStatusType.Failed:
            return <Tag className={`${props.className} h-[23px]`}
                        severity={"danger"} value="Failed"/>
        case AppStatusType.Uninstalling:
            return <Tag className={`${props.className} h-[23px]`}
                        severity={"warning"} value="Uninstalling"/>
        case AppStatusType.PendingInstall:
            return <Tag className={`${props.className} h-[23px]`}
                        severity={"warning"} value="Pending install"/>
        case AppStatusType.PendingUpgrade:
            return <Tag className={`${props.className} h-[23px]`}
                        severity={"warning"} value="Pending upgrade"/>
        case AppStatusType.PendingRollback:
            return <Tag className={`${props.className} h-[23px]`}
                        severity={"warning"} value="Pending rollback"/>
        case AppStatusType.NotInstalled:
            return <Tag className={`${props.className} h-[23px]`}
                        severity={"warning"} value="Not installed"/>
        case null:
            return <Tag className={`${props.className} h-[23px]`} severity="warning" value={
                <div className="flex justify-center items-center w-[60px] p-0 m-0">
                    <ProgressSpinner style={{width: '15px', height: '15px'}} strokeWidth="10"/>
                </div>
            }/>
        default:
            return <Tag className={`${props.className} h-[23px]`}
                        severity={"danger"} value="[Status not known]"/>
    }
}

export default HelmAppStatus