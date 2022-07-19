<template>
  <div class="flex flex-col pt-5" :class="$style.propertiesPanel">
    <div class="text-3xl text-center font-bold mt-5">Cluster settings</div>
    <div class="p-10">
      <div class="border-t-2 border-stone-500 text-xl mb-3">
        User
      </div>
      <div class="mt-3">
        <div class="text-stone-400">Node Username</div>
        <InputText class="w-full p-inputtext-sm" v-model="store.project.cluster.nodeUsername"></InputText>
      </div>
      <div class="mt-3 text-stone-400">
        <div>Node Password</div>
        <InputText class="w-full p-inputtext-sm" v-model="store.project.cluster.nodePassword"></InputText>
      </div>

      <div class="border-t-2 border-stone-500 text-xl mt-10 mb-3">
        Storage
      </div>
      <div class="mt-3">
        <div class="text-stone-400">Disk size (GB)</div>
        <InputNumber class="w-full p-inputtext-sm" v-model="store.project.cluster.nodeDiskSize" showButtons
                     buttonLayout="horizontal" incrementButtonIcon="pi pi-plus" decrementButtonIcon="pi pi-minus"
                     :min="1"></InputNumber>
      </div>

      <div class="border-t-2 border-stone-500 text-xl mt-10 mb-3">
        Network
      </div>
      <div class="mt-3">
        <div class="text-stone-400">Proxmox network bridge</div>
        <Dropdown class="w-full" v-model="store.project.cluster.network.bridge" :options="networks"/>
      </div>

      <div class="mt-3">
        <div class="text-stone-400">Gateway</div>
        <InputText class="w-full p-inputtext-sm" v-model="store.project.cluster.network.gateway"></InputText>
      </div>

      <div class="mt-3">
        <div class="text-stone-400">Subnet mask (CIDR Notation)</div>
        <InputNumber class="w-full p-inputtext-sm" v-model="store.project.cluster.network.subnetMask" showButtons
                     buttonLayout="horizontal" incrementButtonIcon="pi pi-plus" decrementButtonIcon="pi pi-minus"
                     :min="1"></InputNumber>
      </div>

      <div class="mt-3">
        <div class="text-stone-400">DNS server</div>
        <InputText class="w-full p-inputtext-sm" v-model="store.project.cluster.network.dnsServer"></InputText>
      </div>

      <div class="border-t-2 border-stone-500 text-xl mt-10"></div>
      <div class="mt-5 flex flex-col justify-center">
        <div>
          <InputSwitch v-model="showAdvanced"/>
          <span class="ml-2">Advanced</span>
        </div>
        <div v-if="showAdvanced" class="flex flex-col">
          <div class="mt-1">
            <Checkbox :binary="true" v-model="createVm"/>
            Create Virtual Machines
          </div>
          <div class="mt-1">
            <Checkbox :binary="true" v-model="installKubernetes"/>
            Install Kubernetes
          </div>
          <div class="mt-1">
            <Checkbox :binary="true" v-model="joinNodes"/>
            Join nodes to Cluster
          </div>
          <div class="mt-1">
            <Checkbox :binary="true" v-model="installFeatures"/>
            Install Features
          </div>
        </div>
      </div>
      <div class="mt-10 flex justify-center">
        <Button @click="deployCluster" :disabled="!store.clusterIsValid">
          Create Cluster
        </Button>
      </div>
    </div>

  </div>
</template>
<script lang="ts" setup>
import InputText from "primevue/inputtext";
import InputNumber from 'primevue/inputnumber';
import Button from "primevue/button";
import InputSwitch from 'primevue/inputswitch';
import Checkbox from 'primevue/checkbox';
import {useProjectStore} from "@/stores/projectStore";
import {onMounted, ref} from "vue";
import type {k4p} from "@wails/models";
import Dropdown from 'primevue/dropdown';
import {GetNetworkBridges} from "@wails/service/ProvisionerService";
import {repackWailsPromise} from "@/utils/promise";

const emits = defineEmits<{
  (e: "deployCluster", pr: k4p.ProvisionRequest): void
}>();

const store = useProjectStore();
const showAdvanced = ref(false);
const createVm = ref(true);
const installKubernetes = ref(true);
const joinNodes = ref(true);
const installFeatures = ref(true);


const networks = ref<string[]>([]);

onMounted(() => {
  repackWailsPromise(GetNetworkBridges())
      .then((resp) => {
        networks.value = resp;
      })
      .catch(console.error)
})

const deployCluster = function () {
  emits('deployCluster', {
    stages: {
      createVirtualMachines: createVm.value,
      installKubernetes: installKubernetes.value,
      joinNodesToCluster: joinNodes.value,
      installFeatures: installFeatures.value
    }
  } as k4p.ProvisionRequest);
}

</script>

<style module>
.propertiesPanel {
  background-color: var(--color-background);
}
</style>