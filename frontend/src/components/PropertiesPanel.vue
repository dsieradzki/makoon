<template>
  <div class="flex flex-col pt-5" :class="$style.propertiesPanel">
    <component :is="getPanel(propertiesPanelStore.propertiesPanelKey || '')"></component>
  </div>
</template>
<script lang="ts" setup>
import type {Component} from 'vue'
import {defineAsyncComponent, shallowRef} from 'vue'
import {usePropertiesPanelStore} from "@/stores/propertiesPanelStore";

const propertiesPanelStore = usePropertiesPanelStore();

const panels = shallowRef<Map<string, Component>>(new Map<string, Component>());

const getPanel = function (panel: string): Component {
  if (!panels.value.has(panel)) {
    panels.value.set(panel, defineAsyncComponent(() =>
        import('./properties/' + panel + ".vue")
    ))
  }
  return panels.value.get(panel) || {};
}


</script>
<style module>
.propertiesPanel {
  background-color: var(--color-background);
}
</style>