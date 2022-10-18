import React, { useState } from 'react';
import Block from "@/components/Block";
import Section from "@/views/ClusterWizard/Section";
import TileNodes from "@/views/ClusterWizard/Steps/Nodes/Sections/Nodes/TileNodes";
import { SelectButton } from "primereact/selectbutton";
import TableNodes from "@/views/ClusterWizard/Steps/Nodes/Sections/Nodes/TableNodes";
import projectStore from "@/store/projectStore";
import { observer } from "mobx-react-lite";
import uiPropertiesPanelStore from "@/store/uiPropertiesPanelStore";

const viewOptions = [
    {icon: 'pi pi-list', value: true},
    {icon: 'pi pi-th-large', value: false},
];
const viewOptionTemplate = (option: any) => {
    return <i className={option.icon}></i>;
}

const panelName = 'NodeProperties'

const WorkerNodesSection = () => {
    const [nodesViewType, setNodesViewType] = useState(true);

    const onClickNodeHandler = (id: any) => {
        uiPropertiesPanelStore.selectPanel(panelName, String(id))
    }
    const addNodeHandler = () => {
        projectStore.addNode("master")
    }

    const getSelectedId = (): string | null => {
        if (uiPropertiesPanelStore.selectedPropertiesPanelKey == panelName) {
            return uiPropertiesPanelStore.selectedPropertiesId
        } else {
            return null
        }
    }
    const title = <div className="w-full font-bold text-2xl flex items-center justify-between">
        <div className="flex items-center">
            <div className="mr-5">Master Nodes</div>
            <Block className="flex justify-center items-center w-[56px] h-[56px]"
                   onClick={addNodeHandler}>
                <i className="pi pi-plus primary-text-color"></i>
            </Block>
        </div>

        <div>
            <SelectButton value={nodesViewType} options={viewOptions} onChange={(e) => setNodesViewType(e.value)}
                          itemTemplate={viewOptionTemplate} optionLabel="value"/>
        </div>
    </div>

    return (
        <Section title={title}>
            {nodesViewType
                ? <TableNodes nodes={projectStore.masterNodes} selectedId={getSelectedId()} onClick={onClickNodeHandler}/>
                : <TileNodes nodes={projectStore.masterNodes} selectedId={getSelectedId()} onClick={onClickNodeHandler}/>
            }


        </Section>
    );
};

export default observer(WorkerNodesSection);