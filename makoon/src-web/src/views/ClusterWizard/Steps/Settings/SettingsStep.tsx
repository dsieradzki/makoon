import React, { useContext, useState } from 'react';
import WizardNavigator from "@/views/ClusterWizard/WizardNavigator";
import FormError from "@/components/FormError";
import { Dropdown } from "primereact/dropdown";
import { useFormik } from "formik";
import { SettingsModel } from "@/store/clusterWizardStore";
import { FormikHelpers } from "formik/dist/types";
import * as Yup from "yup";
import { ClusterWizardStoreContext } from "@/views/ClusterWizard/ClusterWizardView";
import { useOnFirstMount } from "@/utils/hooks";
import { apiCall } from "@/utils/api";
import api from "@/api/api";
import { AvailableStorage } from "@/api/model";
import StorageDropdownOption from "@/components/StorageDropdownOption";


const renderSectionHead = (name: string) => {
    return <div className="text-xl my-3">
        {name}
    </div>
}

const renderDescription = (description: string) => {
    return <div className="min-w-[40%] max-w-[40%]">
        <div className="font-bold">Description:</div>
        <div>{description}</div>
    </div>
}

type OsImageSource = {
    name: string,
    url: string
}
const SettingsStep = () => {
    const clusterStore = useContext(ClusterWizardStoreContext)
    const storedModel = clusterStore.settings;
    const [nodes, setNodes] = useState<string[]>([]);
    const [osImages, setOsImages] = useState<OsImageSource[]>([
        // {
        //     name: "Ubuntu Server 22.04 LTS - jammy-server-cloudimg-amd64.img ",
        //     url: "https://cloud-images.ubuntu.com/jammy/current/jammy-server-cloudimg-amd64.img"
        // },
        {
            name: "Ubuntu Server 22.10 - kinetic-server-cloudimg-amd64.img",
            url: "https://cloud-images.ubuntu.com/kinetic/current/kinetic-server-cloudimg-amd64.img"
        }
    ]);
    const [kubeVersions, setKubeVersions] = useState<string[]>([
        "1.24/stable",
        // "1.25/stable"
    ]);
    const [osImageStorages, setOsImageStorages] = useState<AvailableStorage[]>([]);


    const schema = Yup.object().shape({
        node: Yup.string().required().strict().trim(),
        osImage: Yup.string().required().strict().trim(),
        osImageStorage: Yup.string().required().strict().trim(),
        kubeVersion: Yup.string().required().strict().trim()
    });
    const formik = useFormik<SettingsModel>({
        validateOnMount: true,
        initialValues: storedModel,
        validationSchema: schema,
        enableReinitialize: true,
        onSubmit: async (values: SettingsModel, formikHelpers: FormikHelpers<any>) => {
            clusterStore.updateSettings(values)
            formikHelpers.resetForm()
        },
        onReset: (_: SettingsModel, formikHelpers: FormikHelpers<any>) => {
        }
    })
    useOnFirstMount(async () => {
        setNodes(await apiCall(() => api.nodes.nodes()));
        if (formik.values.node?.length > 0) {
            setOsImageStorages(await apiCall(() => api.storage.storage(clusterStore.cluster.node, api.storage.StorageContentType.Iso)))
        }
    });
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

                    <div className="flex mt-3 mb-4">
                        <div className="grow flex flex-col pr-5">
                            <div className="text-stone-400 required">Proxmox node</div>
                            <Dropdown name="node"
                                      className="w-full"
                                      value={formik.values.node}
                                      onChange={async (e) => {
                                          formik.handleChange(e);
                                          setOsImageStorages(await apiCall(() => api.storage.storage(e.target.value, api.storage.StorageContentType.Iso)))
                                      }}
                                      options={nodes}/>

                            <FormError error={formik.errors.node} touched={formik.touched.node}/>
                        </div>
                        {renderDescription("Select Proxmox node where cluster will be created")}
                    </div>

                    <div className="flex mt-3 mb-4">
                        <div className="grow flex flex-col pr-5">
                            <div className="text-stone-400 required">OS image</div>
                            <Dropdown name="osImage"
                                      className="w-full"
                                      value={formik.values.osImage}
                                      onChange={formik.handleChange}
                                      optionLabel={"name"}
                                      optionValue={"url"}
                                      options={osImages}/>

                            <FormError error={formik.errors.osImage} touched={formik.touched.osImage}/>
                        </div>
                        {renderDescription("Ubuntu Cloud image for Kubernetes node")}
                    </div>
                    <div className="flex mt-3 mb-4">
                        <div className="grow flex flex-col pr-5">
                            <div className="text-stone-400 required">OS image storage</div>
                            <Dropdown name="osImageStorage"
                                      className="w-full"
                                      value={formik.values.osImageStorage}
                                      onChange={formik.handleChange}
                                      options={osImageStorages}
                                      optionValue={"storage"}
                                      optionLabel={"storage"}
                                      itemTemplate={StorageDropdownOption}/>

                            <FormError error={formik.errors.osImageStorage} touched={formik.touched.osImageStorage}/>
                        </div>
                        {renderDescription("Proxmox storage where to save OS image")}
                    </div>
                    <div className="flex mt-3 mb-4">
                        <div className="grow flex flex-col pr-5">
                            <div className="text-stone-400 required">MicroK8S version</div>
                            <Dropdown name="kubeVersion"
                                      className="w-full"
                                      value={formik.values.kubeVersion}
                                      onChange={formik.handleChange}
                                      options={kubeVersions}/>

                            <FormError error={formik.errors.kubeVersion} touched={formik.touched.kubeVersion}/>
                        </div>
                        {renderDescription("MicroK8S Kubernetes version")}
                    </div>

                </div>
            </form>
        </>
    );
};

export default SettingsStep;