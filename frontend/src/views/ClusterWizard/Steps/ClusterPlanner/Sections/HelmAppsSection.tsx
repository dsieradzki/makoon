import React from 'react';
import Block from "@/components/Block";
import Section from "@/views/ClusterWizard/Steps/ClusterPlanner/Sections/Section";
import projectStore, { ADDON_DEFINITIONS, HELM_APP_DEFINITIONS } from "@/store/projectStore";
import { observer } from "mobx-react-lite";
import uiPropertiesPanelStore from "@/store/uiPropertiesPanelStore";


const getPanelName = function (name: string): string {
    return HELM_APP_DEFINITIONS.find(e => e.name === name)?.panelName || ""
}

const HelmAppsSection = () => {

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
        <Section title="Helm apps">
            <div className="flex items-center">
                {
                    projectStore.enabledHelmApps.map(app =>
                        <Block
                            key={app.name}
                            className="mr-5 px-5"
                            selected={isSelected(app.name)}
                            onClick={() => {
                                onClickHandler(app.name)
                            }}
                            title={app.title}/>
                    )
                }
                {
                    projectStore.availableHelmApps.map(app =>
                        <Block
                            key={app.name}
                            className="mr-5 px-5"
                            notActive={true}
                            selected={isSelected(app.name)}
                            onClick={() => {
                                onClickHandler(app.name)
                            }}
                            title={app.title}/>
                    )
                }
            </div>
        </Section>
    );
};

export default observer(HelmAppsSection);