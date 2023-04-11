import React from "react";

type Props = {
    title?: string | React.ReactNode
    titleContainerClass?:string
} & React.PropsWithChildren

const Section = (props: Props) => {
    return <>
        <div className={`font-bold text-2xl px-5 pb-5 flex items-center mt-5 ${props.titleContainerClass}`}>
            {props.title}
        </div>
        <div className="pb-5">
            {props.children}
        </div>
    </>
}

export default Section