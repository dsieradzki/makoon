import React, { useContext, useState } from 'react';
import { InputText } from "primereact/inputtext";
import * as Yup from "yup";
import { useFormik } from "formik";
import { FormikHelpers } from "formik/dist/types";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { useOnFirstMount } from "@/utils/hooks";
import { GetNetworkBridges } from "@wails/provisioner/Service";
import { LogDebug } from "@wails-runtime/runtime";
import { observer } from "mobx-react-lite";
import WizardNavigator from "@/views/ClusterWizard/WizardNavigator";
import { GeneralSettingsModel } from "@/store/clusterWizardStore";
import { ClusterWizardStoreContext } from "@/views/ClusterWizard/ClusterWizardView";
import FormError from "@/components/FormError";
import clustersListStore from "@/store/clustersListStore";
import { apiCall } from "@/utils/api";


const renderDescription = (description: string) => {
    return <div className="min-w-[40%] max-w-[40%]">
        <div className="font-bold">Description:</div>
        <div>{description}</div>
    </div>
}

const renderSectionHead = (name: string) => {
    return <div className="text-xl my-3">
        {name}
    </div>
}
const GeneralSettingsStep = () => {
    const [networks, setNetworks] = useState<string[]>([])
    const clusterStore = useContext(ClusterWizardStoreContext)
    const storedModel = clusterStore.generalSettings

    useOnFirstMount(async () => {
        setNetworks(await apiCall(() => GetNetworkBridges()))
        LogDebug("Networks loaded");
    })
    const getClusterNames = (): string[] => {
        return clustersListStore.clusters.map(e => e.name)
    }

    const schema = Yup.object().shape({
        clusterName: Yup.string().required().strict().trim().test({
            name: "is-name-available",
            message: "Cluster name is already used",
            test: (val) => {
                const foundCluster = getClusterNames().find(e => e === val);
                return foundCluster == null
            },
            exclusive: false
        }),
        nodeUsername: Yup.string().required().strict().trim(),
        nodePassword: Yup.string().required().strict().trim(),
        nodeDiskSize: Yup.number().required(),
        network: Yup.object().shape({
            bridge: Yup.string().required(),
            subnetMask: Yup.number().required(),
            gateway: Yup.string().required().strict().trim(),
            dnsServer: Yup.string().required().strict().trim(),
        })
    })

    const formik = useFormik<GeneralSettingsModel>({
        validateOnMount: true,
        initialValues: storedModel,
        validationSchema: schema,
        enableReinitialize: true,
        onSubmit: async (values: GeneralSettingsModel, formikHelpers: FormikHelpers<any>) => {
            clusterStore.updateGeneralSettings(values)
            formikHelpers.resetForm()
        },
        onReset: (_: GeneralSettingsModel, formikHelpers: FormikHelpers<any>) => {
        }
    })
    return (
        <>
            <WizardNavigator
                onNext={async () => {
                    await formik.submitForm()
                }}
                nextDisabled={!formik.isValid}/>

            <div className="mt-10"></div>
            <div className="font-bold text-2xl flex items-center mt-5">
                <span className="mr-4">Settings</span>
            </div>

            <form onSubmit={formik.handleSubmit} onReset={formik.handleReset}>
                <div className="flex flex-col"
                     style={{backgroundColor: "var(--color-background)"}}>

                    {renderSectionHead("General")}
                    <div className="flex mt-3 mb-4">
                        <div className="grow flex flex-col pr-5">
                            <div className="text-stone-400 required">Cluster name</div>
                            <InputText name="clusterName"
                                       className="w-full p-inputtext-sm"
                                       value={formik.values.clusterName}
                                       onChange={formik.handleChange}
                                       onBlur={formik.handleBlur}/>

                            <FormError error={formik.errors.clusterName} touched={formik.touched.clusterName}/>
                        </div>
                        {renderDescription("Cluster name will be used to identify your cluster in K4Prox and as prefix for all nodes.")}
                    </div>
                    {renderSectionHead("User")}
                    <div className="flex mt-3 mb-4">
                        <div className="grow flex flex-col pr-5">
                            <div>
                                <div className="text-stone-400 required">Node Username</div>
                                <InputText name="nodeUsername"
                                           className="w-full p-inputtext-sm"
                                           value={formik.values.nodeUsername}
                                           onChange={formik.handleChange}
                                           onBlur={formik.handleBlur}/>
                                <FormError error={formik.errors.nodeUsername} touched={formik.touched.nodeUsername}/>
                            </div>
                            <div className="mt-3 text-stone-400">
                                <div
                                    title="K4Prox will generate SSH key for node access, authentication via password is disabled by default">
                                    <span className="required">Node Password</span> <p
                                    className="ml-1 pi pi-exclamation-triangle text-amber-700"
                                    style={{fontSize: "1rem"}}></p></div>
                                <InputText name="nodePassword"
                                           className="w-full p-inputtext-sm"
                                           value={formik.values.nodePassword}
                                           onChange={formik.handleChange}
                                           onBlur={formik.handleBlur}/>

                                <FormError error={formik.errors.nodePassword} touched={formik.touched.nodePassword}/>
                            </div>
                        </div>
                        {renderDescription("Username and password will be used for all nodes. " +
                            "K4Prox will generate SSH key for node access, authentication via password is disabled by default.")}
                    </div>

                    {renderSectionHead("Storage")}
                    <div className="flex mt-3">
                        <div className="grow flex flex-col pr-5">
                            <div>
                                <div className="text-stone-400 required">Disks size (GB)</div>
                                <InputNumber name="nodeDiskSize"
                                             className="w-full p-inputtext-sm"
                                             value={formik.values.nodeDiskSize}
                                             onChange={v => {
                                                 formik.setFieldValue("nodeDiskSize", v.value, true)
                                             }}
                                             onBlur={formik.handleBlur}
                                             showButtons
                                             buttonLayout="horizontal" incrementButtonIcon="pi pi-plus"
                                             decrementButtonIcon="pi pi-minus" min={1}/>

                                <FormError error={formik.errors.nodeDiskSize} touched={formik.touched.nodeDiskSize}/>
                            </div>
                        </div>
                        {renderDescription("Common disk size for each node. Storage pool can be selected separately for each node in node properties.")}
                    </div>

                    {renderSectionHead("Network")}
                    <div className="flex mt-3">
                        <div className="grow flex flex-col pr-5">
                            <div>
                                <div className="text-stone-400 required">Network bridge</div>
                                <Dropdown name="network.bridge"
                                          className="w-full"
                                          value={formik.values.network.bridge}
                                          onChange={formik.handleChange}
                                          options={networks}/>
                            </div>
                            <div className="mt-2">
                                <div className="text-stone-400 required">Subnet mask (CIDR Notation)</div>
                                <InputNumber name="network.subnetMask"
                                             className="w-full p-inputtext-sm"
                                             value={formik.values.network.subnetMask}
                                             onChange={v => {
                                                 formik.setFieldValue("network.subnetMask", v.value, true)
                                             }}
                                             onBlur={formik.handleBlur}
                                             showButtons
                                             buttonLayout="horizontal" incrementButtonIcon="pi pi-plus"
                                             decrementButtonIcon="pi pi-minus" min={1}/>

                                <FormError error={formik.errors.network?.subnetMask}
                                           touched={formik.touched.network?.subnetMask}/>
                            </div>
                            <div className="mt-2">
                                <div className="text-stone-400 required">Gateway</div>
                                <InputText name="network.gateway"
                                           className="w-full p-inputtext-sm"
                                           value={formik.values.network.gateway}
                                           onChange={formik.handleChange}
                                           onBlur={formik.handleBlur}/>

                                <FormError error={formik.errors.network?.gateway}
                                           touched={formik.touched.network?.gateway}/>
                            </div>
                            <div className="mt-2">
                                <div className="text-stone-400 required">DNS server</div>
                                <InputText name="network.dnsServer"
                                           className="w-full p-inputtext-sm"
                                           value={formik.values.network.dnsServer}
                                           onChange={formik.handleChange}
                                           onBlur={formik.handleBlur}/>

                                <FormError error={formik.errors.network?.dnsServer}
                                           touched={formik.touched.network?.dnsServer}/>
                            </div>
                        </div>
                        {renderDescription("Network settings for all nodes. Node IP address can be selected separately in the node properties.")}
                    </div>
                </div>
            </form>
        </>
    );
};

export default observer(GeneralSettingsStep);