<template>
  <div class="flex flex-col w-full h-full items-center">
    <div class="grow">
      <div class="text-3xl text-center font-bold mt-5">Custom Helm app</div>
      <div class="p-10">
        <div class="mt-3">
          <div class="flex">
            <div class="text-stone-400 mb-1">Properties</div>
            <div v-if="valuesAreNotSaved" class="ml-2">
              <Button @click="onUpdate" :disabled="!isFormValid"
                      class="p-button-rounded p-button-sm p-button-success updateButton">
                Update
              </Button>
            </div>
          </div>
          <table>
            <tr>
              <td>
                <div class="mr-1">Release name:</div>
              </td>
              <td>
                <InputText class="w-full p-inputtext-sm" v-model="releaseName"></InputText>
              </td>
            </tr>
            <tr>
              <td>
                <div class="mr-1">Chart name:</div>
              </td>
              <td>
                <InputText class="w-full p-inputtext-sm" v-model="chartName"></InputText>
              </td>
            </tr>
            <tr>
              <td>
                <div class="mr-1">Repository:</div>
              </td>
              <td>
                <InputText class="w-full p-inputtext-sm" v-model="repository"></InputText>
              </td>
            </tr>
            <tr>
              <td>
                <div class="mr-1">Namespace:</div>
              </td>
              <td>
                <InputText class="w-full p-inputtext-sm" v-model="namespace"></InputText>
              </td>
            </tr>
            <tr>
              <td>
                <div class="mr-1">Values:</div>
              </td>
              <td>
                <TextArea class="w-full p-inputtext-sm" v-model="valuesFileContent"></TextArea>
              </td>
            </tr>
          </table>
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

onMounted(() => {
  const appFromStore = projectStore.customHelmApps.find(e => e.releaseName === propertiesPanelStore.propertiesId);
  if (appFromStore) {
    cha.value = appFromStore;
  }
});

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

  if (isNew()) {
    projectStore.addCustomHelmApp(appToSave);
  } else {
    projectStore.updateCustomHelmApp(cha.value, appToSave);
  }
}

const onClose = function (): void {
  propertiesPanelStore.deselect();
}
const onDelete = function (): void {
  projectStore.deleteCustomHelmApp(cha.value.releaseName);
  propertiesPanelStore.deselect();
}
const isNew = function (): boolean {
  return !!projectStore.customHelmApps.find(e => e.releaseName === cha.value.releaseName);
}
</script>
<style>

</style>