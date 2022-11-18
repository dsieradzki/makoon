import React from 'react';
import { observer } from "mobx-react-lite";
import Table from "@/components/Table/Table";
import Section from "@/components/Section";
import clusterManagementStore from "@/store/clusterManagementStore";
import Block from "@/components/Block";
import HelmAppStatusComponent from "@/views/ClusterManagement/components/Apps/HelmAppStatusComponent";
import uiPropertiesPanelStore from "@/store/uiPropertiesPanelStore";
import {
    CLUSTER_MANAGEMENT_HELM_APP_PROPERTIES_PANEL_NAME,
    CLUSTER_MANAGER_K8S_RESOURCES_PROPERTIES_PANEL_NAME
} from "@/components/PropertiesPanel";


const Apps = () => {
    const helmApps = clusterManagementStore.helmAppsWithStatus

    const isSelected = function (panelKey: string, id: string): boolean {
        return uiPropertiesPanelStore.selectedPropertiesId === id && uiPropertiesPanelStore.selectedPropertiesPanelKey === panelKey;
    }
    const onClickNodeHandler = (id: any) => {
        uiPropertiesPanelStore.selectPanel(CLUSTER_MANAGEMENT_HELM_APP_PROPERTIES_PANEL_NAME, String(id))
    }

    const onClickK8SResourceHandler = (id: any) => {
        uiPropertiesPanelStore.selectPanel(CLUSTER_MANAGER_K8S_RESOURCES_PROPERTIES_PANEL_NAME, String(id))
    }

    return <>
        <Section
            title={<>
                <div className="mr-5">Helm apps
                </div>
                <Block
                    onClick={() => {
                        uiPropertiesPanelStore.selectPanel(CLUSTER_MANAGEMENT_HELM_APP_PROPERTIES_PANEL_NAME)
                    }}
                    className="flex justify-center items-center w-[56px] h-[56px]">
                    <i className="pi pi-plus primary-text-color"></i>
                </Block>
            </>}>

            {helmApps.length > 0 &&
                <Table>
                    <Table.Header>Release name</Table.Header>
                    <Table.Header>Chart name</Table.Header>
                    <Table.Header>Version</Table.Header>
                    <Table.Header>Namespace</Table.Header>
                    <Table.Header>Status</Table.Header>

                    {helmApps.map(app =>
                        <Table.Row
                            id={app.repository}
                            key={app.id}
                            selected={isSelected(CLUSTER_MANAGEMENT_HELM_APP_PROPERTIES_PANEL_NAME, app.releaseName)}
                            onClick={() => {
                                onClickNodeHandler(app.id)
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
                            <Table.Column>
                                <HelmAppStatusComponent status={app.status.status}/>
                            </Table.Column>
                        </Table.Row>
                    )}
                </Table>
            }
            {
                helmApps.length == 0 &&
                <div className="w-full text-2xl text-stone-600 text-center">No Helm apps</div>
            }
        </Section>
        <Section
            title={<>
                <div className="mr-5">Kubernetes resources</div>
                <Block className="flex justify-center items-center w-[56px] h-[56px]"
                       onClick={() => {
                           uiPropertiesPanelStore.selectPanel(CLUSTER_MANAGER_K8S_RESOURCES_PROPERTIES_PANEL_NAME);
                       }}
                >
                    <i className="pi pi-plus primary-text-color"></i>
                </Block>
            </>}>
            {
                (clusterManagementStore.cluster.k8SResources || []).length == 0 &&
                <div className="w-full text-2xl text-stone-600 text-center">No Kubernetes resources</div>
            }
            <div className="flex items-center pb-5">
                {
                    (clusterManagementStore.cluster.k8SResources || []).map(res =>
                        <Block
                            key={res.id}
                            className="mr-5 px-5"
                            selected={isSelected(CLUSTER_MANAGER_K8S_RESOURCES_PROPERTIES_PANEL_NAME, res.id)}
                            onClick={() => {
                                onClickK8SResourceHandler(res.id)
                            }}
                            title={res.name}/>
                    )
                }
            </div>

        </Section>
    </>;
};

export default observer(Apps);