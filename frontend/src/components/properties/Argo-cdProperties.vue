<template>
  <div class="flex flex-col w-full h-full items-center">
    <div class="grow">
      <div class="text-3xl text-center font-bold mt-5">Argo CD</div>
      <div class="p-10">
        <div>
          Deploys Argo CD, the declarative, GitOps continuous delivery tool for Kubernetes.
        </div>
        <div class="border-t-2 border-stone-500 text-xl mt-10 mb-3 flex pt-2 mb-5">
          <div>Properties</div>
          <div v-if="isFeatureEnabled && valuesAreNotSaved" class="ml-2">
            <Button @click="onUpdateApp" :disabled="!isFormValid"
                    class="p-button-rounded p-button-sm p-button-success updateButton">
              Update
            </Button>
          </div>
        </div>

        <div class="mt-3">
          <div class="flex">
            <div class="text-stone-400 mb-1">Load balancer IP:</div>
          </div>
          <div>
            <InputText class="w-full p-inputtext-sm" v-model="lbIP"></InputText>
          </div>
        </div>

        <div class="mt-3">
          <div class="flex">
            <div class="text-stone-400 mb-1">Password:</div>
          </div>
          <div>
            <InputText class="w-full p-inputtext-sm" v-model="password"></InputText>
          </div>
        </div>
        <div class="border-t-2 border-stone-500 text-xl mt-10 mb-3 pt-1">
          <div class="mb-2">UI access:</div>
          <div class="text-amber-500">
            http://{{ lbIP }}:3000
          </div>
          <div class="text-amber-500">
            https://{{ lbIP }}:3443
          </div>
        </div>

        <div class="mt-10 flex flex-col items-center">
          <div class="flex justify-center">
            <div class="mr-2">
              <HelmAppSwitch
                  @on-enable-app="onEnableApp"
                  @on-disable-app="onDisableApp"
                  :is-app-enabled="isAppEnabled"
                  :disabled="!isFormValid">
              </HelmAppSwitch>
            </div>
          </div>

        </div>
      </div>
    </div>


    <div class="pb-10">
      <Button @click="onClose"
              icon="pi pi-times"
              class="p-button-rounded p-button-primary p-button-outlined" title="Close"></Button>
    </div>
  </div>
</template>
<script lang="ts" setup>
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import {usePropertiesPanelStore} from "@/stores/propertiesPanelStore";
import HelmAppSwitch from "@/components/HelmAppSwitch.vue";
import {computed, onMounted, ref} from "vue";
import type {k4p} from "@wails/models";
import {useProjectStore} from "@/stores/projectStore";
import {findLastLoadBalancerIP} from "@/utils/loadbalancerIp";
import {EncodeUsingBCrypt} from "@wails/service/PasswordEncoder";

const propertiesPanelStore = usePropertiesPanelStore();
const projectStore = useProjectStore();
const appName = "argo-cd"
const loadBalancerIPParamName = "server.service.loadBalancerIP";
const passwordParamName = "configs.secret.argocdServerAdminPassword";
const defaultApp = {
  chartName: "argo-cd",
  namespace: "argo-cd",
  releaseName: appName,
  repository: "https://argoproj.github.io/argo-helm",
  parameters: {
    "server.service.type": "LoadBalancer",
    "server.service.loadBalancerIP": "",
    "configs.secret.argocdServerAdminPassword": "",
    "server.service.servicePortHttp": "3000",
    "server.service.servicePortHttps": "3443",
    'server.service.labels."metallb.universe.tf/allow-shared-ip"': "management"
  },
  additionalK8SResources: [],
  valueFileContent: "",
  projectParams: {
    "configs.secret.argocdServerAdminPassword": "k4prox"
  }
} as k4p.HelmApp;

onMounted(() => {
  const appFromStore = projectStore.helmApps.find(e => e.releaseName === appName);
  if (appFromStore) {
    password.value = appFromStore.projectParams[passwordParamName];
    lbIP.value = appFromStore.parameters[loadBalancerIPParamName];
  } else {
    password.value = defaultApp.projectParams[passwordParamName];
    lbIP.value = findLastLoadBalancerIP();
  }
});

const password = ref<string>("");
const lbIP = ref<string>("");

const isFeatureEnabled = computed((): boolean => {
  return !!projectStore.helmApps.find(e => e.releaseName === appName);
})

const isFormValid = computed((): boolean => {
  return password.value.trim().length > 0;
});

const valuesAreNotSaved = computed((): boolean => {
  const feature = projectStore.helmApps.find(e => e.releaseName === appName);
  if (!feature) {
    return false
  }
  return feature.projectParams[passwordParamName] !== password.value;
});

const onUpdateApp = async function () {
  projectStore.updateHelmApp(await prepareApp())
}

const onEnableApp = async function () {
  projectStore.enableHelmApp(await prepareApp())
}

const prepareApp = async function (): Promise<k4p.HelmApp> {
  const params = defaultApp.parameters;
  params[passwordParamName] = await EncodeUsingBCrypt(password.value);
  params[loadBalancerIPParamName] = lbIP.value;

  const projectParams = defaultApp.projectParams
  projectParams[passwordParamName] = password.value;
  return {
    ...defaultApp,
    parameters: params,
    projectParams: projectParams
  }
}

const onDisableApp = async function () {
  projectStore.disableHelmApp(appName);
}
const onClose = function (): void {
  propertiesPanelStore.deselect();
}

const isAppEnabled = computed((): boolean => {
  return !!projectStore.helmApps.find(e => e.releaseName === appName);
})

</script>
<style>

</style>