<template>
  <div class="flex flex-col w-full h-full items-center">
    <div class="grow">
      <div class="text-3xl text-center font-bold mt-5">Portainer</div>
      <div class="p-10">
        <div>
          Container management dashboard.
        </div>
        <div class="border-t-2 border-stone-500 text-xl mt-10 mb-3">
          Properties
        </div>
        <div class="mt-3">
          <div class="flex">
            <div class="text-stone-400 mb-1">Password:</div>
            <div v-if="isFeatureEnabled && valuesAreNotSaved" class="ml-2">
              <Button @click="onUpdate" :disabled="!isFormValid"
                      class="p-button-rounded p-button-sm p-button-success updateButton">
                Update
              </Button>
            </div>
          </div>
          <div>
            <InputText class="w-full p-inputtext-sm" v-model="password"></InputText>
          </div>
        </div>

        <div class="mt-3">
          <div class="flex">
            <div class="text-stone-400 mb-1">Storage class name:</div>
            <div v-if="isFeatureEnabled && valuesAreNotSaved" class="ml-2">
              <Button @click="onUpdate" :disabled="!isFormValid"
                      class="p-button-rounded p-button-sm p-button-success updateButton">
                Update
              </Button>
            </div>
          </div>
          <div>
            <InputText class="w-full p-inputtext-sm" v-model="password"></InputText>
          </div>
        </div>
        <div class="mt-10 flex flex-col items-center">
          <div class="flex justify-center">
            <div class="mr-2">
              <HelmAppSwitch :app="app">
              </HelmAppSwitch>
            </div>
          </div>

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
import HelmAppSwitch from "@/components/HelmAppSwitch.vue";
import {computed, onMounted, ref} from "vue";
import type {k4p} from "@wails/models";
import {useProjectStore} from "@/stores/projectStore";

const propertiesPanelStore = usePropertiesPanelStore();
const projectStore = useProjectStore();
const appName = "portainer"
const passwordParamName = "changeme.changme.password";
const storageClassParamName = "changeme.changme.storageClass";
const defaultStorageClassName = "storage_class_openebs";
const defaultApp = {
  chartName: "portainer",
  namespace: "portainer",
  releaseName: appName,
  repository: "INSERT REPO",
  parameters: {},
  additionalK8SResources: [],
  valueFileContent: ""
} as k4p.HelmApp;

const app = ref<k4p.HelmApp>(defaultApp);
const password = ref<string>("");
const storageClass = ref<string>("");

onMounted(() => {
  const appFromStore = projectStore.helmApps.find(e => e.releaseName === appName);
  if (appFromStore) {
    app.value = appFromStore;
  } else {
    app.value.parameters[storageClassParamName] = defaultStorageClassName;
  }
  password.value = app.value.parameters[passwordParamName];
  storageClass.value = app.value.parameters[storageClassParamName];
});

const isFeatureEnabled = computed((): boolean => {
  return !!projectStore.helmApps.find(e => e.releaseName === appName);
})

const isFormValid = computed((): boolean => {
  return password.value.trim().length > 0 && storageClass.value.trim().length > 0;
});

const valuesAreNotSaved = computed((): boolean => {
  const feature = projectStore.helmApps.find(e => e.releaseName === appName);
  if (!feature) {
    return false
  }
  return feature.parameters[passwordParamName] !== password.value || feature.parameters[storageClassParamName] !== storageClass.value;
});

const onUpdate = function (): void {
  const params = app.value.parameters;
  params[passwordParamName] = password.value;
  projectStore.updateHelmApp({
    ...app.value,
    parameters: params
  })
}

const onClose = function (): void {
  propertiesPanelStore.deselect();
}
</script>
<style>

</style>