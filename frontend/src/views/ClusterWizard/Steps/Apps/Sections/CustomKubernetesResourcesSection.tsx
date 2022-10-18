import React from 'react';
import Block from "@/components/Block";
import Section from "@/views/ClusterWizard/Section";
import { observer } from "mobx-react-lite";
import projectStore from "@/store/projectStore";
import uiPropertiesPanelStore from "@/store/uiPropertiesPanelStore";


const CustomKubernetesResourcesSection = () => {
    const isSelected = function (panelKey: string, id: string): boolean {
        return uiPropertiesPanelStore.selectedPropertiesId === id && uiPropertiesPanelStore.selectedPropertiesPanelKey === panelKey;
    }

    const onSelectBlock = (name: string, id: string) => {
        uiPropertiesPanelStore.selectPanel(name, id);
    }

    const addCustomK8sResource = function () {
        uiPropertiesPanelStore.selectPanel("CustomK8sResourceProperties");
    }

    return (
        <Section
            title={<>
                <div className="mr-5">Custom Kubernetes resources</div>
                <Block className="flex justify-center items-center w-[56px] h-[56px]"
                       onClick={addCustomK8sResource}>
                    <i className="pi pi-plus primary-text-color"></i>
                </Block>
            </>}>
            {
                projectStore.customK8SResources.length == 0 &&
                <div className="w-full text-2xl text-stone-600 text-center">No custom Kubernetes resources</div>
            }
            <div className="flex items-center pb-5">
                {
                    projectStore.customK8SResources.map(res =>
                        <Block
                            key={res.name}
                            className="mr-5 px-5"
                            selected={isSelected('CustomK8sResourceProperties', res.name)}
                            onClick={() => {
                                onSelectBlock('CustomK8sResourceProperties', res.name)
                            }}
                            title={res.name}/>
                    )
                }
            </div>

        </Section>
    );
};

export default observer(CustomKubernetesResourcesSection);