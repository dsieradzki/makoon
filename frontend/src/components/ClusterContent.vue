<template>
  <div class="flex flex-col p-5">
    <div class="font-bold text-2xl p-5">Master Nodes</div>
    <div class="flex items-center flex-wrap">
      <KubeNode
          v-for="kNode in store.masterNodes"
          :node="kNode"
          :selected="isSelected(kNode.vmid.toString(), 'NodeProperties')"
          @select="()=>{onSelectBlock(kNode.vmid.toString(), 'NodeProperties')}"
          :key="kNode.vmid"
          class="mr-5"></KubeNode>
      <Block class="flex justify-center items-center w-[200px] h-[200px]"
             @click="store.addNode('master')">
        <i class="pi pi-plus text-stone-400" style="font-size: 5rem"></i>
      </Block>
    </div>


    <div class="font-bold text-2xl px-5 pt-10 pb-5">Workers Nodes</div>
    <div class="flex items-center flex-wrap">
      <KubeNode
          v-for="kNode in store.workerNodes"
          :node="kNode"
          :selected="isSelected(kNode.vmid.toString(),  'NodeProperties')"
          @select="()=>{onSelectBlock(kNode.vmid.toString(),  'NodeProperties')}"
          :key="kNode.vmid"
          class="mr-5"></KubeNode>
      <Block class="flex justify-center items-center w-[200px] h-[200px]"
             @click="store.addNode('worker')">
        <i class="pi pi-plus text-stone-400" style="font-size: 5rem"></i>
      </Block>
    </div>

    <div class="font-bold text-2xl px-5 pt-10 pb-5">Addons</div>
    <div class="flex items-center pb-5">
      <Block
          v-for="addon in enabledMicroK8sAddons"
          :key="addon.name"
          class="mr-5"
          :selected="isSelected(addon.name, addon.name.charAt(0).toUpperCase()+addon.name.slice(1)+'Properties')"
          @select="()=>{onSelectBlock(addon.name, addon.name.charAt(0).toUpperCase()+addon.name.slice(1)+'Properties')}"
          :title="addon.title"></Block>
      <Block
          v-for="addon in availableMicroK8sAddons"
          :key="addon.name"
          :not-active="true"
          class="mr-5"
          :selected="isSelected(addon.name, addon.name.charAt(0).toUpperCase()+addon.name.slice(1)+'Properties')"
          @select="()=>{onSelectBlock(addon.name, addon.name.charAt(0).toUpperCase()+addon.name.slice(1)+'Properties')}"
          :title="addon.title"></Block>
    </div>

    <div class="font-bold text-2xl px-5 pt-10 pb-5">Helm apps</div>
    <div class="flex items-center pb-5">
      <Block
          v-for="app in enabledHelmApps"
          :key="app.name"
          class="mr-5"
          :selected="isSelected(app.name, app.name.charAt(0).toUpperCase()+app.name.slice(1)+'Properties')"
          @select="()=>{onSelectBlock(app.name, app.name.charAt(0).toUpperCase()+app.name.slice(1)+'Properties')}"
          :title="app.title"></Block>
      <Block
          v-for="app in availableHelmApps"
          :key="app.name"
          :not-active="true"
          class="mr-5"
          :selected="isSelected(app.name, app.name.charAt(0).toUpperCase()+app.name.slice(1)+'Properties')"
          @select="()=>{onSelectBlock(app.name, app.name.charAt(0).toUpperCase()+app.name.slice(1)+'Properties')}"
          :title="app.title"></Block>
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

const onSelectBlock = function (id: string, panelKey: string): void {
  propertiesPanelStore.selectPanel(id, panelKey);
}
const store = useProjectStore();

const isSelected = function (id: string, panelKey: string): boolean {
  return propertiesPanelStore.propertiesId === id && propertiesPanelStore.propertiesPanelKey === panelKey
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

</script>