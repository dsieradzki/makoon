<template>
  <div class="flex flex-col w-full h-full items-center">
    <div class="grow">
      <div class="text-3xl text-center font-bold mt-5">Argo CD</div>
      <div class="p-10">
        <div>
          Deploys Argo CD, the declarative, GitOps continuous delivery tool for Kubernetes.
        </div>
        <div class="mt-10 flex flex-col items-center">
          <div class="flex justify-center">
            <div class="mr-2">
              <MicroK8sAddonSwitch feature-name="dns">
              </MicroK8sAddonSwitch>
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
import {usePropertiesPanelStore} from "@/stores/propertiesPanelStore";
import MicroK8sAddonSwitch from "@/components/MicroK8sAddonSwitch.vue";

const propertiesPanelStore = usePropertiesPanelStore();


const onClose = function (): void {
  propertiesPanelStore.deselect();
}


</script>
<style>

</style>