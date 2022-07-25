<template>
  <Button :disabled="disabled" v-if="!isAppEnabled" @click="onEnable">
    Enable
  </Button>
  <Button v-if="isAppEnabled" @click="onDisable">
    Disable
  </Button>
</template>
<script setup lang="ts">

import {useProjectStore} from "@/stores/projectStore";
import Button from "primevue/button";

const projectStore = useProjectStore();

defineProps<{
  isAppEnabled: boolean
  disabled?: boolean
}>();

const emits = defineEmits<{
  (e: 'onEnableApp'): void
  (e: 'onDisableApp'): void
}>();


const onEnable = function () {
  emits('onEnableApp');
}
const onDisable = function () {
  emits('onDisableApp');
}
</script>