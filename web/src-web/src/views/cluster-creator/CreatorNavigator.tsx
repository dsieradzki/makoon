import React from 'react';
import {CreatorNavigationContext, CreatorNavigationContextType} from "@/views/cluster-creator/context";
import {Button} from "primereact/button";

type Props = {
    previousDisabled?: boolean;
    nextDisabled?: boolean;
    previousHidden?: boolean;
    nextHidden?: boolean;
    onNext?: () => Promise<void>
    onPrevious?: () => Promise<void>
}
const Navigator = (props: Props) => {
    return (
        <div className="flex justify-end">
            <div className="flex">

                {props.previousHidden
                    ? null
                    : <div className="mr-4">
                        <Button label="Back" link
                                disabled={props.previousDisabled}
                                onClick={async () => {
                                    if (!props.previousDisabled && props.onPrevious) {
                                        await props.onPrevious()
                                    }
                                }}
                        />
                    </div>
                }
            </div>
            {props.nextHidden
                ? null
                : <Button label="Next" icon="pi pi-chevron-right"
                          disabled={props.nextDisabled}
                          onClick={async () => {
                              if (!props.nextDisabled && props.onNext) {
                                  await props.onNext()
                              }
                          }}/>
            }

        </div>

    );
};

export default Navigator;