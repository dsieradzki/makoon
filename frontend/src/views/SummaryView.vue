<template>
  <main class="p-5 flex flex-col items-center justify-center h-full">
    <div class="w-full max-w-[400px]">
      <div class="text-9xl">K<span class="text-blue-500">4</span>Prox</div>
      <div>Kubernetes Manager for Proxmox</div>
    </div>
    <div></div>

    <div class="mt-14 w-full max-w-[800px] flex justify-center">
      <Block @click="onSaveKubeConfig" class="mr-20 flex justify-center items-center w-[200px] h-[200px]">
        <div class="flex flex-col items-center justify-center">
          <i class="pi pi-cloud text-stone-400" style="font-size: 5rem"></i>
          <span class="mt-5 text-center">Save Kubernetes config</span>
        </div>
      </Block>
      <Block @click="onSaveSshPrivateKey" class="mr-10 flex justify-center items-center w-[200px] h-[200px]">
        <div class="flex flex-col items-center justify-center">
          <i class="pi pi-key text-stone-400" style="font-size: 5rem"></i>
          <span class="mt-5 text-center">Save ssh private key</span>
        </div>
      </Block>
      <Block @click="onSaveSshAuthorizationKey" class="flex justify-center items-center w-[200px] h-[200px]">
        <div class="flex flex-col items-center justify-center">
          <i class="pi pi-key text-stone-400" style="font-size: 5rem"></i>
          <span class="mt-5 text-center">Save ssh authorization key</span>
        </div>
      </Block>
    </div>
    <div class="mt-10 flex items-center text-blue-500">
      <router-link :to="{name: 'planner'}">
        <i class="pi pi-arrow-left" style="font-size: 1rem"></i>
        Back to cluster planner
      </router-link>
    </div>
  </main>
</template>

<script setup lang="ts">
import Block from "@/components/Block.vue";
import {
  SaveKubeConfigDialog,
  SaveSshAuthorizationKeyDialog,
  SaveSshPrivateKeyDialog
} from "@wails/project/Service";
import {repackWailsPromise} from "@/utils/promise";

const onSaveKubeConfig = function () {
  repackWailsPromise(SaveKubeConfigDialog())
      .then(() => {
        console.log("Saved");
      })
      .catch(console.error)
}
const onSaveSshPrivateKey = function () {
  repackWailsPromise(SaveSshPrivateKeyDialog())
      .then(() => {
        console.log("Saved");
      })
      .catch(console.error)
}
const onSaveSshAuthorizationKey = function () {
  repackWailsPromise(SaveSshAuthorizationKeyDialog())
      .then(() => {
        console.log("Saved");
      })
      .catch(console.error)
}

</script>