<template>
  <Button :disabled="disabled" v-if="!isFeatureEnabled" @click="onEnable">
    Enable
  </Button>
  <Button v-if="isFeatureEnabled" @click="onDisable">
    Disable
  </Button>
</template>
<script setup lang="ts">

import {computed} from "vue";
import {useProjectStore} from "@/stores/projectStore";
import Button from "primevue/button";

const projectStore = useProjectStore();

const props = defineProps<{
  featureName: string;
  args?: string;
  disabled?: boolean
}>();

const onEnable = function (): void {
  projectStore.enableFeature(props.featureName);
}
const onDisable = function (): void {
  projectStore.disableFeature(props.featureName);
}
const isFeatureEnabled = computed((): boolean => {
  return !!projectStore.features.find(e => e.name === props.featureName);
})
</script>