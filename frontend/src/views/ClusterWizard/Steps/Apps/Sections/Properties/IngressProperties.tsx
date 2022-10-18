import React, { useState } from 'react';
import AddonSwitch from "@/views/ClusterWizard/Steps/Apps/Sections/Properties/components/AddonSwitch";
import { InputText } from "primereact/inputtext";
import projectStore from "@/store/projectStore";
import { observer } from "mobx-react-lite";
import { LogDebug, LogInfo } from "@wails-runtime/runtime";
import { k4p } from "@wails/models";
import { useOnFirstMount } from "@/reactHooks";

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

const addonName = "ingress"
const requiredAddonName = "metallb"

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

const parseTemplate = function (ipToReplace: string): string {
    return LOAD_BALANCER_SERVICE_TEMPLATE.replace("{{LB_IP}}", ipToReplace)
}

const IngressProperties = () => {
    const isEnabled = !!projectStore.microK8SAddons.find(e => e.name === addonName);
    const isLBFeatureEnabled = !!projectStore.microK8SAddons.find(e => e.name === requiredAddonName);
    const [ip, setIp] = useState("")

    useOnFirstMount(async () => {
        const feature = projectStore.microK8SAddons.find(e => e.name === addonName);
        if (!feature) {
            return
        }
        setIp(extractLbIp(feature))
    })

    const isIpValid = (): boolean => ip.trim().length >= 7
    const isIpEmpty = (): boolean => ip.trim().length == 0


    const onLoadBalancerIPChangeHandler = function (value: string): void {
        setIp(value)
        const shouldUpdate = value.trim().length >=7 && isLBFeatureEnabled
        projectStore.updateMicroK8SAddonAdditionalK8SResources(addonName, shouldUpdate ? [parseTemplate(value)] : []);
    }
    return (
        <div className="flex flex-col w-full h-full items-center">
            <div className="grow w-full">
                <div className="text-3xl text-center font-bold mt-5 flex items-center justify-center">
                    <span className="mr-2">Ingress</span>
                    <AddonSwitch name={addonName}/>
                </div>
                <div className="p-5">
                    The Ingress manages external access to the services in a cluster, typically HTTP.
                    Ingress may provide load balancing, SSL termination and name-based virtual hosting.
                </div>

                {isEnabled &&
                    <div className="mt-3 p-5">
                        <div className="mr-1">IP from MetalLB range</div>
                        <div className="flex items-center">
                            <InputText value={ip}
                                       onChange={e => onLoadBalancerIPChangeHandler(e.target.value)}
                                       className="p-inputtext-sm"/>

                        </div>
                    </div>
                }
                <div className="mt-5 flex flex-col items-center">
                    {isEnabled && !isLBFeatureEnabled && !isIpEmpty() &&
                        <div className="mb-1">
                            <div className="text-red-500">MetalLB addon is required to enable load balanced ingress
                            </div>
                        </div>
                    }
                    {isEnabled && isLBFeatureEnabled && !isIpValid() &&
                        <div className="mb-1 p-5">
                            <div className="text-red-500">
                                Ingress will not use MetalLb load-balancer,
                                this means you will not have failover support between
                                nodes and also you have to expose one of node IP for external traffic.
                            </div>
                        </div>
                    }
                </div>


            </div>
        </div>
    );
};

export default observer(IngressProperties);