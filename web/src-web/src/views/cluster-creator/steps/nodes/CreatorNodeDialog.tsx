import { Dialog } from "primereact/dialog";
import React, { useContext, useEffect, useState } from "react";
import * as Yup from "yup";
import { hostnameEnd, hostnameMain, hostnameStart } from "@/utils/patterns";
import { AvailableStorage, ClusterNode, ClusterNodeType } from "@/api/model";
import { useOnFirstMount } from "@/utils/hooks";
import { apiCall } from "@/utils/api";
import api from "@/api/api";
import { useFormik } from "formik";
import { InputNumber } from "primereact/inputnumber";
import FormError from "@/components/FormError";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import StorageDropdownOption from "@/components/StorageDropdownOption";
import { Button } from "primereact/button";
import Section from "@/components/Section";
import { observer } from "mobx-react-lite";
import { ClusterCreatorStoreContext } from "@/views/cluster-creator/context";
import { computed } from "mobx";
import { InputSwitch } from 'primereact/inputswitch';

type Props = {
    onClose: () => void;
    nodeType: ClusterNodeType;
    nodeId?: string | null
}

interface NodeFormModel {
    name: string
    vmId: number
    cores: number
    memory: number
    ipAddress: string
    vlan: number | null
    storagePool: string
}

export const schemaAddNode = Yup.object().shape({
    name: Yup.string()
        .required("Node name is required")
        .strict()
        .trim()
        .max(128, "Name length must be at most 128 characters")
        .matches(hostnameStart, { message: "Name can start with characters: a-z, A-Z, 0-9" })
        .matches(hostnameMain, { message: "Name can contain characters: a-z, A-Z, 0-9, -" })
        .matches(hostnameEnd, { message: "Name can end with characters: a-z, A-Z, 0-9" }),
    vmId: Yup.number()
        .min(100, "VM id must be greater than or equal to 100")
        .max(4294967296, "VM id must be lower or equal to 4 294 967 296")
        .required("VM id is required"),
    cores: Yup.number()
        .min(1, "At least one core is required")
        .max(4096, "You can allocate maximum 4096 cores")
        .required("Cores are required"),
    memory: Yup.number()
        .positive("Memory size has to be at least 1 MiB")
        .required("Memory size is required"),
    ipAddress: Yup.string()
        .min(7, "IP address has to have at least 7 characters")
        .required("IP address is required"),
    vlan: Yup.number()
        .min(1, "Min VLAN number is 1")
        .max(4094, "Max VLAN number is 4094")
        .notRequired(),
    storagePool: Yup.string()
        .required("Storage pool is required")
})
const AddNodeDialog = (props: Props) => {

    const creatorStore = useContext(ClusterCreatorStoreContext);
    const [storages, setStorages] = useState<AvailableStorage[]>([]);
    const [showAdvanded, setShowAdvanced] = useState(false);

    useOnFirstMount(async () => {
        setStorages(await apiCall(() => api.storage.storage(creatorStore.cluster.node, api.storage.StorageContentType.Images)))
    })


    const storedNode = computed(() => {
        if (props.nodeId) {
            return creatorStore.findNode(Number(props.nodeId))
        } else {
            return null
        }
    })
    useEffect(() => {
        if (formik.values.vlan != null) {
            setShowAdvanced(true);
        }
    }, [storedNode]);

    const formik = useFormik({
        validateOnMount: true,
        validationSchema: schemaAddNode,
        initialValues: {
            vmId: storedNode.get()?.vmId,
            name: storedNode.get()?.name,
            cores: storedNode.get()?.cores,
            memory: storedNode.get()?.memory,
            ipAddress: storedNode.get()?.ipAddress,
            vlan: storedNode.get()?.vlan,
            storagePool: storedNode.get()?.storagePool
        } as NodeFormModel,

        onSubmit: async (values, _formikHelpers) => {
            if (props.nodeId) {
                creatorStore.updateNode(
                    Number(props.nodeId),
                    {
                        vmId: values.vmId,
                        name: values.name,
                        cores: values.cores,
                        memory: values.memory,
                        ipAddress: values.ipAddress,
                        vlan: values.vlan,
                        storagePool: values.storagePool,
                        nodeType: storedNode.get()?.nodeType
                    } as ClusterNode)
                formik.resetForm()
                props.onClose();
            } else {
                console.error("cannot save node because selected node is null, this shouldn't happen")
            }
        }
    })

    const canBeDeleted = () => {
        if (creatorStore.findNode(Number(props.nodeId))?.nodeType === "master") {
            return creatorStore.masterNodes.length > 1;
        } else {
            return true;
        }
    }
    const onDelete = () => {
        if (props.nodeId) {
            props.onClose();
            creatorStore.deleteNode(Number(props.nodeId))
        }
    }
    return <Dialog header={props.nodeId ? "Edit node" : "New node"}
        visible modal draggable={false} closable
        onHide={props.onClose}
        footer={
            <div className="flex justify-between">
                <div>
                    <div className="h-full flex items-center mr-2">
                        <InputSwitch checked={showAdvanded} onChange={(e) => {
                            const val = e.value ?? false;
                            if (!val) {
                                formik.setFieldValue("vlan", null, true)
                            }
                            setShowAdvanced(val);
                        }} />
                        <div className="ml-2">Advanced</div>
                    </div>
                    {
                        canBeDeleted() &&
                        <Button
                            type="button"
                            onClick={onDelete}
                            className="p-button-raised p-button-danger p-button-text">
                            Delete
                        </Button>
                    }
                </div>
                <div className="flex">
                    <div>
                        <Button type="button"
                            onClick={props.onClose}
                            label="Cancel"
                            className="p-button-link" />
                        <Button disabled={!formik.isValid} type="button"
                            onClick={formik.submitForm}
                            label="Save"
                            className="p-button-primary" />
                    </div>
                </div>
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
                    <FormError error={formik.errors.vmId} touched={formik.touched.vmId} />
                </div>

                <div className="mt-2">
                    <div className="text-stone-400 required">Node name</div>
                    <InputText name="name"
                        value={formik.values.name}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className="w-full p-inputtext-sm ml-1"></InputText>
                    <FormError error={formik.errors.name} touched={formik.touched.name} />
                </div>

                <div className="mt-2">
                    <div className="text-stone-400 required">IP address</div>
                    <InputText name="ipAddress"
                        value={formik.values.ipAddress}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className="w-full p-inputtext-sm"></InputText>
                    <FormError error={formik.errors.ipAddress} touched={formik.touched.ipAddress} />
                </div>
                {showAdvanded
                    ? <div className="mt-2">
                        <div className="text-stone-400">VLAN Tag</div>
                        <InputNumber name="vlan"
                            value={formik.values.vlan}
                            onChange={v => {
                                formik.setFieldValue("vlan", v.value, true)
                            }}
                            onBlur={formik.handleBlur}
                            className="w-full p-inputtext-sm" showButtons></InputNumber>
                        <FormError error={formik.errors.vlan} touched={formik.touched.vlan} />
                    </div>
                    : null
                }
                <div>
                    <div className="text-stone-400 required">Storage pool</div>
                    <Dropdown name="storagePool"
                        value={formik.values.storagePool}
                        onChange={formik.handleChange}
                        options={storages}
                        optionValue={"storage"}
                        optionLabel={"storage"}
                        itemTemplate={StorageDropdownOption}
                        className="w-full" />
                    <FormError error={formik.errors.storagePool} touched={formik.touched.storagePool} />
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
                    <FormError error={formik.errors.cores} touched={formik.touched.cores} />
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
                    <FormError error={formik.errors.memory} touched={formik.touched.memory} />
                </div>
            </Section>
        </form>
    </Dialog>
}

export default observer(AddNodeDialog);
