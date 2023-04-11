import React, { useState } from 'react';
import Section from "@/components/Section";
import { SelectButton } from "primereact/selectbutton";
import { observer } from "mobx-react-lite";
import uiPropertiesPanelStore from "@/store/uiPropertiesPanelStore";
import TableNodes from "@/views/ClusterManagement/components/Nodes/TableNodes";
import TileNodes from "@/views/ClusterManagement/components/Nodes/TileNodes";
import { NodeWithStatus } from "@/store/clusterManagementStore";
import { NODE_READ_ONLY_PROPERTIES_PANEL_NAME } from "@/components/PropertiesPanel";

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
    onAddNode: ()=>void
}
const NodesSection = (props: Props) => {
    const [nodesViewType, setNodesViewType] = useState(true);

    const onClickNodeHandler = (id: any) => {
        uiPropertiesPanelStore.selectPanel(NODE_READ_ONLY_PROPERTIES_PANEL_NAME, String(id))
    }

    const getSelectedId = (): string | null => {
        if (uiPropertiesPanelStore.selectedPropertiesPanelKey == NODE_READ_ONLY_PROPERTIES_PANEL_NAME) {
            return uiPropertiesPanelStore.selectedPropertiesId
        } else {
            return null
        }
    }
    const title = <div className="w-full font-bold text-2xl flex items-center justify-between">
        <div className="flex items-center">
            <div className="mr-5">{props.title}</div>
            {/*<Block className="flex justify-center items-center w-[56px] h-[56px]"*/}
            {/*       onClick={props.onAddNode}>*/}
            {/*    <i className="pi pi-plus primary-text-color"></i>*/}
            {/*</Block>*/}
        </div>

        <div>
            <SelectButton value={nodesViewType} options={viewOptions} onChange={(e) => setNodesViewType(e.value)}
                          itemTemplate={viewOptionTemplate} optionLabel="value"/>
        </div>
    </div>

    return (
        <Section title={title} titleContainerClass="-ml-5">
            {nodesViewType
                ? <TableNodes clusterName={props.clusterName} nodes={props.nodes} selectedId={getSelectedId()} onClick={onClickNodeHandler}/>
                : <TileNodes clusterName={props.clusterName} nodes={props.nodes} selectedId={getSelectedId()} onClick={onClickNodeHandler}/>
            }


        </Section>
    );
};

export default observer(NodesSection);