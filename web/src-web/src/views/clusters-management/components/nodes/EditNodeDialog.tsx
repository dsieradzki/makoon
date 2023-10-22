import {Dialog} from "primereact/dialog";
import React, {useEffect, useState} from "react";
import * as Yup from "yup";
import {AvailableStorage, ClusterState, ClusterStatus} from "@/api/model";
import {useOnFirstMount} from "@/utils/hooks";
import {apiCall} from "@/utils/api";
import api from "@/api/api";
import clusterManagementStore from "@/store/cluster-management-store";
import {useFormik} from "formik";
import {InputNumber} from "primereact/inputnumber";
import FormError from "@/components/FormError";
import {InputText} from "primereact/inputtext";
import {Dropdown} from "primereact/dropdown";
import StorageDropdownOption from "@/components/StorageDropdownOption";
import {Button} from "primereact/button";
import Section from "@/components/Section";
import {observer} from "mobx-react-lite";
import {computed} from "mobx";
import {} from "@/views/clusters-management/components/nodes/AddNodeDialog";
import {schemaAddNode} from "@/views/cluster-creator/steps/nodes/CreatorNodeDialog";

type Props = {
    setVisible: (s: boolean) => void;
    vmId: string;
}

interface NodeFormModel {
    name: string
    vmId: number
    cores: number
    memory: number
    ipAddress: string
    storagePool: string
}

const EditNodeDialog = (props: Props) => {
    const [storages, setStorages] = useState<AvailableStorage[]>([])

    useOnFirstMount(async () => {
        setStorages(await apiCall(() => api.storage.storage(clusterManagementStore.cluster.node, api.storage.StorageContentType.Images)))
    })

    const stored = clusterManagementStore.cluster.nodes
        .find((v) => v.vmId.toString() == props.vmId);

    useEffect(() => {
        if (!stored) {
            props.setVisible(false);
        }
    }, [stored])

    const formik = useFormik({
        validateOnMount: true,
        validationSchema: schemaAddNode,
        initialValues: {
            vmId: stored?.vmId,
            name: stored?.name,
            cores: stored?.cores,
            memory: stored?.memory,
            ipAddress: stored?.ipAddress,
            storagePool: stored?.storagePool,
        } as NodeFormModel,

        onSubmit: async (values, formikHelpers) => {
            if ((values.cores != stored?.cores || values.memory != stored?.memory) && stored?.name) {
                await clusterManagementStore.changeNodeResources(stored.name, values.cores, values.memory);
            }
            formik.resetForm()
            formikHelpers.setSubmitting(false);
            props.setVisible(false);
        }
    })

    const [deleteNodeConfirm, setDeleteNodeConfirm] = useState(false);


    const nodeBlocked = computed(() => {
        return (!!stored?.lock) || clusterManagementStore.cluster.status?.state != ClusterState.Sync;
    });

    const cannotDelete = computed(() => {
        return clusterManagementStore.cluster.nodes.filter(i => !i.lock).length < 2 || nodeBlocked.get();
    });

    return <Dialog header="Edit node"
                   visible modal draggable={false} closable
                   onHide={() => props.setVisible(false)}
                   footer={<div className="flex justify-between">
                       <div>

                           <Button
                               disabled={cannotDelete.get()}
                               type="button"
                               onClick={() => {
                                   setDeleteNodeConfirm(true);
                               }}
                               label="Delete"
                               className="p-button-danger" outlined={true}/>
                       </div>
                       <div>
                           <Button type="button"
                                   onClick={() => {
                                       props.setVisible(false);
                                   }}
                                   label="Cancel"
                                   className="p-button-link"/>
                           <Button disabled={!formik.isValid || nodeBlocked.get()} type="button"
                                   onClick={formik.submitForm}
                                   label="Update"
                                   className="p-button-primary"/>
                       </div>
                   </div>}>
        <form onSubmit={formik.handleSubmit} className="px-6 pt-6 flex">

            <Dialog
                header="Confirmation"
                footer={
                    <div>
                        <Button label="No" className="p-button-text" icon="pi pi-times"
                                onClick={() => {
                                    setDeleteNodeConfirm(false)
                                }}/>
                        <Button label="Yes" icon="pi pi-check"
                                onClick={async () => {
                                    if (!stored?.name) {
                                        return
                                    }
                                    await clusterManagementStore.deleteNodeFromCluster(stored.name);
                                    setDeleteNodeConfirm(false);
                                    props.setVisible(false);
                                }}/>
                    </div>}
                modal
                draggable={false}
                visible={deleteNodeConfirm}
                onHide={() => {
                    setDeleteNodeConfirm(false);
                }}>
                <div className="mt-4 text-xl">Do you want to delete node?</div>
            </Dialog>


            <Section title="Settings">
                <div>
                    <div className="text-stone-400 required">VM id</div>
                    <InputNumber name="vmId"
                                 readOnly={true}
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
                               readOnly={true}
                               value={formik.values.name}
                               onChange={formik.handleChange}
                               onBlur={formik.handleBlur}
                               className="w-full p-inputtext-sm ml-1"></InputText>
                    <FormError error={formik.errors.name} touched={formik.touched.name}/>
                </div>

                <div className="mt-2">
                    <div className="text-stone-400 required">IP address</div>
                    <InputText name="ipAddress"
                               readOnly={true}
                               value={formik.values.ipAddress}
                               onChange={formik.handleChange}
                               onBlur={formik.handleBlur}
                               className="w-full p-inputtext-sm"></InputText>
                    <FormError error={formik.errors.ipAddress} touched={formik.touched.ipAddress}/>
                </div>

                <div>
                    <div className="text-stone-400 required">Storage pool</div>
                    <Dropdown name="storagePool"
                              readOnly={true}
                              disabled={true}
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

export default observer(EditNodeDialog);