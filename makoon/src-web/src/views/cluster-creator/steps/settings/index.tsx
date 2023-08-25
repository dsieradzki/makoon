import React, {useContext, useEffect, useImperativeHandle, useState} from 'react';
import {Dropdown} from "primereact/dropdown";
import {useFormik} from "formik";
import {SettingsModel} from "@/store/cluster-creator-store";
import {FormikHelpers} from "formik/dist/types";
import * as Yup from "yup";
import {useOnFirstMount} from "@/utils/hooks";
import {apiCall} from "@/utils/api";
import api from "@/api/api";
import {AvailableStorage} from "@/api/model";
import FormError from "@/components/FormError";
import StorageDropdownOption from "@/components/StorageDropdownOption";
import {ClusterCreatorStoreContext, CreatorNavigation, StepProps} from "@/views/cluster-creator/context";
import {observer} from "mobx-react-lite";
import {autorun} from "mobx";


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

const SettingsStep = (props: StepProps, ref: any) => {
    useImperativeHandle(ref, () => ({
        async next(): Promise<void> {
            await formik.submitForm();
            await props.onNext();
        },
        async previous(): Promise<void> {
            await props.onPrevious();
        }
    } as CreatorNavigation));


    const clusterStore = useContext(ClusterCreatorStoreContext)
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


    useEffect(() => {
        props.nextDisabled(!formik.isValid)
        props.previousDisabled(false);
    }, [formik.isValid]);


    useOnFirstMount(async () => {
        setNodes(await apiCall(() => api.nodes.nodes()));
    });
    useEffect(() => {
        autorun(() => {
            if (clusterStore.cluster.node.length > 0) {
                apiCall(() => api.storage.storage(clusterStore.cluster.node, api.storage.StorageContentType.Iso))
                    .then((response) => {
                        setOsImageStorages(response);
                    });
            }
        });
    }, []);

    return (
        <>
            {
                <>
                    <form onSubmit={formik.handleSubmit} onReset={formik.handleReset}>
                        <div className="flex flex-col"
                             style={{backgroundColor: "var(--color-background)"}}>

                            <div className="flex mb-2">
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

                            <div className="flex mb-2">
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
                            <div className="flex mb-2">
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
                            <div className="flex mb-2">
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
            }
        </>
    );
};

export default observer(React.forwardRef(SettingsStep));