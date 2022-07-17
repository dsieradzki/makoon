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

    <div class="font-bold text-2xl px-5 pt-10 pb-5">Enabled Features</div>
    <div class="flex items-center pb-5">
      <Block
          v-for="feature in enabledFeatures"
          :key="feature.name"
          class="mr-5"
          :selected="isSelected(feature.name, feature.name.charAt(0).toUpperCase()+feature.name.slice(1)+'Properties')"
          @select="()=>{onSelectBlock(feature.name, feature.name.charAt(0).toUpperCase()+feature.name.slice(1)+'Properties')}"
          :title="feature.title"></Block>
    </div>
    <div class="font-bold text-2xl px-5 pt-10 pb-5">Available Features</div>
    <div class="flex items-center pb-5">
      <Block
          v-for="feature in availableFeatures"
          :key="feature.name"
          :not-active="true"
          class="mr-5"
          :selected="isSelected(feature.name, feature.name.charAt(0).toUpperCase()+feature.name.slice(1)+'Properties')"
          @select="()=>{onSelectBlock(feature.name, feature.name.charAt(0).toUpperCase()+feature.name.slice(1)+'Properties')}"
          :title="feature.title"></Block>
    </div>
  </div>
</template>
<script lang="ts" setup>
import Block from "@/components/Block.vue";
import KubeNode from "@/components/KubeNode.vue";
import type {FeatureDefinition} from "@/stores/projectStore";
import {FEATURE_DEFINITIONS, useProjectStore} from "@/stores/projectStore";
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

const enabledFeatures = computed((): FeatureDefinition[] => {
  return FEATURE_DEFINITIONS.filter(e => store.features.find(i => i.name === e.name));
});
const availableFeatures = computed((): FeatureDefinition[] => {
  return FEATURE_DEFINITIONS.filter(e => !store.features.find(i => i.name === e.name));
});

</script>