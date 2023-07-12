import {Header, Props as HeaderProps} from "@/components/Header";
import React, {PropsWithChildren} from "react";

export type Props = {
    header?: HeaderProps
    className?: string
} & PropsWithChildren
const Content = (props: Props) => {
    return <div className={`w-full flex flex-col pl-8 pr-4 ${props.className ?? ""}`}>
        {
            props.header
                ? <Header {...props.header}/>
                : null
        }
        <div className="grow min-h-0 flex flex-col">
            {props.children}
        </div>
    </div>
}
export default Content;