<template>
  <div class="flex flex-col w-full h-full items-center">
    <div class="grow w-full">
      <div class="text-3xl text-center font-bold mt-5">Metrics Server</div>
      <div class="p-5">
        <div>
          Metrics Server is a scalable, efficient source of container resource metrics for Kubernetes built-in autoscaling pipelines.
        </div>
        <div class="mt-10 flex flex-col items-center">
          <div class="flex justify-center">
            <div class="mr-2">
              <MicroK8sAddonSwitch feature-name="metrics-server">
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