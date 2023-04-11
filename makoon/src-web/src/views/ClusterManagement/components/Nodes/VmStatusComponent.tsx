import {Tag} from "primereact/tag";
import React from "react";
import {ProgressSpinner} from "primereact/progressspinner";
import {VmStatus} from "@/api/model";

type VmStatusComponentProps = {
    status: VmStatus | null;
    className?: string
}
const VmStatusComponent = (props: VmStatusComponentProps) => {
    switch (props.status) {
        case VmStatus.Running:
            return <Tag className={`${props.className} h-[23px]`} severity="success" value="Up"/>
        case VmStatus.Stopped:
            return <Tag className={`${props.className} h-[23px]`} severity="danger" value="Down"/>
        case null:
            return <Tag className={`${props.className} h-[23px]`} severity="warning" value={
                <div className="flex justify-center items-center w-[60px]">
                    <ProgressSpinner style={{width: '15px', height: '15px'}} strokeWidth="10"/>
                </div>
            }/>
    }
}

export default VmStatusComponent