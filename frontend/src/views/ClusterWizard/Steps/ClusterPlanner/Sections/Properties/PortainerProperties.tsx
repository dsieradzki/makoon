import React, { useState } from 'react';
import { InputText } from "primereact/inputtext";
import { InputSwitch } from "primereact/inputswitch";
import projectStore from "@/store/projectStore";
import { useOnFirstMount } from "@/reactHooks";
import { k4p } from "@wails/models";
import { observer } from "mobx-react-lite";
import {
    findLastLoadBalancerIP
} from "@/views/ClusterWizard/Steps/ClusterPlanner/Sections/Properties/utils/loadbalancerIp";

const appName = "portainer"

const storageClassParamName = "persistence.storageClass";
const defaultStorageClassNameForNonHA = "openebs-hostpath";
const defaultStorageClassNameForHA = "openebs-jiva-csi-default";

function getBestStorageClass(): string {
    if (projectStore.masterNodes.length + projectStore.workerNodes.length >= 3) {
        return defaultStorageClassNameForHA;
    } else {
        return defaultStorageClassNameForNonHA;
    }
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

const parseTemplate = function (ip: string): string {
    return LOAD_BALANCER_SERVICE_TEMPLATE_PORTAINER.replace("{{LB_IP}}", ip)
}
const prepareApp = function (storageClass: string, ip: string): k4p.HelmApp {
    const params = {...defaultApp.parameters};
    params[storageClassParamName] = storageClass;
    return {
        ...defaultApp,
        parameters: params,
        additionalK8SResources: [parseTemplate(ip)]
    }
}
const PortainerProperties = () => {
    const [lbIP, setLbIp] = useState("")
    const [storageClass, setStorageClass] = useState("")

    useOnFirstMount(async () => {
        const appFromStore = projectStore.helmApps.find(e => e.releaseName === appName);
        if (appFromStore) {
            setStorageClass(appFromStore.parameters[storageClassParamName])
            setLbIp(extractLbIp(appFromStore))
        } else {
            setStorageClass(getBestStorageClass())
            setLbIp(findLastLoadBalancerIP())
        }
    })
    const onChangeFeatureState = (value: boolean) => {
        if (value) {
            projectStore.enableHelmApp(prepareApp(storageClass, lbIP))
        } else {
            projectStore.disableHelmApp(appName)
        }
    }
    const isFormValid = (): boolean => {
        return storageClass.trim().length > 0 && lbIP.trim().length >= 7;
    }
    const isAppEnabled = !!projectStore.helmApps.find(e => e.releaseName === appName)


    return <>
        <div className="flex flex-col w-full h-full items-center">
            <div className="grow w-full">
                <div className="text-3xl text-center font-bold mt-5 flex items-center justify-center">
                    <span className="mr-2">Portainer</span>
                    <InputSwitch disabled={!isFormValid()} checked={isAppEnabled}
                                 tooltip={!isAppEnabled && !isFormValid() ? "Fill ip address and storage class name to enable application" : ""}
                                 tooltipOptions={{showOnDisabled: true, position: "bottom"}}
                                 onChange={e => onChangeFeatureState(e.value)}/>
                </div>
                <div className="p-10">
                    <div>
                        Portainer's multi-cluster, multi-cloud container management platform supports Docker, Swarm,
                        Nomad, and Kubernetes.
                    </div>

                    <div className="mt-3">
                        <div className="flex">
                            <div className="text-stone-400 mb-1 required">Load balancer IP:</div>
                        </div>
                        <div>
                            <InputText
                                value={lbIP} onChange={e => setLbIp(e.target.value)}
                                disabled={isAppEnabled}
                                tooltip={isAppEnabled ? "To edit ip address, you have to disable Helm app" : ""}
                                tooltipOptions={{showOnDisabled: true, position: "bottom"}}
                                className="w-full p-inputtext-sm" ></InputText>
                        </div>
                    </div>

                    <div className="mt-3">
                        <div className="flex">
                            <div className="text-stone-400 mb-1 required">Storage class name:</div>
                        </div>
                        <div>
                            <InputText
                                value={storageClass} onChange={e => setStorageClass(e.target.value)}
                                disabled={isAppEnabled}
                                tooltip={isAppEnabled ? "To edit storage class, you have to disable Helm app" : ""}
                                tooltipOptions={{showOnDisabled: true, position: "bottom"}}

                                className="w-full p-inputtext-sm"></InputText>
                        </div>
                    </div>
                    <div className="border-t-2 border-stone-500 text-xl mt-10 mb-3 pt-1">
                        <div className="mb-2">UI access:</div>
                        <div className="text-amber-500">
                            http://{lbIP}:9000
                        </div>
                        <div className="text-amber-500">
                            https://{lbIP}:9443
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </>;
};

export default observer(PortainerProperties);