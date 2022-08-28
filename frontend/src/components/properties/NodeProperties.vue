<template>
  <div class="flex flex-col w-full h-full items-center">
    <div class="grow w-full">
      <div class="text-3xl text-center font-bold mt-5">Node Properties</div>
      <div class="p-10">
        <div>
          <div class="text-stone-400">VM id</div>
          <InputNumber class="w-full p-inputtext-sm" v-model="vmid" showButtons buttonLayout="horizontal"
                       incrementButtonIcon="pi pi-plus" decrementButtonIcon="pi pi-minus" :min="100"></InputNumber>
        </div>

        <div class="mt-3">
          <div class="text-stone-400">Node name</div>
          <InputText class="w-full p-inputtext-sm" v-model="nodeName"></InputText>
        </div>

        <div class="mt-3">
          <div class="text-stone-400">IP address</div>
          <InputText class="w-full p-inputtext-sm" v-model="ipAddress"></InputText>
        </div>

        <div class="mt-3">
          <div class="text-stone-400">Storage pool</div>
          <Dropdown class="w-full" v-model="storagePool" :options="storageNames"/>
        </div>

        <div class="border-t-2 border-stone-500 text-xl mt-10 mb-3">
          Resources
        </div>
        <div class="mt-3">
          <div class="text-stone-400">CPU cores</div>
          <InputNumber class="w-full p-inputtext-sm" v-model="cores" showButtons buttonLayout="horizontal"
                       incrementButtonIcon="pi pi-plus" decrementButtonIcon="pi pi-minus" :min="1"></InputNumber>
        </div>
        <div class="mt-3">
          <div class="text-stone-400">Memory (MB)</div>
          <InputNumber class="w-full p-inputtext-sm" v-model="memory" showButtons buttonLayout="horizontal"
                       incrementButtonIcon="pi pi-plus" decrementButtonIcon="pi pi-minus" :step="1024"
                       :min="0"></InputNumber>
        </div>


        <div class="mt-10 flex flex-col items-center">
          <div class="flex justify-center items-center">
            <div class="mr-5">
              <Button @click="onUpdate" icon="pi pi-save"
                      class="p-button-rounded p-button-primary p-button-lg largeButton" title="Save">
              </Button>
            </div>
            <Button @click="onDelete" icon="pi pi-trash"
                    class="p-button-rounded p-button-danger p-button-outlined"></Button>
          </div>

        </div>
      </div>
    </div>


    <div class="pb-10">
      <Button @click="onCancel"
              icon="pi pi-times"
              class="p-button-rounded p-button-primary p-button-outlined" title="Close"></Button>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { onMounted, ref } from "vue";
import InputText from "primevue/inputtext";
import InputNumber from "primevue/inputnumber";
import Button from "primevue/button";
import type { k4p } from "@wails/models";
import Dropdown from 'primevue/dropdown';
import { useProjectStore } from "@/stores/projectStore";
import { usePropertiesPanelStore } from "@/stores/propertiesPanelStore";
import { showError } from "@/utils/errors";
import { useDialog } from "primevue/usedialog";
import { GetStorage } from "@wails/provisioner/Service";

const projectStore = useProjectStore();
const dialog = useDialog();
const propertiesPanelStore = usePropertiesPanelStore();

const getNode = function (): k4p.KubernetesNode | undefined {
  return projectStore.project.cluster.nodes.find((e: k4p.KubernetesNode) => e.vmid == Number(propertiesPanelStore.propertiesId));
}


propertiesPanelStore.$subscribe(fillPropertiesPanel);

onMounted(async () => {
  try {
    fillPropertiesPanel();
    storageNames.value = await GetStorage();
  } catch (err) {
    showError(dialog, err);
  }
});

const nodeName = ref<string>();
const vmid = ref<number>();
const cores = ref<number>();
const memory = ref<number>();
const ipAddress = ref<string>();
const storagePool = ref<string>();

const storageNames = ref<string[]>([]);

const onUpdate = function (): void {
  const oldNode = getNode();
  if (!oldNode) {
    return
  }
  const copyCurrentNodeState = {...oldNode};
  const nodeToUpdate = createUpdatedNode(copyCurrentNodeState);
  projectStore.updateNode(nodeToUpdate, copyCurrentNodeState);
  propertiesPanelStore.selectPanel(propertiesPanelStore.propertiesPanelKey || "", nodeToUpdate.vmid.toString()) // Brake method contract or keep ugly default value or something else?
}

const onDelete = function (): void {
  projectStore.deleteNode(Number(propertiesPanelStore.propertiesId));
  propertiesPanelStore.deselect();
}

const onCancel = function (): void {
  propertiesPanelStore.deselect();
}

const createUpdatedNode = function (node: k4p.KubernetesNode): k4p.KubernetesNode {
  return {
    name: nodeName.value,
    vmid: vmid.value,
    cores: cores.value,
    memory: memory.value,
    ipAddress: ipAddress.value,
    storagePool: storagePool.value,
    nodeType: node.nodeType
  } as k4p.KubernetesNode;
}

function fillPropertiesPanel() {
  const node = getNode();
  if (!node) {
    return
  }
  nodeName.value = node.name;
  vmid.value = node.vmid;
  cores.value = node.cores;
  memory.value = node.memory;
  ipAddress.value = node.ipAddress;
  storagePool.value = node.storagePool;
}
</script>
<style>

</style>