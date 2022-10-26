import { Tag } from "primereact/tag";
import React from "react";
import { VmStatus } from "@/store/projectStore";
import { ProgressSpinner } from "primereact/progressspinner";

type VmStatusComponentProps = {
    status: VmStatus;
    className?: string
}
const VmStatusComponent = (props: VmStatusComponentProps) => {
    switch (props.status) {
        case "up":
            return <Tag className={`${props.className} h-[23px]`} severity="success" value="Up"/>
        case "down":
            return <Tag className={`${props.className} h-[23px]`} severity="danger" value="Down"/>
        case "loading":
            return <Tag className={`${props.className} h-[23px]`} severity="warning" value={
                <div className="flex justify-center items-center w-[60px]">
                    <ProgressSpinner style={{width: '15px', height: '15px'}} strokeWidth="10"/>
                </div>
            }/>
    }
}

export default VmStatusComponent