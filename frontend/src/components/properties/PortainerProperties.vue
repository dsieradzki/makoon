<template>
  <div class="flex flex-col w-full h-full items-center">
    <div class="grow w-full">
      <div class="text-3xl text-center font-bold mt-5">Portainer</div>
      <div class="p-10">
        <div>
          Container management dashboard.
        </div>
        <div class="border-t-2 border-stone-500 text-xl mt-10 mb-3 flex pt-2 mb-5">
          Properties
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
            <div class="text-stone-400 mb-1">Storage class name:</div>
          </div>
          <div>
            <InputText class="w-full p-inputtext-sm" v-model="storageClass"></InputText>
          </div>
        </div>
        <div class="border-t-2 border-stone-500 text-xl mt-10 mb-3 pt-1">
          <div class="mb-2">UI access:</div>
          <div class="text-amber-500">
            http://{{ lbIP }}:9000
          </div>
          <div class="text-amber-500">
            https://{{ lbIP }}:9443
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

const propertiesPanelStore = usePropertiesPanelStore();
const projectStore = useProjectStore();
const appName = "portainer"

const storageClassParamName = "persistence.storageClass";
const defaultStorageClassNameForNonHA = "openebs-hostpath";
const defaultStorageClassNameForHA = "openebs-jiva-csi-default";

const defaultApp = {
  chartName: "portainer",
  namespace: "portainer",
  releaseName: appName,
  repository: "https://portainer.github.io/k8s/",
  parameters: {
    "service.type": "ClusterIP",
    "ingress.enabled": "false",
    "persistence.storageClass": getBestStorageClass()
  },
  additionalK8SResources: [],
  valueFileContent: "",
  projectParams: {}
} as k4p.HelmApp;

const lbIP = ref<string>("");
const storageClass = ref<string>("");


// Portainer chart has no ability to specify Load balancer IP - it's necessary when I want to aggregate all management
// services on last LB IP from range
const LOAD_BALANCER_SERVICE_TEMPLATE_PORTAINER = `
apiVersion: v1
kind: Service
metadata:
  annotations:
    meta.helm.sh/release-name: portainer
    meta.helm.sh/release-namespace: portainer
    metallb.universe.tf/allow-shared-ip: "management"
  labels:
    app.kubernetes.io/instance: portainer
    app.kubernetes.io/name: portainer
    app.kubernetes.io/version: ce-latest-ee-2.14.1
    helm.sh/chart: portainer-1.0.32
    io.portainer.kubernetes.application.stack: portainer
  name: portainer-lb-service
  namespace: portainer
spec:
  type: LoadBalancer
  loadBalancerIP: {{LB_IP}}
  ports:
    - name: http
      nodePort: 31461
      port: 9000
      protocol: TCP
      targetPort: 9000
    - name: https
      nodePort: 31761
      port: 9443
      protocol: TCP
      targetPort: 9443
    - name: edge
      nodePort: 30854
      port: 8000
      protocol: TCP
      targetPort: 8000
  selector:
    app.kubernetes.io/instance: portainer
    app.kubernetes.io/name: portainer
  sessionAffinity: None
`

onMounted(() => {
  const appFromStore = projectStore.helmApps.find(e => e.releaseName === appName);
  if (appFromStore) {
    storageClass.value = appFromStore.parameters[storageClassParamName];
    lbIP.value = extractLbIp(appFromStore);
  } else {
    storageClass.value = getBestStorageClass();
    lbIP.value = findLastLoadBalancerIP();
  }
});

const isFeatureEnabled = computed((): boolean => {
  return !!projectStore.helmApps.find(e => e.releaseName === appName);
})

const isFormValid = computed((): boolean => {
  return lbIP.value.trim().length > 0 && storageClass.value.trim().length > 0;
});

const valuesAreNotSaved = computed((): boolean => {
  const feature = projectStore.helmApps.find(e => e.releaseName === appName);
  if (!feature) {
    return false
  }
  return feature.parameters[storageClassParamName] !== storageClass.value || feature.additionalK8SResources[0] !== parseTemplate();
});


const onUpdateApp = function () {
  projectStore.updateHelmApp(prepareApp())
}

const onEnableApp = function () {
  projectStore.enableHelmApp(prepareApp())
}

const prepareApp = function (): k4p.HelmApp {
  const params = defaultApp.parameters;
  params[storageClassParamName] = storageClass.value;
  return {
    ...defaultApp,
    parameters: params,
    additionalK8SResources: [parseTemplate()]
  }
}

const onDisableApp = function () {
  projectStore.disableHelmApp(appName);
}

const onClose = function (): void {
  propertiesPanelStore.deselect();
}

const parseTemplate = function (): string {
  return LOAD_BALANCER_SERVICE_TEMPLATE_PORTAINER.replace("{{LB_IP}}", lbIP.value)
}
const extractLbIp = function (helmApp: k4p.HelmApp): string {
  if (helmApp.additionalK8SResources.length == 0) {
    return "";
  }
  const lbLine = helmApp.additionalK8SResources[0]
      .split('\n')
      .find(e => e.indexOf("loadBalancerIP:") != -1)
  if (!lbLine) {
    return "";
  }
  return lbLine.substring(lbLine.indexOf(":") + 1).trim();
}

const isAppEnabled = computed((): boolean => {
  return !!projectStore.helmApps.find(e => e.releaseName === appName);
})

function getBestStorageClass(): string {
  if (projectStore.masterNodes.length + projectStore.workerNodes.length >= 3) {
    return defaultStorageClassNameForHA;
  } else {
    return defaultStorageClassNameForNonHA;
  }
}
</script>
<style>

</style>