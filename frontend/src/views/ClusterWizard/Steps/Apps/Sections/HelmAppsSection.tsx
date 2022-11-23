import React, { useContext } from 'react';
import Block from "@/components/Block";
import Section from "@/components/Section";
import { observer } from "mobx-react-lite";
import uiPropertiesPanelStore from "@/store/uiPropertiesPanelStore";
import Table from "@/components/Table/Table";
import { ClusterWizardStoreContext } from "@/views/ClusterWizard/ClusterWizardView";
import { HELM_APP_PROPERTIES_PANEL_NAME } from "@/components/PropertiesPanel";


const HelmAppsSection = () => {
    const clusterStore = useContext(ClusterWizardStoreContext)
    const isSelected = function (panelKey: string, id: string): boolean {
        return uiPropertiesPanelStore.selectedPropertiesId === id && uiPropertiesPanelStore.selectedPropertiesPanelKey === panelKey;
    }

    const onSelectBlock = (name: string, id: string) => {
        uiPropertiesPanelStore.selectPanel(name, id);
    }

    const addCustomHelmApp = function () {
        uiPropertiesPanelStore.selectPanel(HELM_APP_PROPERTIES_PANEL_NAME);
    }

    return (
        <Section
            title={<>
                <div className="mr-5">Helm apps
                </div>
                <Block className="flex justify-center items-center w-[56px] h-[56px]"
                       onClick={addCustomHelmApp}>
                    <i className="pi pi-plus primary-text-color"></i>
                </Block>
            </>}>

            {clusterStore.helmApps.length > 0 &&
                <Table>
                    <Table.Header>Release name</Table.Header>
                    <Table.Header>Chart name</Table.Header>
                    <Table.Header>Version</Table.Header>
                    <Table.Header>Namespace</Table.Header>

                    {clusterStore.helmApps.map(app =>
                        <Table.Row
                            id={app.repository}
                            key={app.releaseName}
                            selected={isSelected(HELM_APP_PROPERTIES_PANEL_NAME, app.releaseName)}
                            onClick={() => {
                                onSelectBlock(HELM_APP_PROPERTIES_PANEL_NAME, app.releaseName)
                            }}
                        >
                            <Table.Column>{app.releaseName}</Table.Column>
                            <Table.Column>{app.chartName}</Table.Column>
                            <Table.Column>{
                                app.version && app.version.length > 0
                                    ? app.version
                                    : "latest"}
                            </Table.Column>
                            <Table.Column>{app.namespace}</Table.Column>
                        </Table.Row>
                    )}
                </Table>
            }
            {
                clusterStore.helmApps.length == 0 &&
                <div className="w-full text-2xl text-stone-600 text-center">No Helm apps</div>
            }
        </Section>
    );
};

export default observer(HelmAppsSection);