import React from 'react';
import Block from "@/components/Block";
import Section from "@/views/ClusterWizard/Section";
import projectStore from "@/store/projectStore";
import { observer } from "mobx-react-lite";
import uiPropertiesPanelStore from "@/store/uiPropertiesPanelStore";
import Table from "@/components/Table/Table";


const CustomHelmAppsSection = () => {
    const isSelected = function (panelKey: string, id: string): boolean {
        return uiPropertiesPanelStore.selectedPropertiesId === id && uiPropertiesPanelStore.selectedPropertiesPanelKey === panelKey;
    }

    const onSelectBlock = (name: string, id: string) => {
        uiPropertiesPanelStore.selectPanel(name, id);
    }

    const addCustomHelmApp = function () {
        uiPropertiesPanelStore.selectPanel("CustomHelmAppProperties");
    }

    return (
        <Section
            title={<>
                <div className="mr-5">Custom Helm apps
                </div>
                <Block className="flex justify-center items-center w-[56px] h-[56px]"
                       onClick={addCustomHelmApp}>
                    <i className="pi pi-plus primary-text-color"></i>
                </Block>
            </>}>

            { projectStore.customHelmApps.length > 0 &&
                <Table>
                    <Table.Header>Release name</Table.Header>
                    <Table.Header>Chart name</Table.Header>
                    <Table.Header>Namespace</Table.Header>

                    {projectStore.customHelmApps.map(app =>
                        <Table.Row
                            id={app.repository}
                            key={app.releaseName}
                            selected={isSelected('CustomHelmAppProperties', app.releaseName)}
                            onClick={() => {
                                onSelectBlock('CustomHelmAppProperties', app.releaseName)
                            }}
                        >
                            <Table.Column>{app.releaseName}</Table.Column>
                            <Table.Column>{app.chartName}</Table.Column>
                            <Table.Column>{app.namespace}</Table.Column>
                        </Table.Row>
                    )}
                </Table>
            }
            {
                projectStore.customHelmApps.length == 0 &&
                <div className="w-full text-2xl text-stone-600 text-center">No custom Help apps</div>
            }
        </Section>
    );
};

export default observer(CustomHelmAppsSection);