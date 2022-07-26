<template>
  <div
      @mouseover="hover=true"
      @mouseout="hover=false"
      @click="$emit('select')"
      class="mt-5 p-5 bg-stone-800 rounded-xl border-2"
      :class="blockBorder">
    <div v-if="title" class="text-xl text-center font-bold">
      <span :class="{'text-stone-500': notActive}">{{ title }}</span>
    </div>
    <div v-if="$slots.default">
      <slot></slot>
    </div>
  </div>
</template>
<script lang="ts" setup>
import {computed, ref} from "vue";

const props = defineProps<{
  title?: string
  selected?: boolean
  notActive?: boolean
}>();

defineEmits<{
  select(): void
}>();


const hover = ref<boolean>(false);

const blockBorder = computed(() => {
  return ({
    'selectedBlock': props.selected,
    'hoveredBlock': hover.value && !props.selected,
    'defaultBlock': !hover.value && !props.selected,
  })
})
</script>

<style>
.selectedBlock {
  border-color: rgb(59 130 246);
}

.hoveredBlock {
  border-color: #78716C;
}

.defaultBlock {
  border-color: #292524;
}
</style>