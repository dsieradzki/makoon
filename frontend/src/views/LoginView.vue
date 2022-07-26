<template>
  <main class="p-5 flex flex-col items-center justify-center h-full">
    <div class="w-full max-w-[400px]">
      <div class="text-9xl">K<span class="text-blue-500">4</span>Prox</div>
      <div class="flex justify-between">
        <div>Kubernetes Manager for Proxmox</div>
        <div class="font-bold">v{{ version }}</div>
      </div>
    </div>
    <div></div>
    <div class="mt-14 w-full max-w-[400px]">
      <div class="text-lg font-bold">Proxmox host:</div>
      <div class="flex items-center">
        <InputText @keydown.enter="login" class="w-[330px]" v-model="host" placeholder="192.168.1.10"></InputText>
        <div class="ml-1">:8006, :22</div>
      </div>
    </div>

    <div class="mt-3 w-full max-w-[400px]">
      <div class="text-lg font-bold">Proxmox username:</div>
      <div class="flex items-center">
        <InputText @keydown.enter="login" class="w-[330px]" v-model="username" placeholder="root"></InputText>
        <div class="ml-1">@pam</div>
      </div>
    </div>

    <div class="mt-3 w-full max-w-[400px]">
      <div class="text-lg font-bold">Proxmox password:</div>
      <Password @keydown.enter="login" class="w-full" inputClass="w-full" v-model="password" :feedback="false" toggle-mask></Password>
    </div>

    <div v-if="loginError" class="mt-6 text-red-600 font-bold">
      Cannot login to Proxmox
    </div>
    <div class="mt-10">
      <Button @click="login" :disabled="!isFormValid()">
        <i v-if="loginState" class="pi pi-spin pi-spinner text-base mr-2"></i>
        Login to Proxmox
      </Button>
    </div>
    <div class="mt-10 text-stone-600">
      Copyright (c) 2022 Damian Sieradzki
    </div>
  </main>
</template>
<script setup lang="ts">
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Button from 'primevue/button';
import {ref} from "vue";

import {Login} from "@wails/service/LoginService";
import {useRouter} from "vue-router";
import {repackWailsPromise} from "@/utils/promise";

// eslint-disable-next-line no-undef
const version = APP_VERSION;

const router = useRouter();

const host = ref<string>("");
const username = ref<string>("");
const password = ref<string>("");

const isFormValid = function (): boolean {
  return !!(host.value && username.value && password.value);
}
const loginState = ref<boolean>(false);
const loginError = ref<boolean>(false)
const login = function () {
  loginState.value = true;
  repackWailsPromise(Login(username.value, password.value, host.value))
      .then(() => {
        loginError.value = false;
        router
            .push({
              name: "project"
            })
            .then(() => {
              loginState.value = false;
            });
      })
      .catch((err) => {
        console.error(err);
        loginState.value = false;
        loginError.value = true;
      });

}

</script>


