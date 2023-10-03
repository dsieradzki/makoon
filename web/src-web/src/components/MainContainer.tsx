import MainMenu from "@/components/MainMenu";
import React, {PropsWithChildren} from "react";
import Content from "@/components/Content";
import {Props as HeaderProps }from "@/components/Header";

export type Props = {
 header?: HeaderProps
} &PropsWithChildren;
const MainContainer = (props: Props)=>{
    return <main className="flex w-full h-full px-4 py-8 bg-bg">
        <MainMenu/>
        <Content header={props.header}>
            {props.children}
        </Content>
    </main>
}

export default MainContainer;
