<template>
  <div class="flex flex-col w-full h-full items-center">
    <div class="grow w-full">
      <div class="text-3xl text-center font-bold mt-5">Ingress Controller</div>
      <div class="p-10">
        <div>
          A ingress controller for external access.
        </div>
        <template v-if="isFeatureEnabled">
          <div class="border-t-2 border-stone-500 text-xl mt-10 mb-3">
            Properties
          </div>
          <div class="mt-3">
            <div class="flex items-center mb-2">
              <Checkbox v-model="useLB" @change="onUseLBChange" :binary="true" class="mr-2"/>
              <div class="text-stone-400">Use load balancer</div>
              <div v-if="isFeatureEnabled && valuesAreNotSaved && useLB" class="ml-2">
                <Button @click="onUpdate" :disabled="!isFormValid"
                        class="p-button-rounded p-button-sm p-button-success" :class="$style.updateButton">
                  Update
                </Button>
              </div>
            </div>

            <div class="flex items-center">
              <div class="mr-1">IP:</div>
              <div class="mr-3">
                <InputText :disabled="!useLB" class="w-full p-inputtext-sm" v-model="ip"></InputText>
              </div>
            </div>
          </div>
        </template>
        <div class="mt-10 flex flex-col items-center">
          <div v-if="isFeatureEnabled && !isLBFeatureEnabled && useLB" class="mb-1">
            <div class="text-red-600">MetalLB feature is required to enable load balanced ingress</div>
          </div>
        </div>
        <div class="mt-5 flex flex-col items-center justify-center">
          <MicroK8sAddonSwitch :feature-name="featureName">
          </MicroK8sAddonSwitch>
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
import {usePropertiesPanelStore} from "@/stores/propertiesPanelStore";
import MicroK8sAddonSwitch from "@/components/MicroK8sAddonSwitch.vue";
import {computed, onMounted, ref} from "vue";
import {useProjectStore} from "@/stores/projectStore";
import InputText from "primevue/inputtext";
import Checkbox from 'primevue/checkbox';
import type {k4p} from "@wails/models";

const LOAD_BALANCER_SERVICE_TEMPLATE = `
apiVersion: v1
kind: Service
metadata:
  name: ingress
  namespace: ingress
spec:
  selector:
    name: nginx-ingress-microk8s
  type: LoadBalancer
  # loadBalancerIP is optional. MetalLB will automatically allocate an IP
  # from its pool if not specified. You can also specify one manually.
  loadBalancerIP: {{LB_IP}}
  ports:
    - name: http
      protocol: TCP
      port: 80
      targetPort: 80
    - name: https
      protocol: TCP
      port: 443
      targetPort: 443
`;

const propertiesPanelStore = usePropertiesPanelStore();
const projectStore = useProjectStore();
const featureName = "ingress";
const lbFeatureName = "metallb";

const useLB = ref<boolean>(false);
const ip = ref<string>("");

onMounted(() => {
  const feature = projectStore.microK8sAddons.find(e => e.name === featureName);
  if (!feature) {
    return
  }

  ip.value = extractLbIp(feature);
  if (ip.value.length > 0) {
    useLB.value = true;
  }
});

const extractLbIp = function (feature: k4p.MicroK8sAddon): string {
  if (feature.additionalK8SResources.length == 0) {
    return "";
  }
  const lbLine = feature.additionalK8SResources[0]
      .split('\n')
      .find(e => e.indexOf("loadBalancerIP:") != -1)
  if (!lbLine) {
    return "";
  }
  return lbLine.substring(lbLine.indexOf(":") + 1).trim();
}
const onClose = function (): void {
  propertiesPanelStore.deselect();
}

const isFeatureEnabled = computed((): boolean => {
  return !!projectStore.microK8sAddons.find(e => e.name === featureName);
})

const isFormValid = computed((): boolean => {
  if (useLB.value) {
    return ip.value.trim().length > 0
  }
  return true;
});

const isLBFeatureEnabled = computed(() => {
  return !!projectStore.microK8sAddons.find(e => e.name === lbFeatureName);
});

const onUseLBChange = function () {
  if (useLB.value && isLBFeatureEnabled) {
    const lbFeature = projectStore.microK8sAddons.find((e) => e.name === lbFeatureName);
    if (!lbFeature) {
      ip.value = "";
      return
    }
    ip.value = lbFeature.args.substring(1, lbFeature.args.indexOf("-"));
  } else {
    ip.value = "";
  }
}

const valuesAreNotSaved = computed((): boolean => {
  const feature = projectStore.microK8sAddons.find(e => e.name === featureName);
  if (!feature) {
    return false
  }
  return feature.additionalK8SResources[0] !== parseTemplate();
});

const onUpdate = function (): void {
  projectStore.updateMicroK8SAddonAdditionalK8SResources(featureName, parseTemplate());
}

const parseTemplate = function (): string {
  return LOAD_BALANCER_SERVICE_TEMPLATE.replace("{{LB_IP}}", ip.value)
}

</script>
<style module>
.updateButton {
  padding: 0 !important;
  display: flex;
  justify-content: center;
}
</style>