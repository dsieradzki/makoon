import WorkloadsSection from "@/views/cluster-creator/steps/workloads/WorkloadsSection";
import {observer} from "mobx-react-lite";
import {CreatorNavigation, StepProps} from "@/views/cluster-creator/context";
import React, {useEffect, useImperativeHandle} from 'react';

const WorkloadsStep = (props: StepProps, ref: any) => {
    useImperativeHandle(ref, () => ({
        async next(): Promise<void> {
            await props.onNext();
        },
        async previous(): Promise<void> {
            await props.onPrevious();
        },
    } as CreatorNavigation));

    useEffect(() => {
        props.nextDisabled(false);
        props.previousDisabled(false);
    }, []);

    return <>
        <div className="mt-10"></div>
        <WorkloadsSection/>
    </>

}

export default observer(React.forwardRef(WorkloadsStep));