import React, { useState } from 'react';
import { useOnFirstMount } from "@/reactHooks";
import { GetNetworkBridges } from "@wails/provisioner/Service";
import { LogDebug } from "@wails-runtime/runtime";
import { Button } from "primereact/button";
import { k4p } from "@wails/models";
import { Formik, FormikProps, useFormik } from "formik";
import { FormikHelpers } from "formik/dist/types";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import projectStore, { GeneralSettingsModel } from "@/store/projectStore";
import * as Yup from "yup"

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

const collapsedContentStyle = {
    backgroundColor: "var(--surface-card)",
    borderColor: "#292524",
    borderWidth: "2px",
    borderRadius: "15px",
    padding: "15px",
    marginTop: "15px"
}

const schema = Yup.object().shape({
    nodeUsername: Yup.string().required(),
    nodePassword: Yup.string().required(),
    nodeDiskSize: Yup.number().required(),
    network: Yup.object().shape({
        bridge: Yup.string().required(),
        subnetMask: Yup.number().required(),
        gateway: Yup.string().required(),
        dnsServer: Yup.string().required(),
    })
})
const GeneralSettingsSection = () => {
    const [networks, setNetworks] = useState<string[]>([])
    let [isExpanded, setExpanded] = useState(false);

    const storedModel = projectStore.generalSettings

    useOnFirstMount(async () => {
        setNetworks(await GetNetworkBridges())
        LogDebug("Networks loaded");
    })

    const formik = useFormik<GeneralSettingsModel>({
        validateOnMount: true,
        initialValues: storedModel,
        validationSchema: schema,
        enableReinitialize: true,
        onSubmit: async (values: GeneralSettingsModel, formikHelpers: FormikHelpers<any>) => {
            projectStore.updateGeneralSettings(values)
            formikHelpers.resetForm()
            setExpanded(false)
        },
        onReset: (_: GeneralSettingsModel, formikHelpers: FormikHelpers<any>) => {
            setExpanded(false);
        }
    })

    const collapsedContent = <div style={collapsedContentStyle}>
        <div className="flex mb-5">
            <span className="italic mr-2">Node Username:</span><span
            className="font-bold">{storedModel.nodeUsername}</span>
            <span className="italic ml-5 mr-2">Node Password:</span><span
            className="font-bold">{storedModel.nodePassword}</span>
            <span className="italic ml-5 mr-2">Disk size (GB):</span><span
            className="font-bold">{storedModel.nodeDiskSize} GB</span>
        </div>
        <div className="flex">
            <span className="italic mr-2">Proxmox network bridge:</span><span
            className="font-bold">{storedModel.network.bridge}</span>
            <span className="italic ml-5 mr-2">Subnet mask (CIDR Notation):</span><span
            className="font-bold">{storedModel.network.subnetMask}</span>
            <span className="italic ml-5 mr-2">Gateway:</span><span
            className="font-bold">{storedModel.network.gateway}</span>
            <span className="italic ml-5 mr-2">DNS server:</span><span
            className="font-bold">{storedModel.network.dnsServer}</span>
        </div>
    </div>
    const expandedContent = <div className="flex flex-col"
             style={{backgroundColor: "var(--color-background)"}}>
            {renderSectionHead("User")}
            <div className="flex mt-3">
                <div className="grow flex flex-col pr-5">
                    <div>
                        <div className="text-stone-400 required">Node Username</div>
                        <InputText name="nodeUsername"
                                   className="w-full p-inputtext-sm"
                                   value={formik.values.nodeUsername}
                                   onChange={formik.handleChange}
                                   onBlur={formik.handleBlur}></InputText>
                    </div>
                    <div className="mt-3 text-stone-400">
                        <div
                            title="K4Prox will generate SSH key for node access, authentication via password is disabled by default">
                            <span className="required">Node Password</span> <p className="ml-1 pi pi-exclamation-triangle text-amber-700"
                                             style={{fontSize: "1rem"}}></p></div>
                        <InputText name="nodePassword"
                                   className="w-full p-inputtext-sm"
                                   value={formik.values.nodePassword}
                                   onChange={formik.handleChange}
                                   onBlur={formik.handleBlur}></InputText>
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
                                     onChange={v=> {
                                      formik.setFieldValue("nodeDiskSize", v.value, true)
                                     }}
                                     onBlur={formik.handleBlur}
                                     showButtons
                                     buttonLayout="horizontal" incrementButtonIcon="pi pi-plus"
                                     decrementButtonIcon="pi pi-minus" min={1}></InputNumber>
                    </div>
                </div>
                {renderDescription("Common disk size for each node. Storage pool can be selected separately for each node in node properties.")}
            </div>

            {renderSectionHead("Network")}
            <div className="flex mt-3">
                <div className="grow flex flex-col pr-5">
                    <div>
                        <div className="text-stone-400 required">Proxmox network bridge</div>
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
                                     onChange={v=> {
                                         formik.setFieldValue("network.subnetMask", v.value, true)
                                     }}
                                     onBlur={formik.handleBlur}
                                     showButtons
                                     buttonLayout="horizontal" incrementButtonIcon="pi pi-plus"
                                     decrementButtonIcon="pi pi-minus" min={1}></InputNumber>
                    </div>
                    <div className="mt-2">
                        <div className="text-stone-400 required">Gateway</div>
                        <InputText name="network.gateway"
                                   className="w-full p-inputtext-sm"
                                   value={formik.values.network.gateway}
                                   onChange={formik.handleChange}
                                   onBlur={formik.handleBlur}>
                        </InputText>
                    </div>
                    <div className="mt-2">
                        <div className="text-stone-400 required">DNS server</div>
                        <InputText name="network.dnsServer"
                                   className="w-full p-inputtext-sm"
                                   value={formik.values.network.dnsServer}
                                   onChange={formik.handleChange}
                                   onBlur={formik.handleBlur}>
                        </InputText>
                    </div>
                </div>
                {renderDescription("Network settings for all nodes. Node IP address can be selected separately in the node properties.")}
            </div>

        </div>


    return <>
        <form onSubmit={formik.handleSubmit} onReset={formik.handleReset}>
            <div className="font-bold text-2xl flex items-center mt-5">
                <span className="mr-4">Settings</span>
                {isExpanded
                    ? <div className="flex">
                        <div className="mr-2">
                            <Button icon="pi pi-times-circle"
                                    type="reset"
                                    className="p-button-rounded p-button-text p-button-danger"
                                    aria-label="Cancel"/>
                        </div>
                        <Button icon="pi pi-check-circle"
                                type="submit" disabled={!formik.isValid}
                                className="p-button-rounded p-button-text"
                                aria-label="Save"/>
                    </div>
                    : <Button icon="pi pi-pencil"
                              onClick={() => setExpanded(true)}
                              className="p-button-rounded p-button-text"
                              aria-label="Edit"/>
                }

            </div>
            <div className="pb-5">
                {
                    isExpanded
                        ? expandedContent
                        : collapsedContent
                }
            </div>
        </form>
    </>;
};

export default GeneralSettingsSection;