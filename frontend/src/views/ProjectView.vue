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
import {useRouter} from "vue-router";
import {OpenProjectDialog, SaveProjectDialog} from "@wails/service/ProjectService";
import {ref} from "vue";
import ProgressSpinner from 'primevue/progressspinner';
import {repackWailsPromise} from "@/utils/promise";

const router = useRouter();
const generatingProject = ref(false)
const openingProject = ref(false)

const newProject = function () {
  if (generatingProject.value || openingProject.value) {
    return
  }
  generatingProject.value = true;
  repackWailsPromise(SaveProjectDialog())
      .then(clusterIsAlreadyCreated => {
        generatingProject.value = false;
        if (clusterIsAlreadyCreated) {
          router.push({name: "summary"})
        } else {
          router.push({name: "planner"})
        }
      })
      .catch(err => {
        generatingProject.value = false;
        console.error(err)
      })
}

const openProject = function () {
  if (generatingProject.value || openingProject.value) {
    return
  }
  openingProject.value = true;
  repackWailsPromise(OpenProjectDialog())
      .then(clusterIsAlreadyCreated => {
        openingProject.value = false;
        if (clusterIsAlreadyCreated) {
          router.push({name: "summary"})
        } else {
          router.push({name: "planner"})
        }
      })
      .catch(e => {
        openingProject.value = false;
        console.error(e);
      })
}

</script>


