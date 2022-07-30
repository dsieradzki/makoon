<template>
  <div class="min-w-[200px] w-full">
    <div class="text-red-600 mb-5">
      <div class="mb-2">Message:</div>
      <div class="font-mono border-2 border-red-600 p-2">{{ data }}</div>
    </div>
    <div class="mb-5">
      To open issue, you can use this link <span @click="onCreateIssue" class="text-blue-500 cursor-pointer">
     https://github.com/dsieradzki/k4prox/issues/new</span>, remember to attach error message and logfile at location <span class="text-amber-500">{{logFile}}</span>.
    </div>
    <div>
      <Button @click="close">Close</Button>
    </div>
  </div>
</template>
<script lang="ts" setup>
import type { Ref } from "vue";
import { computed, inject, onMounted, ref } from "vue";
import type { DynamicDialogInstance } from "primevue/dynamicdialogoptions";
import Button from "primevue/button";
import { BrowserOpenURL } from "@wails-runtime/runtime";
import { LogFileLocation } from "@wails/app/App";

const dialogRef = inject('dialogRef') as Ref<DynamicDialogInstance>

const logFile = ref<string>("");

onMounted(async () => {
  logFile.value = await LogFileLocation();
});
const data = computed(() => {
  return dialogRef.value.data.error;
});

const close = function () {
  dialogRef.value.close()
}

const onCreateIssue = function () {
  BrowserOpenURL("https://github.com/dsieradzki/k4prox/issues/new")
}

</script>