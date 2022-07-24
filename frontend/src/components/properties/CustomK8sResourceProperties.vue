<template>
  <div class="flex flex-col w-full h-full items-center">
    <div class="grow">
      <div class="text-3xl text-center font-bold mt-5">Custom Resource</div>
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
                <div class="mr-1">Name:</div>
              </td>
              <td>
                <InputText class="w-full p-inputtext-sm" v-model="name"></InputText>
              </td>
            </tr>
            <tr>
              <td>
                <div class="mr-1">Content:</div>
              </td>
              <td>
                <TextArea class="w-full p-inputtext-sm" v-model="content"></TextArea>
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

const ckr = ref<k4p.CustomK8sResource>({} as k4p.CustomK8sResource);

onMounted(() => {
  const resFromStore = projectStore.customK8SResources.find(e => e.name === propertiesPanelStore.propertiesId);
  if (resFromStore) {
    ckr.value = resFromStore;
  }
});

const name = ref<string>("");
const content = ref<string>("");

const isFormValid = computed((): boolean => {
  return name.value.trim().length > 0;
});

const valuesAreNotSaved = computed((): boolean => {
  const resource = projectStore.customK8SResources.find(e => e.name === ckr.value.name);
  if (!resource) {
    return false
  }
  return resource.name !== name.value || resource.content !== content.value;
});

const onUpdate = function (): void {
  const ckrToSave: k4p.CustomK8sResource = {
    name: name.value,
    content: content.value
  };
  if (isNew()) {
    projectStore.addCustomK8SResources(ckrToSave);
  } else {
    projectStore.updateCustomK8SResources(ckr.value, ckrToSave);
  }
}

const onClose = function (): void {
  propertiesPanelStore.deselect();
}
const onDelete = function (): void {
  projectStore.deleteCustomK8SResources(ckr.value.name);
  propertiesPanelStore.deselect();
}
const isNew = function (): boolean {
  return !!projectStore.customK8SResources.find(e => e.name === ckr.value.name);
}
</script>
<style>

</style>