import React, {useEffect, useImperativeHandle} from 'react';
import {observer} from "mobx-react-lite";
import HelmAppsSection from "@/views/cluster-creator/steps/apps/HelmAppsSection";
import {CreatorNavigation, StepProps} from "@/views/cluster-creator/context";

const Index = (props: StepProps, ref: any) => {
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
        <HelmAppsSection/>
    </>
};

export default observer(React.forwardRef(Index));