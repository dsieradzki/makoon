<template>
  <DataTable :value="store.taskLog" responsiveLayout="scroll" class="p-datatable-sm">
    <Column header="Status">
      <template #body="slotProps">
        <i v-if="slotProps.data.state === TaskStatus.NOT_STARTED" class="pi pi-minus text-base ml-2"></i>
        <i v-if="slotProps.data.state === TaskStatus.STARTED" class="pi pi-spin pi-spinner text-base ml-2"></i>
        <i v-if="slotProps.data.state === TaskStatus.FINISHED" class="pi pi-check text-base text-green-500 ml-2"></i>
        <i v-if="slotProps.data.state === TaskStatus.ERROR" class="pi pi-times text-base text-red-500 ml-2"></i>
      </template>
    </Column>
    <Column header="Time">
      <template #body="slotProps">
        {{ new Date(slotProps.data.createTime).toLocaleString() }}
      </template>
    </Column>
    <Column header="Name">
      <template #body="slotProps">
        {{ toHumanReadableEventName(slotProps.data.name) }}
      </template>
    </Column>
    <Column header="Duration">
      <template #body="slotProps">
        {{ slotProps.data.duration }} sec
      </template>
    </Column>
    <Column header="Details">
      <template #body="slotProps">
        {{ slotProps.data.details.join("\n") }}
      </template>
    </Column>
    <template #empty>
      No events found.
    </template>
  </DataTable>
</template>
<script lang="ts" setup>

import {onUnmounted} from "vue";
import DataTable from "primevue/datatable"
import Column from "primevue/column"
import {TaskStatus} from "@/stores/projectStore";
import {useTaskLogStore} from "@/stores/eventStore";

const store = useTaskLogStore();

const toHumanReadableEventName = function (name: string): string {
  const withSpaces = name.replace(new RegExp("_", 'g'), " ");
  return withSpaces.charAt(0).toUpperCase() + withSpaces.substring(1);
}

const readTaskLogInterval = setInterval(() => {
      store.loadTaskLog()
    },
    2000);

onUnmounted(() => {
  clearInterval(readTaskLogInterval);
});


</script>