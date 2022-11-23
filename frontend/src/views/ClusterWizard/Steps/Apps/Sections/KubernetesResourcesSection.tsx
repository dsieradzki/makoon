import React, { useContext } from 'react';
import Block from "@/components/Block";
import Section from "@/components/Section";
import { observer } from "mobx-react-lite";
import uiPropertiesPanelStore from "@/store/uiPropertiesPanelStore";
import { ClusterWizardStoreContext } from "@/views/ClusterWizard/ClusterWizardView";
import { K8S_RESOURCES_PROPERTIES_PANEL_NAME } from "@/components/PropertiesPanel";


const KubernetesResourcesSection = () => {
    const clusterStore = useContext(ClusterWizardStoreContext)
    const isSelected = function (panelKey: string, id: string): boolean {
        return uiPropertiesPanelStore.selectedPropertiesId === id && uiPropertiesPanelStore.selectedPropertiesPanelKey === panelKey;
    }

    const onSelectBlock = (name: string, id: string) => {
        uiPropertiesPanelStore.selectPanel(name, id);
    }

    const addCustomK8sResource = function () {
        uiPropertiesPanelStore.selectPanel(K8S_RESOURCES_PROPERTIES_PANEL_NAME);
    }

    return (
        <Section
            title={<>
                <div className="mr-5">Kubernetes resources</div>
                <Block className="flex justify-center items-center w-[56px] h-[56px]"
                       onClick={addCustomK8sResource}>
                    <i className="pi pi-plus primary-text-color"></i>
                </Block>
            </>}>
            {
                clusterStore.k8SResources.length == 0 &&
                <div className="w-full text-2xl text-stone-600 text-center">No Kubernetes resources</div>
            }
            <div className="flex items-center pb-5">
                {
                    clusterStore.k8SResources.map(res =>
                        <Block
                            key={res.name}
                            className="mr-5 px-5"
                            selected={isSelected(K8S_RESOURCES_PROPERTIES_PANEL_NAME, res.name)}
                            onClick={() => {
                                onSelectBlock(K8S_RESOURCES_PROPERTIES_PANEL_NAME, res.name)
                            }}
                            title={res.name}/>
                    )
                }
            </div>

        </Section>
    );
};

export default observer(KubernetesResourcesSection);