<template>
  <main class="p-5 flex flex-col items-center justify-center h-full">
    <div class="w-full max-w-[400px]">
      <div class="text-9xl">K<span class="text-blue-500">4</span>Prox</div>
      <div>Kubernetes Manager for Proxmox</div>
    </div>
    <div></div>
    <div class="mt-14 w-full max-w-[400px] flex justify-center">
      <Block :not-active="generatingProject || openingProject" @click="newProject"
             class="mr-10 flex justify-center items-center w-[200px] h-[200px]">
        <div v-if="!generatingProject" class="flex flex-col items-center justify-center">
          <i class="pi pi-file text-stone-400" style="font-size: 5rem"></i>
          <span class="mt-5 text-center">Generate Project</span>
        </div>
        <div v-if="generatingProject" class="flex flex-col items-center justify-center">
          <ProgressSpinner/>
          <span class="mt-5 text-center">Generating project...</span>
        </div>
      </Block>
      <Block :not-active="generatingProject || openingProject" @click="openProject"
             class="flex justify-center items-center w-[200px] h-[200px]">
        <div v-if="!openingProject" class="flex flex-col items-center justify-center">
          <i class="pi pi-folder-open text-stone-400" style="font-size: 5rem"></i>
          <span class="mt-5 text-center">Open Project</span>
        </div>

        <div v-if="openingProject" class="flex flex-col items-center justify-center">
          <ProgressSpinner/>
          <span class="mt-5 text-center">Open Project</span>
        </div>
      </Block>
    </div>

  </main>
</template>
<script setup lang="ts">
import Block from "@/components/Block.vue";
import { useRouter } from "vue-router";
import { OpenProjectDialog, SaveProjectDialog } from "@wails/project/Service";
import { ref } from "vue";
import ProgressSpinner from 'primevue/progressspinner';
import { showError } from "@/utils/errors";
import { useDialog } from "primevue/usedialog";

const router = useRouter();
const generatingProject = ref(false)
const openingProject = ref(false)
const dialog = useDialog();

const newProject = async function () {
  if (generatingProject.value || openingProject.value) {
    return
  }
  try {
    generatingProject.value = true;
    const isProjectGenerated = await SaveProjectDialog();
    if (isProjectGenerated) {
      await router.push({name: "planner"})
    }
    generatingProject.value = false;
  } catch (err) {
    generatingProject.value = false;
    showError(dialog, err)
  }
}

const openProject = async function () {
  if (generatingProject.value || openingProject.value) {
    return
  }
  try {
    openingProject.value = true;
    const clusterIsAlreadyCreated = await OpenProjectDialog();
    if (clusterIsAlreadyCreated) {
      await router.push({name: "summary"})
    } else {
      await router.push({name: "planner"})
    }
  } catch (err) {
    openingProject.value = false;
    showError(dialog, err)
  }
}

</script>


