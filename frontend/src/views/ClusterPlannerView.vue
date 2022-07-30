<template>
  <Splitter class="h-full" layout="vertical">
    <SplitterPanel :size="85" class="overflow-y-auto">
      <div v-if="deployInProgress" class="flex h-full justify-center">
        <div class="p-5 flex flex-col items-center justify-center h-full">
          <div class="w-full max-w-[400px]">
            <div class="text-9xl">K<span class="text-blue-500">4</span>Prox</div>
          </div>
          <div></div>
          <div class="mt-10 mb-5">
            <ProgressSpinner/>
          </div>
          <div class="flex flex-col items-start">
            <div class="text-stone-400 text-2xl">
              {{ taskLogStore.lastThreeLogs[0]?.name }}
            </div>
            <div class="text-stone-600 text-xl">
              {{ taskLogStore.lastThreeLogs[1]?.name }}
            </div>
            <div class="text-stone-700">
              {{ taskLogStore.lastThreeLogs[2]?.name }}
            </div>
          </div>

        </div>

      </div>

      <div v-if="!deployInProgress" class="flex h-full">
        <ClusterSettings @deployCluster="deployCluster"
                         class="overflow-y-auto  overflow-x-visible border-r-4 border-stone-800 min-w-[500px]"></ClusterSettings>
        <div class="grow">
          <div class="flex h-full">
            <ClusterContent class="grow overflow-y-auto overflow-x-visible"></ClusterContent>
            <div v-if="propertiesPanelStore.anySelected" class="relative">
              <div class="absolute left-[-500px] h-full">
                <PropertiesPanel
                    class="overflow-y-auto h-full border-l-4 border-stone-800 min-w-[495px]"></PropertiesPanel>
              </div>
            </div>
          </div>
        </div>
      </div>

    </SplitterPanel>
    <SplitterPanel :size="15" class="overflow-y-auto">
      <div class="text-2xl ml-5 mt-2">Tasks</div>
      <TaskLogTable></TaskLogTable>
    </SplitterPanel>
  </Splitter>
</template>
<script lang="ts" setup>
import Splitter from 'primevue/splitter';
import SplitterPanel from 'primevue/splitterpanel';
import TaskLogTable from "@/components/TaskLogTable.vue";
import ClusterSettings from "@/components/ClusterSettings.vue";
import ClusterContent from "@/components/ClusterContent.vue";
import PropertiesPanel from "@/components/PropertiesPanel.vue";
import type { k4p } from "@wails/models";
import { onMounted, ref } from "vue";
import { useProjectStore } from "@/stores/projectStore";
import { CreateCluster, SetupEnvironmentOnProxmox } from "@wails/service/ProvisionerService";
import { useRouter } from "vue-router";
import ProgressSpinner from 'primevue/progressspinner';
import { useTaskLogStore } from "@/stores/eventStore";
import { ClearTaskLog } from "@wails/service/TaskLogService";
import { usePropertiesPanelStore } from "@/stores/propertiesPanelStore";
import { LogDebug } from "@wails-runtime/runtime";
import { showError } from "@/utils/errors";
import { useDialog } from "primevue/usedialog";

const projectStore = useProjectStore();
const taskLogStore = useTaskLogStore();
const router = useRouter();
const dialog = useDialog();
const deployInProgress = ref(false);

onMounted(async () => {
  try {
    await projectStore.loadProject()
    LogDebug("Project loaded");
  } catch (err) {
    showError(dialog, err);
  }
});

projectStore.$subscribe(async () => {
  try {
    await projectStore.saveProject()
    LogDebug("Project saved");
  } catch (err) {
    showError(dialog, err)
  }
})

const propertiesPanelStore = usePropertiesPanelStore();

const deployCluster = async function (pr: k4p.ProvisionRequest) {
  deployInProgress.value = true;
  try {
    await ClearTaskLog();
    await SetupEnvironmentOnProxmox();
    await CreateCluster(pr);
    LogDebug("Cluster created successfully");
    await router.push({name: "summary"})
  } catch (err) {
    showError(dialog, err);
  } finally {
    deployInProgress.value = false;
  }
}
</script>
<style>

</style>
