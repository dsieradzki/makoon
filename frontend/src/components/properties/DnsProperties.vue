<template>
  <div class="flex flex-col w-full h-full items-center">
    <div class="grow">
      <div class="text-3xl text-center font-bold mt-5">CoreDNS</div>
      <div class="p-10">
        <div>
          Deploys CoreDNS. This add-on may be required by others
        </div>
        <div class="mt-10 flex flex-col items-center">
          <div class="flex justify-center">
            <div class="mr-2">
              <FeatureSwitch feature-name="dns">
              </FeatureSwitch>
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
import FeatureSwitch from "@/components/FeatureSwitch.vue";

const propertiesPanelStore = usePropertiesPanelStore();


const onClose = function (): void {
  propertiesPanelStore.deselect();
}


</script>
<style>

</style>