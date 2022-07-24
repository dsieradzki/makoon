<template>
  <Button :disabled="disabled" v-if="!isAppEnabled" @click="onEnable">
    Enable
  </Button>
  <Button v-if="isAppEnabled" @click="onDisable">
    Disable
  </Button>
</template>
<script setup lang="ts">

import {computed} from "vue";
import {useProjectStore} from "@/stores/projectStore";
import Button from "primevue/button";
import type {k4p} from "@wails/models";

const projectStore = useProjectStore();

const props = defineProps<{
  app: k4p.HelmApp;
  disabled?: boolean
}>();

const onEnable = function (): void {
  projectStore.enableHelmApp(props.app);
}
const onDisable = function (): void {
  projectStore.disableHelmApp(props.app.chartName);
}
const isAppEnabled = computed((): boolean => {
  return !!projectStore.helmApps.find(e => e.chartName === props.app.chartName);
})
</script>