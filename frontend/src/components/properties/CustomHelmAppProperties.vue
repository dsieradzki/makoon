<template>
  <div class="flex flex-col w-full h-full items-center">
    <div class="grow w-full">
      <div class="text-3xl text-center font-bold mt-5">Custom Helm app</div>
      <div class="p-10">
        <div class="mt-3">
          <div class="border-t-2 border-stone-500 text-xl mt-10 mb-3 flex pt-2 mb-5">
            <div>
              Properties
            </div>
            <div v-if="valuesAreNotSaved" class="ml-2">
              <Button @click="onUpdate" :disabled="!isFormValid"
                      class="p-button-rounded p-button-sm p-button-success updateButton">
                Update
              </Button>
            </div>
          </div>
          <div class="flex flex-col mb-2">
            <div class="mr-1">Release name:</div>
            <div class="">
              <InputText class="w-full p-inputtext-sm" v-model="releaseName"></InputText>
            </div>
          </div>
          <div class="flex flex-col mb-2">
            <div class="mr-1">Chart name:</div>
            <div class="">
              <InputText class="w-full p-inputtext-sm" v-model="chartName"></InputText>
            </div>
          </div>
          <div class="flex flex-col mb-2">
            <div class="mr-1">Repository:</div>
            <div class="">
              <InputText class="w-full p-inputtext-sm" v-model="repository"></InputText>
            </div>
          </div>
          <div class="flex flex-col mb-2">
            <div class="mr-1">Namespace:</div>
            <div class="">
              <InputText class="w-full p-inputtext-sm" v-model="namespace"></InputText>
            </div>
          </div>
          <div class="flex flex-col mb-2">
            <div class="mr-1">Values:</div>
            <div class="">
              <TextArea class="w-full p-inputtext-sm" v-model="valuesFileContent"></TextArea>
            </div>
          </div>
        </div>
        <div class="mt-10 flex flex-col items-center">
          <div class="flex justify-center items-center">
            <Button v-if="isNew" :disabled="!isFormValid" @click="onUpdate" icon="pi pi-save"
                    class="p-button-rounded p-button-primary p-button-lg largeButton" title="Save">
            </Button>

            <div v-if="!isNew">
              <Button @click="onDelete" icon="pi pi-trash"
                      class="p-button-rounded p-button-danger p-button-outlined"></Button>
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
import TextArea from "primevue/textarea";
import {usePropertiesPanelStore} from "@/stores/propertiesPanelStore";
import {computed, onMounted, ref} from "vue";
import type {k4p} from "@wails/models";
import {useProjectStore} from "@/stores/projectStore";

const propertiesPanelStore = usePropertiesPanelStore();
const projectStore = useProjectStore();

const cha = ref<k4p.HelmApp>({} as k4p.HelmApp);

propertiesPanelStore.$subscribe(fillProperties);

onMounted(() => {
  fillProperties();
});

function fillProperties() {
  const appFromStore = projectStore.customHelmApps.find(e => e.releaseName === propertiesPanelStore.propertiesId);
  if (appFromStore) {
    cha.value = appFromStore;
  } else {
    cha.value = {} as k4p.HelmApp;
  }
  releaseName.value = cha.value.releaseName || "";
  chartName.value = cha.value.chartName || "";
  repository.value = cha.value.repository || "";
  namespace.value = cha.value.namespace || "";
  valuesFileContent.value = cha.value.valueFileContent || "";
}

const releaseName = ref<string>("");
const chartName = ref<string>("");
const repository = ref<string>("");
const namespace = ref<string>("");
const valuesFileContent = ref<string>("");

const isFormValid = computed((): boolean => {
  return releaseName.value.trim().length > 0 &&
      chartName.value.trim().length > 0 &&
      repository.value.trim().length > 0 &&
      namespace.value.trim().length > 0;
});

const valuesAreNotSaved = computed((): boolean => {
  const app = projectStore.customHelmApps.find(e => e.releaseName === cha.value.releaseName);
  if (!app) {
    return false
  }
  return app.releaseName !== releaseName.value ||
      app.chartName !== chartName.value ||
      app.repository !== repository.value ||
      app.namespace !== namespace.value ||
      app.valueFileContent !== valuesFileContent.value;
});

const onUpdate = function (): void {
  const appToSave = {
    releaseName: releaseName.value,
    chartName: chartName.value,
    repository: repository.value,
    namespace: namespace.value,
    valueFileContent: valuesFileContent.value
  } as k4p.HelmApp;
  if (isNew.value) {
    projectStore.addCustomHelmApp(appToSave);
  } else {
    projectStore.updateCustomHelmApp(cha.value, appToSave);
  }
  propertiesPanelStore.selectPanel("CustomHelmAppProperties", releaseName.value);
}

const onClose = function (): void {
  propertiesPanelStore.deselect();
}
const onDelete = function (): void {
  projectStore.deleteCustomHelmApp(cha.value.releaseName);
  propertiesPanelStore.deselect();
}
const isNew = computed((): boolean => {
  return !projectStore.customHelmApps.find(e => e.releaseName === cha.value.releaseName);
})

</script>
<style>

</style>