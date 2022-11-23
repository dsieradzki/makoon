import { Tag } from "primereact/tag";
import React from "react";
import { ProgressSpinner } from 'primereact/progressspinner';

type HelmAppStatusComponentProps = {
    status: string
    className?: string
}

const HelmAppStatusComponent = (props: HelmAppStatusComponentProps) => {
    switch (props.status) {
        case "unknown":
            return <Tag className={`${props.className} h-[23px]`} severity="danger" value="Unknown"/>
        case "deployed":
            return <Tag className={`${props.className} h-[23px]`}
                        severity={"success"} value="Deployed"/>
        case "uninstalled":
            return <Tag className={`${props.className} h-[23px]`}
                        severity={"warning"} value="Uninstalled"/>
        case "superseded":
            return <Tag className={`${props.className} h-[23px]`}
                        severity={"warning"} value="Superseded"/>
        case "failed":
            return <Tag className={`${props.className} h-[23px]`}
                        severity={"danger"} value="Failed"/>
        case "uninstalling":
            return <Tag className={`${props.className} h-[23px]`}
                        severity={"warning"} value="Uninstalling"/>
        case "pending-install":
            return <Tag className={`${props.className} h-[23px]`}
                        severity={"warning"} value="Pending install"/>
        case "pending-upgrade":
            return <Tag className={`${props.className} h-[23px]`}
                        severity={"warning"} value="Pending upgrade"/>
        case "pending-rollback":
            return <Tag className={`${props.className} h-[23px]`}
                        severity={"warning"} value="Pending rollback"/>
        case "not_installed":
            return <Tag className={`${props.className} h-[23px]`}
                        severity={"warning"} value="Not installed"/>
        case "loading":
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

export default HelmAppStatusComponent