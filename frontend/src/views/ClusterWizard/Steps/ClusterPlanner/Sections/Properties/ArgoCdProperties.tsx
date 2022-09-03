import React, { useState } from 'react';
import { InputText } from "primereact/inputtext";
import { InputSwitch } from "primereact/inputswitch";
import { k4p } from "@wails/models";
import { useOnFirstMount } from "@/reactHooks";
import projectStore from "@/store/projectStore";
import {
    findLastLoadBalancerIP
} from "@/views/ClusterWizard/Steps/ClusterPlanner/Sections/Properties/utils/loadbalancerIp";
import { EncodeUsingBCrypt } from "@wails/auth/Service";
import { observer } from "mobx-react-lite";

const appName = "argocd"
const loadBalancerIPParamName = "server.service.loadBalancerIP";
const passwordParamName = "configs.secret.argocdServerAdminPassword";

const defaultApp = {
    chartName: "argo-cd",
    namespace: "argocd",
    releaseName: appName,
    repository: "https://argoproj.github.io/argo-helm",
    parameters: {
        "server.service.type": "LoadBalancer",
        "server.service.loadBalancerIP": "",
        "configs.secret.argocdServerAdminPassword": "",
        "server.service.servicePortHttp": "3000",
        "server.service.servicePortHttps": "3443",
        "server.service.annotations.\"metallb\\.universe\\.tf/allow-shared-ip\"": "management"
    },
    additionalK8SResources: [],
    valueFileContent: "",
    projectParams: {
        "configs.secret.argocdServerAdminPassword": "k4prox"
    }
} as k4p.HelmApp;

const prepareApp = async function (ip: string, password: string): Promise<k4p.HelmApp> {
    try {
        const params = {...defaultApp.parameters}
        params[passwordParamName] = await EncodeUsingBCrypt(password)
        params[loadBalancerIPParamName] = ip

        const projectParams = {...defaultApp.projectParams}
        projectParams[passwordParamName] = password
        return {
            ...defaultApp,
            parameters: params,
            projectParams: projectParams
        }
    } catch (err) {
        throw err
    }
}
const ArgoCdProperties = () => {
    const [adminPassword, setAdminPassword] = useState("")
    const [lbIP, setLbIp] = useState("")

    useOnFirstMount(async () => {
        const appFromStore = projectStore.helmApps.find(e => e.releaseName === appName);
        if (appFromStore) {
            setAdminPassword(appFromStore.projectParams[passwordParamName])
            setLbIp(appFromStore.parameters[loadBalancerIPParamName])
        } else {
            setAdminPassword(defaultApp.projectParams[passwordParamName])
            setLbIp(findLastLoadBalancerIP())
        }
    })

    const isFormValid = (): boolean => {
        return adminPassword.trim().length >= 6 && lbIP.trim().length >= 7;
    }
    const isAppEnabled = !!projectStore.helmApps.find(e => e.releaseName === appName)

    const onChangeFeatureState = async (value: boolean) => {
        if (value) {
            projectStore.enableHelmApp(await prepareApp(lbIP, adminPassword))
        } else {
            projectStore.disableHelmApp(appName)
        }
    }
    return <>
        <div className="flex flex-col w-full h-full items-center">
            <div className="grow w-full">
                <div className="text-3xl text-center font-bold mt-5 flex items-center justify-center">
                    <span className="mr-2">Argo CD</span>
                    <InputSwitch disabled={!isFormValid()} checked={isAppEnabled}
                                 tooltip={!isAppEnabled && !isFormValid() ? "Fill ip address and password to enable application" : ""}
                                 tooltipOptions={{showOnDisabled: true, position: "bottom"}}
                                 onChange={e => onChangeFeatureState(e.value)}/>
                </div>
                <div className="p-10">
                    <div>
                        Deploys Argo CD, the declarative, GitOps continuous delivery tool for Kubernetes.
                    </div>

                    <div className="mt-3">
                        <div className="flex">
                            <div className="text-stone-400 mb-1 required">Load balancer IP:</div>
                        </div>
                        <div>
                            <InputText value={lbIP} onChange={e => setLbIp(e.target.value)}
                                       disabled={isAppEnabled}
                                       tooltip={isAppEnabled ? "To edit ip address, you have to disable Helm app" : ""}
                                       tooltipOptions={{showOnDisabled: true, position: "bottom"}}
                                       className="w-full p-inputtext-sm"></InputText>
                        </div>
                    </div>

                    <div className="mt-3">
                        <div className="flex">
                            <div className="text-stone-400 mb-1 required">Password:</div>
                        </div>
                        <div>
                            <InputText value={adminPassword} onChange={e => setAdminPassword(e.target.value)}
                                       disabled={isAppEnabled}
                                       tooltip={isAppEnabled ? "To edit admin password, you have to disable Helm app" : ""}
                                       tooltipOptions={{showOnDisabled: true, position: "bottom"}}
                                       className="w-full p-inputtext-sm"></InputText>
                        </div>
                    </div>
                    <div className="border-t-2 border-stone-800 text-xl mt-5 pt-5 mb-3 pt-1">
                        <div className="mb-2">UI access:</div>
                        <div className="text-amber-500">
                            http://{lbIP}:3000
                        </div>
                        <div className="text-amber-500">
                            https://{lbIP}:3443
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </>;
};

export default observer(ArgoCdProperties)