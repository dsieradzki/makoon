import React from 'react';
import { InputSwitch } from "primereact/inputswitch";
import projectStore from "@/store/projectStore";
import { observer } from "mobx-react-lite";
import TooltipOptions from "primereact/tooltip/tooltipoptions";

type Props = {
    name: string
    disabled?: boolean
    onChange?: (value: boolean) => void
    tooltip?: string
    tooltipOptions?: TooltipOptions
}


const AddonSwitch = (props: Props) => {
    const enabled = !!projectStore.microK8SAddons.find(e => e.name === props.name);
    const onChangeHandler = (state: boolean) => {
        if (state) {
            projectStore.enableMicroK8SAddon(props.name)
        } else {
            projectStore.disableMicroK8SAddon(props.name)
        }
        props.onChange && props.onChange(state)
    }
    return (
        <div>
            <InputSwitch tooltip={props.tooltip} tooltipOptions={props.tooltipOptions} disabled={props.disabled}
                         checked={enabled} onChange={s => onChangeHandler(s.value)}/>
        </div>
    );
};

export default observer(AddonSwitch);