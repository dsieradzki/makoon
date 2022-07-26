<template>
  <div class="flex flex-col w-full h-full items-center">
    <div class="grow w-full">
      <div class="text-3xl text-center font-bold mt-5">Custom Resource</div>
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
            <div class="mr-1">Name:</div>
            <div class="">
              <InputText class="w-full p-inputtext-sm" v-model="name"></InputText>
            </div>
          </div>
          <div class="flex flex-col mb-2">
            <div class="mr-1">Content:</div>
            <div class="">
              <TextArea class="w-full p-inputtext-sm font-mono" v-model="content" rows="10"></TextArea>
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

const ckr = ref<k4p.CustomK8sResource>({} as k4p.CustomK8sResource);

propertiesPanelStore.$subscribe(fillProperties);

onMounted(() => {
  fillProperties();
});

function fillProperties() {
  const resFromStore = projectStore.customK8SResources.find(e => e.name === propertiesPanelStore.propertiesId);
  if (resFromStore) {
    ckr.value = resFromStore;
  } else {
    ckr.value = {} as k4p.CustomK8sResource;
  }
  name.value = ckr.value.name || "";
  content.value = ckr.value.content || ""
}

const name = ref<string>("");
const content = ref<string>("");

const isFormValid = computed((): boolean => {
  return name.value.trim().length > 0 && content.value.trim().length > 0;
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
  if (isNew.value) {
    projectStore.addCustomK8SResources(ckrToSave);
  } else {
    projectStore.updateCustomK8SResources(ckr.value, ckrToSave);
  }
  propertiesPanelStore.selectPanel("CustomK8sResourceProperties", name.value);
}

const onClose = function (): void {
  propertiesPanelStore.deselect();
}
const onDelete = function (): void {
  projectStore.deleteCustomK8SResources(ckr.value.name);
  propertiesPanelStore.deselect();
}
const isNew = computed((): boolean => {
  return !projectStore.customK8SResources.find(e => e.name === ckr.value.name);
});
</script>
<style>

</style>