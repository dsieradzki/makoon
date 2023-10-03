import React, {PropsWithChildren} from "react";

export type Props = {
    className?: string;
    title?: string | React.ReactNode;
    icon?: string;
} & PropsWithChildren;
const Panel = (props: Props) => {
    return <div className={`bg-white rounded-2xl p-4 w-full flex flex-col ${props.className} text-text`}>
        {
            props.title &&
            <div className="flex items-center mb-2">
                {props.icon
                    ? <i className={`pi ${props.icon} text-primary`}/>
                    : <div className="rounded w-[20px] h-[20px] bg-primary"></div>
                }
                <div className="ml-1 font-semibold">{props.title}</div>
            </div>
        }
        <div className="grow min-h-0">{props.children}</div>
    </div>;
}

const TitleContainer = (props: { value: string } & PropsWithChildren) => {
    return <div className="flex items-center">
        <span className="mr-2">{props.value}</span>
        {props.children}
    </div>;
}

Panel.Title = TitleContainer;
export default Panel;