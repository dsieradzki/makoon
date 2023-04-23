import React from 'react';
import Section from "@/components/Section";
import {observer} from "mobx-react-lite";
import uiPropertiesPanelStore from "@/store/uiPropertiesPanelStore";
import TableNodes from "@/views/ClusterManagement/components/Nodes/TableNodes";
import {NodeWithStatus} from "@/store/clusterManagementStore";
import {MANAGEMENT_EDIT_NODE_PROPERTIES_PANEL_NAME} from "@/components/PropertiesPanel";
import Block from "@/components/Block";

const viewOptions = [
    {icon: 'pi pi-list', value: true},
    {icon: 'pi pi-th-large', value: false},
];
const viewOptionTemplate = (option: any) => {
    return <i className={option.icon}></i>;
}


type Props = {
    title: string
    clusterName: string
    nodes: NodeWithStatus[]
    onAddNode: () => void
}
const NodesSection = (props: Props) => {
    const onClickNodeHandler = (id: any) => {
        uiPropertiesPanelStore.selectPanel(MANAGEMENT_EDIT_NODE_PROPERTIES_PANEL_NAME, String(id))
    }

    const getSelectedId = (): string | null => {
        if (uiPropertiesPanelStore.selectedPropertiesPanelKey == MANAGEMENT_EDIT_NODE_PROPERTIES_PANEL_NAME) {
            return uiPropertiesPanelStore.selectedPropertiesId
        } else {
            return null
        }
    }
    const title = <div className="w-full font-bold text-2xl flex items-center justify-between">
        <div className="flex items-center">
            <div className="mr-5">{props.title}</div>
            <Block className="flex justify-center items-center w-[56px] h-[56px]"
                   onClick={props.onAddNode}>
                <i className="pi pi-plus primary-text-color"></i>
            </Block>
        </div>
    </div>

    return (
        <Section title={title} titleContainerClass="-ml-5">
            <TableNodes clusterName={props.clusterName} nodes={props.nodes} selectedId={getSelectedId()}
                        onClick={onClickNodeHandler}/>
        </Section>
    );
};

export default observer(NodesSection);