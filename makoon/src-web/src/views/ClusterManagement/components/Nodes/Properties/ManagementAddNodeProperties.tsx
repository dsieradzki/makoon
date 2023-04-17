import {InputNumber} from "primereact/inputnumber";
import {InputText} from "primereact/inputtext";
import {Dropdown} from "primereact/dropdown";
import {observer} from "mobx-react-lite";
import {useFormik} from "formik";
import uiPropertiesPanelStore from "@/store/uiPropertiesPanelStore";
import {useOnFirstMount} from "@/utils/hooks";
import React, {useState} from "react";
import * as Yup from 'yup';
import FormError from "@/components/FormError";
import {apiCall} from "@/utils/api";
import {hostnameEnd, hostnameMain, hostnameStart} from "@/utils/patterns";
import {AvailableStorage, ClusterNode, ClusterNodeType} from "@/api/model";
import api from "@/api/api";
import StorageDropdownOption from "@/components/StorageDropdownOption";
import clusterManagementStore from "@/store/clusterManagementStore";
import {Button} from "primereact/button";
import {generateNode} from "@/utils/nodes";

interface NodeFormModel {
    name: string
    vmId: number
    cores: number
    memory: number
    ipAddress: string
    storagePool: string
}

const schema = Yup.object().shape({
    name: Yup.string()
        .required()
        .strict()
        .trim()
        .max(128)
        .matches(hostnameStart, {message: "Name can start with characters: a-z, A-Z, 0-9"})
        .matches(hostnameMain, {message: "Name can contain characters: a-z, A-Z, 0-9, -"})
        .matches(hostnameEnd, {message: "Name can end with characters: a-z, A-Z, 0-9"}),
    vmId: Yup.number().min(100).required(),
    cores: Yup.number().min(1).required(),
    memory: Yup.number().positive().required(),
    ipAddress: Yup.string().min(7).required(),
    storagePool: Yup.string().required()
})
const ManagementAddNodeProperties = () => {
    const [storages, setStorages] = useState<AvailableStorage[]>([])

    useOnFirstMount(async () => {
        setStorages(await apiCall(() => api.storage.storage(clusterManagementStore.cluster.node, api.storage.StorageContentType.Images)))
    })

    const clusterName = clusterManagementStore.cluster.clusterName;
    const generatedNextNode = generateNode(
        clusterManagementStore.cluster.nodes,
        uiPropertiesPanelStore.selectedPropertiesId == "master" ? ClusterNodeType.Master : ClusterNodeType.Worker,
        {
            cores: 2,
            ipAddress: "",
            memory: 2048,
            name: "master-1",
            nodeType: ClusterNodeType.Master,
            storagePool: "",
            vmId: 100
        } as ClusterNode);
    const formik = useFormik({
        validateOnMount: true,
        validationSchema: schema,
        initialValues: {
            vmId: generatedNextNode.vmId,
            name: generatedNextNode.name,
            cores: generatedNextNode.cores,
            memory: generatedNextNode.memory,
            ipAddress: generatedNextNode.ipAddress,
            storagePool: generatedNextNode.storagePool,
        } as NodeFormModel,

        onSubmit: async (values, formikHelpers) => {
            if (uiPropertiesPanelStore.selectedPropertiesId) {
                let nodeToAdd = {
                    vmId: values.vmId,
                    name: values.name,
                    cores: values.cores,
                    memory: values.memory,
                    ipAddress: values.ipAddress,
                    storagePool: values.storagePool,
                    nodeType: uiPropertiesPanelStore.selectedPropertiesId == "master" ? ClusterNodeType.Master : ClusterNodeType.Worker
                } as ClusterNode;

                await api.clusters.addNodeToCluster(clusterName, nodeToAdd);
                clusterManagementStore.cluster.nodes.push(nodeToAdd)
                formik.resetForm()
                uiPropertiesPanelStore.hidePanel()
            } else {
                console.error("cannot save node because selected node is null, this shouldn't happen")
            }
            formikHelpers.setSubmitting(false);
        }
    })

    return <form onSubmit={formik.handleSubmit}>
        <div className="flex flex-col w-full h-full items-center">
            <div className="grow w-full">
                <div className="text-3xl text-center font-bold mt-5">Add Node</div>
                <div className="p-10">
                    <div>
                        <div className="text-stone-400 required">VM id</div>
                        <InputNumber name="vmId"
                                     value={formik.values.vmId}
                                     onChange={v => {
                                         formik.setFieldValue("vmId", v.value, true)
                                     }}
                                     onBlur={formik.handleBlur}
                                     className="w-full p-inputtext-sm" showButtons buttonLayout="horizontal"
                                     incrementButtonIcon="pi pi-plus" decrementButtonIcon="pi pi-minus"></InputNumber>
                        <FormError error={formik.errors.vmId} touched={formik.touched.vmId}/>
                    </div>

                    <div className="mt-3">
                        <div className="text-stone-400 required">Node name</div>
                        <div className="flex items-center">
                            <div className="text-stone-400 font-bold nowrap whitespace-nowrap">{clusterName}<span
                                className="mx-1">-</span></div>
                            <InputText name="name"
                                       value={formik.values.name}
                                       onChange={formik.handleChange}
                                       onBlur={formik.handleBlur}
                                       className="w-full p-inputtext-sm ml-1"></InputText>
                            <FormError error={formik.errors.name} touched={formik.touched.name}/>
                        </div>
                    </div>

                    <div className="mt-3">
                        <div className="text-stone-400 required">IP address</div>
                        <InputText name="ipAddress"
                                   value={formik.values.ipAddress}
                                   onChange={formik.handleChange}
                                   onBlur={formik.handleBlur}
                                   className="w-full p-inputtext-sm"></InputText>
                        <FormError error={formik.errors.ipAddress} touched={formik.touched.ipAddress}/>
                    </div>

                    <div className="mt-3">
                        <div className="text-stone-400 required">Storage pool</div>
                        <Dropdown name="storagePool"
                                  value={formik.values.storagePool}
                                  onChange={formik.handleChange}
                                  options={storages}
                                  optionValue={"storage"}
                                  optionLabel={"storage"}
                                  itemTemplate={StorageDropdownOption}
                                  className="w-full"/>
                        <FormError error={formik.errors.storagePool} touched={formik.touched.storagePool}/>
                    </div>

                    <div className="border-t-2 border-stone-800 text-xl mt-10 mb-3">
                        Resources
                    </div>
                    <div className="mt-3">
                        <div className="text-stone-400 required">CPU cores</div>
                        <InputNumber name="cores"
                                     value={formik.values.cores}
                                     onChange={v => {
                                         formik.setFieldValue("cores", v.value, true)
                                     }}
                                     onBlur={formik.handleBlur}
                                     className="w-full p-inputtext-sm" showButtons
                                     buttonLayout="horizontal"
                                     incrementButtonIcon="pi pi-plus" decrementButtonIcon="pi pi-minus" min={1}>
                        </InputNumber>
                        <FormError error={formik.errors.cores} touched={formik.touched.cores}/>
                    </div>
                    <div className="mt-3">
                        <div className="text-stone-400 required">Memory (MB)</div>
                        <InputNumber name="memory"
                                     value={formik.values.memory}
                                     onChange={v => {
                                         formik.setFieldValue("memory", v.value, true)
                                     }}
                                     onBlur={formik.handleBlur}
                                     className="w-full p-inputtext-sm" showButtons
                                     buttonLayout="horizontal"
                                     incrementButtonIcon="pi pi-plus" decrementButtonIcon="pi pi-minus" step={1024}
                                     min={0}></InputNumber>
                        <FormError error={formik.errors.memory} touched={formik.touched.memory}/>
                    </div>
                    <div className="mt-10 flex flex-col items-center">
                        <div className="flex justify-center items-center">
                            <div className="mr-5">
                                <Button disabled={!formik.isValid} type="submit" label="ADD"
                                        className="p-button-primary"/>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    </form>
}


export default observer(ManagementAddNodeProperties)