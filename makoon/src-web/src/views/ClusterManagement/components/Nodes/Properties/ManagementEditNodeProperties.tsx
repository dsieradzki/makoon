import {InputNumber} from "primereact/inputnumber";
import {InputText} from "primereact/inputtext";
import {Dropdown} from "primereact/dropdown";
import {Button} from "primereact/button";
import {observer} from "mobx-react-lite";
import {useFormik} from "formik";
import uiPropertiesPanelStore from "@/store/uiPropertiesPanelStore";
import {computed} from "mobx";
import {useOnFirstMount} from "@/utils/hooks";
import React, {useState} from "react";
import * as Yup from 'yup';
import FormError from "@/components/FormError";
import clusterManagementStore from "@/store/clusterManagementStore";
import {apiCall} from "@/utils/api";
import api from "@/api/api";
import {AvailableStorage} from "@/api/model";
import {Dialog} from "primereact/dialog";
import {array} from "yup";

interface NodeFormModel {
    cores: number
    memory: number
}

const schema = Yup.object().shape({
    cores: Yup.number().min(1).required(),
    memory: Yup.number().positive().required(),
})
const ManagementEditNodeProperties = () => {

    const [storages, setStorages] = useState<AvailableStorage[]>([])
    const [deleteNodeConfirm, setDeleteNodeConfirm] = useState(false);
    useOnFirstMount(async () => {
        setStorages(await apiCall(() => api.storage.storage(clusterManagementStore.cluster.node, api.storage.StorageContentType.Images)))
    })
    const storedNode = computed(() => {
        if (uiPropertiesPanelStore.selectedPropertiesId) {
            return clusterManagementStore.findNode(Number(uiPropertiesPanelStore.selectedPropertiesId))
        } else {
            return null
        }
    })
    const [editResources, setEditResources] = useState(false);

    const cannotDelete = computed(() => {
        return (!!storedNode.get()?.lock) || clusterManagementStore.cluster.nodes.filter(i => !i.lock).length < 2;
    });

    const fullNodeName = `${clusterManagementStore.cluster.clusterName}-${storedNode.get()?.name}`;

    const initialValues = {
        cores: storedNode.get()?.cores,
        memory: storedNode.get()?.memory,
    } as NodeFormModel;

    const formik = useFormik({
        validationSchema: schema,
        initialValues: initialValues,
        onSubmit: async (values, formikHelpers) => {
            const nodeName = storedNode.get()?.name;
            if (!nodeName) {
                throw Error("Node name is empty")
            }
            await clusterManagementStore.changeNodeResources(nodeName, values.cores, values.memory);
        }
    })

    return <form onSubmit={formik.handleSubmit}>
        <Dialog
            header="Are you sure?"
            footer={
                <div>
                    <Button label="No" className="p-button-text" icon="pi pi-times"
                            onClick={() => {
                                setDeleteNodeConfirm(false)
                            }}/>
                    <Button label="Yes" icon="pi pi-check"
                            onClick={async () => {
                                let node = storedNode.get();
                                if (node) {
                                    await clusterManagementStore.deleteNodeFromCluster(node.name);
                                    setDeleteNodeConfirm(false);
                                    uiPropertiesPanelStore.hidePanel();
                                }
                            }}/>
                </div>}
            modal
            draggable={false}
            visible={deleteNodeConfirm}
            onHide={() => {
                setDeleteNodeConfirm(false);
            }}>
            Do you want to delete [{fullNodeName}] node?
        </Dialog>
        <div className="flex flex-col w-full h-full items-center">
            <div className="grow w-full">
                <div className="text-3xl text-center font-bold mt-5"> Node Properties</div>
                <div className="p-10">
                    <div>
                        <div className="text-stone-400 required">VM id</div>
                        <InputNumber name="vmid"
                                     value={storedNode.get()?.vmId}
                                     readOnly={true}
                                     disabled={true}
                                     className="w-full p-inputtext-sm" showButtons buttonLayout="horizontal"
                                     incrementButtonIcon="pi pi-plus" decrementButtonIcon="pi pi-minus"
                                     min={100}></InputNumber>
                    </div>

                    <div className="mt-3">
                        <div className="text-stone-400 required">Node name</div>
                        <InputText name="name"
                                   value={storedNode.get()?.name}
                                   readOnly={true}
                                   disabled={true}
                                   className="w-full p-inputtext-sm"></InputText>
                    </div>

                    <div className="mt-3">
                        <div className="text-stone-400 required">IP address</div>
                        <InputText name="ipAddress"
                                   readOnly={true}
                                   disabled={true}
                                   value={storedNode.get()?.ipAddress}
                                   className="w-full p-inputtext-sm"></InputText>
                    </div>

                    <div className="mt-3">
                        <div className="text-stone-400 required">Storage pool</div>
                        <Dropdown name="storagePool"
                                  readOnly={true}
                                  disabled={true}
                                  value={storedNode.get()?.storagePool}
                                  optionLabel={"storage"}
                                  optionValue={"storage"}
                                  options={storages}
                                  className="w-full"/>
                    </div>

                    <div className="border-t-2 border-stone-800 text-xl mt-10 mb-3 flex items-center">
                        <span className="mr-2">Resources</span>
                        {!editResources &&
                            <div>
                                <a onClick={() => {
                                    setEditResources(true);
                                }}
                                   className="text-sm primary-text-color cursor-pointer">
                                    Edit
                                </a>
                            </div>
                        }
                        {editResources &&
                            <div>
                                <a onClick={async () => {
                                    setEditResources(false);
                                    await formik.submitForm();
                                }}
                                   className="text-sm primary-text-color cursor-pointer mr-2">
                                    Save
                                </a>

                                <a onClick={() => {
                                    setEditResources(false);
                                    formik.resetForm();
                                }}
                                   className="text-sm text-stone-400 cursor-pointer">
                                    Cancel
                                </a>
                            </div>
                        }
                    </div>
                    <div className="mt-3">
                        <div className="text-stone-400 required">CPU cores</div>
                        <InputNumber name="cores"
                                     value={formik.values.cores}
                                     onChange={v => {
                                         formik.setFieldValue("cores", v.value, true)
                                     }}
                                     disabled={!editResources}
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
                                     disabled={!editResources}
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
                            <div className="ml-2">
                                <Button
                                    disabled={cannotDelete.get()}
                                    type="button"
                                    onClick={() => {
                                        setDeleteNodeConfirm(true);
                                    }}
                                    className="p-button-raised p-button-danger p-button-text">
                                    Delete
                                </Button>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    </form>
}


export default observer(ManagementEditNodeProperties)