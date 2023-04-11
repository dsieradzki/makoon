import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { observer } from "mobx-react-lite";
import { useFormik } from "formik";
import uiPropertiesPanelStore from "@/store/uiPropertiesPanelStore";
import { computed } from "mobx";
import { useOnFirstMount } from "@/utils/hooks";
import React, { useContext, useState } from "react";
import * as Yup from 'yup';
import FormError from "@/components/FormError";
import { ClusterWizardStoreContext } from "@/views/ClusterWizard/ClusterWizardView";
import { apiCall } from "@/utils/api";
import { hostnameEnd, hostnameMain, hostnameStart } from "@/utils/patterns";
import { AvailableStorage, ClusterNode } from "@/api/model";
import api from "@/api/api";
import { toHumanReadableSize } from "@/utils/size";
import StorageDropdownOption from "@/components/StorageDropdownOption";

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
const NodeProperties = () => {
    const clusterStore = useContext(ClusterWizardStoreContext)
    const [storages, setStorages] = useState<AvailableStorage[]>([])

    useOnFirstMount(async () => {
        setStorages(await apiCall(() => api.storage.storage(clusterStore.cluster.node, api.storage.StorageContentType.Images)))
    })

    const storedNode = computed(() => {
        if (uiPropertiesPanelStore.selectedPropertiesId) {
            return clusterStore.findNode(Number(uiPropertiesPanelStore.selectedPropertiesId))
        } else {
            return null
        }
    })

    const clusterName = clusterStore.cluster.clusterName;

    const formik = useFormik({
        validateOnMount: true,
        validationSchema: schema,
        initialValues: {
            vmId: storedNode.get()?.vmId,
            name: storedNode.get()?.name,
            cores: storedNode.get()?.cores,
            memory: storedNode.get()?.memory,
            ipAddress: storedNode.get()?.ipAddress,
            storagePool: storedNode.get()?.storagePool
        } as NodeFormModel,

        onSubmit: (values, formikHelpers) => {
            if (uiPropertiesPanelStore.selectedPropertiesId) {
                clusterStore.updateNode(
                    Number(uiPropertiesPanelStore.selectedPropertiesId),
                    {
                        vmId: values.vmId,
                        name: values.name,
                        cores: values.cores,
                        memory: values.memory,
                        ipAddress: values.ipAddress,
                        storagePool: values.storagePool,
                        nodeType: storedNode.get()?.nodeType
                    } as ClusterNode)
                formik.resetForm()
                uiPropertiesPanelStore.hidePanel()
            } else {
                console.error("cannot save node because selected node is null, this shouldn't happen")
            }
        }
    })

    const canBeDeleted = () => {
        if (clusterStore.findNode(Number(uiPropertiesPanelStore.selectedPropertiesId))?.nodeType === "master") {
            return clusterStore.masterNodes.length > 1;
        } else {
            return true;
        }
    }
    const onDelete = () => {
        if (uiPropertiesPanelStore.selectedPropertiesId) {
            const id = uiPropertiesPanelStore.selectedPropertiesId;
            uiPropertiesPanelStore.hidePanel()
            clusterStore.deleteNode(Number(id))
        }
    }

    return <form onSubmit={formik.handleSubmit}>
        <div className="flex flex-col w-full h-full items-center">
            <div className="grow w-full">
                <div className="text-3xl text-center font-bold mt-5">Node Properties</div>
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
                            <div className="text-stone-400 font-bold">{clusterName}<span className="mx-1">-</span></div>
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
                                <Button disabled={!formik.isValid} type="submit" label="SAVE"
                                        className="p-button-primary"/>
                            </div>
                            <Button onClick={onDelete}
                                    disabled={!canBeDeleted()}
                                    label="Delete"
                                    className="p-button-raised p-button-danger p-button-text"/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </form>
}


export default observer(NodeProperties)