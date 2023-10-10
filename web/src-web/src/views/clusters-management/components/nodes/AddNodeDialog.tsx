import {Dialog} from "primereact/dialog";
import React, {useState} from "react";
import * as Yup from "yup";
import {hostnameEnd, hostnameMain, hostnameStart} from "@/utils/patterns";
import {AvailableStorage, ClusterNode, ClusterNodeType} from "@/api/model";
import {useOnFirstMount} from "@/utils/hooks";
import {apiCall} from "@/utils/api";
import api from "@/api/api";
import clusterManagementStore from "@/store/cluster-management-store";
import {generateNode} from "@/utils/nodes";
import {useFormik} from "formik";
import {InputNumber} from "primereact/inputnumber";
import FormError from "@/components/FormError";
import {InputText} from "primereact/inputtext";
import {Dropdown} from "primereact/dropdown";
import StorageDropdownOption from "@/components/StorageDropdownOption";
import {Button} from "primereact/button";
import Section from "@/components/Section";
import {observer} from "mobx-react-lite";

type Props = {
    setVisible: (s: boolean) => void;
    nodeType: ClusterNodeType;
}

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
const AddNodeDialog = (props: Props) => {
    const [storages, setStorages] = useState<AvailableStorage[]>([])

    useOnFirstMount(async () => {
        setStorages(await apiCall(() => api.storage.storage(clusterManagementStore.cluster.node, api.storage.StorageContentType.Images)))
    })

    const generatedNextNode = generateNode(
        clusterManagementStore.cluster.nodes,
        props.nodeType,
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
            let nodeToAdd = {
                vmId: values.vmId,
                name: values.name,
                cores: values.cores,
                memory: values.memory,
                ipAddress: values.ipAddress,
                storagePool: values.storagePool,
                nodeType: props.nodeType
            } as ClusterNode;
            await clusterManagementStore.addNodeToCluster(nodeToAdd);
            formik.resetForm()
            formikHelpers.setSubmitting(false);
            props.setVisible(false);
        }
    })

    return <Dialog header="New node"
                   visible modal draggable={false} closable
                   onHide={() => props.setVisible(false)}
                   footer={<div>
                       <Button type="button"
                               onClick={() => {
                                   props.setVisible(false);
                               }}
                               label="Cancel"
                               className="p-button-link"/>
                       <Button disabled={!formik.isValid} type="button"
                               onClick={formik.submitForm}
                               label="Create"
                               className="p-button-primary"/>
                   </div>}>
        <form onSubmit={formik.handleSubmit} className="px-6 pt-6 flex">
            <Section title="Settings">
                <div>
                    <div className="text-stone-400 required">VM id</div>
                    <InputNumber name="vmId"
                                 value={formik.values.vmId}
                                 onChange={v => {
                                     formik.setFieldValue("vmId", v.value, true)
                                 }}
                                 onBlur={formik.handleBlur}
                                 className="w-full p-inputtext-sm" showButtons></InputNumber>
                    <FormError error={formik.errors.vmId} touched={formik.touched.vmId}/>
                </div>

                <div className="mt-2">
                    <div className="text-stone-400 required">Node name</div>
                    <InputText name="name"
                               value={formik.values.name}
                               onChange={formik.handleChange}
                               onBlur={formik.handleBlur}
                               className="w-full p-inputtext-sm ml-1"></InputText>
                    <FormError error={formik.errors.name} touched={formik.touched.name}/>
                </div>

                <div className="mt-2">
                    <div className="text-stone-400 required">IP address</div>
                    <InputText name="ipAddress"
                               value={formik.values.ipAddress}
                               onChange={formik.handleChange}
                               onBlur={formik.handleBlur}
                               className="w-full p-inputtext-sm"></InputText>
                    <FormError error={formik.errors.ipAddress} touched={formik.touched.ipAddress}/>
                </div>

                <div>
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

            </Section>
            <span className="border-r border-bg rounded-full mx-8 w-[0px]"></span>
            <Section title="Resources">
                <div className="mt-3">
                    <div className="text-stone-400 required">CPU cores</div>
                    <InputNumber name="cores"
                                 value={formik.values.cores}
                                 onChange={v => {
                                     formik.setFieldValue("cores", v.value, true)
                                 }}
                                 onBlur={formik.handleBlur}
                                 className="w-full p-inputtext-sm" showButtons min={1}>
                    </InputNumber>
                    <FormError error={formik.errors.cores} touched={formik.touched.cores}/>
                </div>
                <div className="mt-3">
                    <div className="text-stone-400 required">Memory (MiB)</div>
                    <InputNumber name="memory"
                                 value={formik.values.memory}
                                 onChange={v => {
                                     formik.setFieldValue("memory", v.value, true)
                                 }}
                                 onBlur={formik.handleBlur}
                                 className="w-full p-inputtext-sm" showButtons
                                 step={1024}
                                 min={0}></InputNumber>
                    <FormError error={formik.errors.memory} touched={formik.touched.memory}/>
                </div>
            </Section>
        </form>
    </Dialog>
}

export default observer(AddNodeDialog);