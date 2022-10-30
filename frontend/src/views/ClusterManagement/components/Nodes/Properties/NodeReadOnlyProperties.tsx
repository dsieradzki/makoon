import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { observer } from "mobx-react-lite";
import { useFormik } from "formik";
import uiPropertiesPanelStore from "@/store/uiPropertiesPanelStore";
import { LogError } from "@wails-runtime/runtime";
import { computed } from "mobx";
import { useOnFirstMount } from "@/utils/hooks";
import { GetStorage } from "@wails/provisioner/Service";
import { useState } from "react";
import * as Yup from 'yup';
import FormError from "@/components/FormError";
import clusterManagementStore from "@/store/clusterManagementStore";
import { apiCall } from "@/utils/api";

interface NodeFormModel {
    name: string
    vmid: number
    cores: number
    memory: number
    ipAddress: string
    storagePool: string
}

const schema = Yup.object().shape({
    name: Yup.string().required(),
    vmid: Yup.number().min(100).required(),
    cores: Yup.number().min(1).required(),
    memory: Yup.number().positive().required(),
    ipAddress: Yup.string().min(7).required(),
    storagePool: Yup.string().required()
})
const NodeReadOnlyProperties = () => {

    const [storages, setStorages] = useState([] as string[])

    useOnFirstMount(async () => {
        setStorages(await apiCall(() => GetStorage()))
    })

    const storedNode = computed(() => {
        if (uiPropertiesPanelStore.selectedPropertiesId) {
            return clusterManagementStore.findNode(Number(uiPropertiesPanelStore.selectedPropertiesId))
        } else {
            LogError("cannot delete node because selected node is null, this shouldn't happen")
            return null
        }
    })

    const formik = useFormik({
        validationSchema: schema,
        initialValues: {
            vmid: storedNode.get()?.vmid,
            name: storedNode.get()?.name,
            cores: storedNode.get()?.cores,
            memory: storedNode.get()?.memory,
            ipAddress: storedNode.get()?.ipAddress,
            storagePool: storedNode.get()?.storagePool
        } as NodeFormModel,

        onSubmit: (values, formikHelpers) => {
        }
    })

    return <form onSubmit={formik.handleSubmit}>
        <div className="flex flex-col w-full h-full items-center">
            <div className="grow w-full">
                <div className="text-3xl text-center font-bold mt-5">Node Properties</div>
                <div className="p-10">
                    <div>
                        <div className="text-stone-400 required">VM id</div>
                        <InputNumber name="vmid"
                                     value={formik.values.vmid}
                                     readOnly={true}
                                     disabled={true}
                            // onChange={v=> {
                            //     formik.setFieldValue("vmid", v.value, true)
                            // }}
                            // onBlur={formik.handleBlur}
                                     className="w-full p-inputtext-sm" showButtons buttonLayout="horizontal"
                                     incrementButtonIcon="pi pi-plus" decrementButtonIcon="pi pi-minus"
                                     min={100}></InputNumber>
                        <FormError error={formik.errors.vmid} touched={formik.touched.vmid}/>
                    </div>

                    <div className="mt-3">
                        <div className="text-stone-400 required">Node name</div>
                        <InputText name="name"
                                   value={formik.values.name}
                                   readOnly={true}
                                   disabled={true}
                            // onChange={formik.handleChange}
                            // onBlur={formik.handleBlur}
                                   className="w-full p-inputtext-sm"></InputText>
                        <FormError error={formik.errors.name} touched={formik.touched.name}/>
                    </div>

                    <div className="mt-3">
                        <div className="text-stone-400 required">IP address</div>
                        <InputText name="ipAddress"
                                   readOnly={true}
                                   disabled={true}
                                   value={formik.values.ipAddress}
                            // onChange={formik.handleChange}
                            // onBlur={formik.handleBlur}
                                   className="w-full p-inputtext-sm"></InputText>
                        <FormError error={formik.errors.ipAddress} touched={formik.touched.ipAddress}/>
                    </div>

                    <div className="mt-3">
                        <div className="text-stone-400 required">Storage pool</div>
                        <Dropdown name="storagePool"
                                  readOnly={true}
                                  disabled={true}
                                  value={formik.values.storagePool}
                            // onChange={formik.handleChange}
                                  options={storages}
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
                                     readOnly={true}
                                     disabled={true}
                            // onChange={v=> {
                            //     formik.setFieldValue("cores", v.value, true)
                            // }}
                            // onBlur={formik.handleBlur}
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
                                     readOnly={true}
                                     disabled={true}
                            // onChange={v=> {
                            //     formik.setFieldValue("memory", v.value, true)
                            // }}
                            // onBlur={formik.handleBlur}
                                     className="w-full p-inputtext-sm" showButtons
                                     buttonLayout="horizontal"
                                     incrementButtonIcon="pi pi-plus" decrementButtonIcon="pi pi-minus" step={1024}
                                     min={0}></InputNumber>
                        <FormError error={formik.errors.memory} touched={formik.touched.memory}/>
                    </div>


                    <div className="mt-10 flex flex-col items-center">
                        <div className="flex justify-center items-center">
                            <Button onClick={() => uiPropertiesPanelStore.hidePanel()}
                                    type="button"
                                    label="Close"
                                    className="p-button-primary"/>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    </form>
}


export default observer(NodeReadOnlyProperties)