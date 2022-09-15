import React from 'react';
import Block from "@/components/Block";
import Section from "@/views/ClusterWizard/Steps/ClusterPlanner/Sections/Section";
import projectStore, { ADDON_DEFINITIONS } from "@/store/projectStore";
import { observer } from "mobx-react-lite";
import uiPropertiesPanelStore from "@/store/uiPropertiesPanelStore";

const getPanelName = function (name: string): string {
    return ADDON_DEFINITIONS.find(e => e.name === name)?.panelName || ""
}

const AddonsSection = () => {

    const isSelected = (id: string): boolean => {
        if (uiPropertiesPanelStore.selectedPropertiesPanelKey == getPanelName(id)) {
            return uiPropertiesPanelStore.selectedPropertiesId === id
        } else {
            return false
        }
    }

    const onClickHandler = (id: string) => {
        uiPropertiesPanelStore.selectPanel(getPanelName(id), id)
    }

    return (
        <Section title="Addons">
            <div className="flex items-center">
                {
                    projectStore.enabledMicroK8sAddons.map(addon =>
                        <Block
                            key={addon.name}
                            className="mr-5 px-5"
                            selected={isSelected(addon.name)}
                            onClick={() => {
                                onClickHandler(addon.name)
                            }}
                            title={addon.title}/>
                    )
                }
                {
                    projectStore.availableMicroK8sAddons.map(addon =>
                        <Block
                            key={addon.name}
                            className="mr-5 px-5"
                            notActive={true}
                            selected={isSelected(addon.name)}
                            onClick={() => {
                                onClickHandler(addon.name)
                            }}
                            title={addon.title}/>
                    )
                }
            </div>
        </Section>
    );
};

export default observer(AddonsSection)