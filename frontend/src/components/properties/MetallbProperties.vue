<template>
  <div class="flex flex-col w-full h-full items-center">
    <div class="grow">
      <div class="text-3xl text-center font-bold mt-5">MetalLB Loadbalancer</div>
      <div class="p-10">
        <div>
          MetalLB Loadbalancer is a network LB implementation that tries to “just work” on bare metal clusters.
        </div>
        <div class="border-t-2 border-stone-500 text-xl mt-10 mb-3">
          Properties
        </div>
        <div class="mt-3">
          <div class="flex">
            <div class="text-stone-400 mb-1">IP address range</div>
            <div v-if="isFeatureEnabled && valuesAreNotSaved" class="ml-2">
              <Button @click="onUpdate" :disabled="!isFormValid"
                      class="p-button-rounded p-button-sm p-button-success" :class="$style.updateButton">
                Update
              </Button>
            </div>
          </div>
          <table>
            <tr>
              <td>
                <div class="mr-1">From:</div>
              </td>
              <td>
                <InputText class="w-full p-inputtext-sm" v-model="ipFrom"></InputText>
              </td>
            </tr>
            <tr>
              <td>
                <div class="mr-1">To:</div>
              </td>
              <td>
                <InputText class="w-full p-inputtext-sm" v-model="ipTo"></InputText>
              </td>
            </tr>
          </table>
        </div>
        <div class="mt-5 flex flex-col items-center justify-center">
          <FeatureSwitch :feature-name="featureName" :disabled="!isFormValid">
          </FeatureSwitch>
        </div>
      </div>
    </div>


    <div class="pb-10">
      <Button @click="onClose"
              icon="pi pi-times"
              class="p-button-rounded p-button-primary p-button-outlined" title="Close"></Button>
    </div>
  </div>
</template>
<script lang="ts" setup>
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import {usePropertiesPanelStore} from "@/stores/propertiesPanelStore";
import FeatureSwitch from "@/components/FeatureSwitch.vue";
import {computed, onMounted, ref} from "vue";
import {useProjectStore} from "@/stores/projectStore";

const propertiesPanelStore = usePropertiesPanelStore();
const projectStore = useProjectStore();
const featureName = "metallb";

onMounted(() => {
  const feature = projectStore.features.find(e => e.name === featureName);
  if (!feature || feature.args.length == 0) {
    return
  }
  const idxOfSep = feature.args.indexOf("-");
  if (idxOfSep == -1) {
    return;
  }
  ipFrom.value = feature.args.substring(1, idxOfSep);
  ipTo.value = feature.args.substring(idxOfSep + 1);
});

const ipFrom = ref<string>("");
const ipTo = ref<string>("");

const isFeatureEnabled = computed((): boolean => {
  return !!projectStore.features.find(e => e.name === featureName);
})

const isFormValid = computed((): boolean => {
  return ipFrom.value.trim().length > 0 && ipTo.value.trim().length > 0;
});

const valuesAreNotSaved = computed((): boolean => {
  const feature = projectStore.features.find(e => e.name === featureName);
  if (!feature) {
    return false
  }
  return feature.args !== generateArgs();
});

const generateArgs = function () {
  return ":" + ipFrom.value + "-" + ipTo.value;
}

const onUpdate = function (): void {
  projectStore.updateFeatureArgs(featureName, generateArgs());
}
const onClose = function (): void {
  propertiesPanelStore.deselect();
}

</script>
<style module>
.updateButton {
  padding: 0 !important;
  display: flex;
  justify-content: center;
}
</style>