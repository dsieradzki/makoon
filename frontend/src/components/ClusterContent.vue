<template>
  <div class="flex flex-col p-5">
    <div class="font-bold text-2xl p-5">Master Nodes</div>
    <div class="flex items-center flex-wrap">
      <KubeNode
          v-for="kNode in store.masterNodes"
          :node="kNode"
          :selected="isSelected('NodeProperties', kNode.vmid.toString())"
          @select="()=>{onSelectBlock('NodeProperties', kNode.vmid.toString())}"
          :key="kNode.vmid"
          class="mr-5"></KubeNode>
      <Block class="flex justify-center items-center w-[200px] h-[200px]"
             @click="store.addNode('master')">
        <i class="pi pi-plus text-stone-400" :class="$style.addBlock"></i>
      </Block>
    </div>


    <div class="font-bold text-2xl px-5 pt-10 pb-5">Workers Nodes</div>
    <div class="flex items-center flex-wrap">
      <KubeNode
          v-for="kNode in store.workerNodes"
          :node="kNode"
          :selected="isSelected('NodeProperties', kNode.vmid.toString())"
          @select="()=>{onSelectBlock('NodeProperties', kNode.vmid.toString())}"
          :key="kNode.vmid"
          class="mr-5"></KubeNode>
      <Block class="flex justify-center items-center w-[200px] h-[200px]"
             @click="store.addNode('worker')">
        <i class="pi pi-plus text-stone-400" :class="$style.addBlock"></i>
      </Block>
    </div>

    <div class="font-bold text-2xl px-5 pt-10 pb-5">Addons</div>
    <div class="flex items-center pb-5">
      <Block
          v-for="addon in enabledMicroK8sAddons"
          :key="addon.name"
          class="mr-5"
          :selected="isSelected(featurePanelName(app.name), addon.name)"
          @select="()=>{onSelectBlock(featurePanelName(app.name), addon.name)}"
          :title="addon.title"></Block>
      <Block
          v-for="addon in availableMicroK8sAddons"
          :key="addon.name"
          :not-active="true"
          class="mr-5"
          :selected="isSelected(featurePanelName(app.name), addon.name)"
          @select="()=>{onSelectBlock(featurePanelName(app.name), addon.name)}"
          :title="addon.title"></Block>
    </div>

    <div class="font-bold text-2xl px-5 pt-10 pb-5">Helm apps</div>
    <div class="flex items-center pb-5">
      <Block
          v-for="app in enabledHelmApps"
          :key="app.name"
          class="mr-5"
          :selected="isSelected(featurePanelName(app.name), app.name)"
          @select="()=>{onSelectBlock(featurePanelName(app.name), app.name)}"
          :title="app.title"></Block>
      <Block
          v-for="app in availableHelmApps"
          :key="app.name"
          :not-active="true"
          class="mr-5"
          :selected="isSelected(featurePanelName(app.name), app.name)"
          @select="()=>{onSelectBlock(featurePanelName(app.name), app.name)}"
          :title="app.title"></Block>
    </div>

    <div class="font-bold text-2xl px-5 pt-10 pb-5">Custom Helm apps</div>
    <div class="flex items-center pb-5">
      <Block
          v-for="app in store.customHelmApps"
          :key="app.releaseName"
          class="mr-5"
          :selected="isSelected('CustomHelmApp', app.releaseName)"
          @select="()=>{onSelectBlock('CustomHelmApp', app.releaseName)}"
          :title="app.releaseName"></Block>
      <Block class="flex justify-center items-center w-[200px] h-[200px]"
             @click="addCustomHelmApp">
        <i class="pi pi-plus text-stone-400"></i>
      </Block>
    </div>

    <div class="font-bold text-2xl px-5 pt-10 pb-5">Custom Kubernetes resource</div>
    <div class="flex items-center pb-5">
      <Block
          v-for="app in store.customK8SResources"
          :key="app.name"
          class="mr-5"
          :selected="isSelected('CustomK8sResource', app.name)"
          @select="()=>{onSelectBlock('CustomK8sResource', app.name)}"
          :title="app.name"></Block>
      <Block class="flex justify-center items-center w-[200px] h-[200px]"
             @click="addCustomK8sResource">
        <i class="pi pi-plus text-stone-400"></i>
      </Block>
    </div>
  </div>
</template>
<script lang="ts" setup>
import Block from "@/components/Block.vue";
import KubeNode from "@/components/KubeNode.vue";
import type {FeatureDefinition} from "@/stores/projectStore";
import {ADDON_DEFINITIONS, HELM_APP_DEFINITIONS, useProjectStore} from "@/stores/projectStore";
import {usePropertiesPanelStore} from "@/stores/propertiesPanelStore";
import {computed} from "vue";

const propertiesPanelStore = usePropertiesPanelStore();

const onSelectBlock = function (panelKey: string, id: string): void {
  propertiesPanelStore.selectPanel(panelKey, id);
}
const store = useProjectStore();

const featurePanelName = function (name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1) + 'Properties';
}
const isSelected = function (panelKey: string, id: string): boolean {
  return propertiesPanelStore.propertiesId === id && propertiesPanelStore.propertiesPanelKey === panelKey;
}


const enabledMicroK8sAddons = computed((): FeatureDefinition[] => {
  return ADDON_DEFINITIONS.filter(e => store.microK8sAddons.find(i => i.name === e.name));
});
const availableMicroK8sAddons = computed((): FeatureDefinition[] => {
  return ADDON_DEFINITIONS.filter(e => !store.microK8sAddons.find(i => i.name === e.name));
});

const enabledHelmApps = computed((): FeatureDefinition[] => {
  return HELM_APP_DEFINITIONS.filter(e => store.helmApps.find(i => i.chartName === e.name));
});

const availableHelmApps = computed((): FeatureDefinition[] => {
  return HELM_APP_DEFINITIONS.filter(e => !store.helmApps.find(i => i.chartName === e.name));
});

const addCustomHelmApp = function () {
  propertiesPanelStore.selectPanel("CustomHelmApp");
}
const addCustomK8sResource = function () {
  propertiesPanelStore.selectPanel("CustomHelmApp");
}
</script>
<style module>
.addBlock {
  font-size: 5rem;
}
</style>