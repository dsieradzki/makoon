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
import clusterManagementStore, {LOADING_INDICATOR_DELETE_HELM_CHART} from "@/store/clusterManagementStore";
import {apiCall} from "@/utils/api";
import api from "@/api/api";
import {AvailableStorage} from "@/api/model";
import * as cluster from "cluster";
import {Dialog} from "primereact/dialog";
import processingIndicatorStoreUi from "@/store/processingIndicatorStoreUi";

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
const ManagementNodeReadOnlyProperties = () => {

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

    const fullNodeName = `${clusterManagementStore.cluster.clusterName}-${storedNode.get()?.name}`;

    const formik = useFormik({
        validationSchema: schema,
        initialValues: {
            vmid: storedNode.get()?.vmId,
            name: fullNodeName,
            cores: storedNode.get()?.cores,
            memory: storedNode.get()?.memory,
            ipAddress: storedNode.get()?.ipAddress,
            storagePool: storedNode.get()?.storagePool
        } as NodeFormModel,

        onSubmit: (values, formikHelpers) => {
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
                                    await api.clusters.deleteNodeFromCluster(clusterManagementStore.cluster.clusterName, node.name);
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
                                     value={formik.values.vmid}
                                     readOnly={true}
                                     disabled={true}
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
                                   className="w-full p-inputtext-sm"></InputText>
                        <FormError error={formik.errors.name} touched={formik.touched.name}/>
                    </div>

                    <div className="mt-3">
                        <div className="text-stone-400 required">IP address</div>
                        <InputText name="ipAddress"
                                   readOnly={true}
                                   disabled={true}
                                   value={formik.values.ipAddress}
                                   className="w-full p-inputtext-sm"></InputText>
                        <FormError error={formik.errors.ipAddress} touched={formik.touched.ipAddress}/>
                    </div>

                    <div className="mt-3">
                        <div className="text-stone-400 required">Storage pool</div>
                        <Dropdown name="storagePool"
                                  readOnly={true}
                                  disabled={true}
                                  value={formik.values.storagePool}
                                  optionLabel={"storage"}
                                  optionValue={"storage"}
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
                                    disabled={clusterManagementStore.cluster.nodes.length < 2}
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


export default observer(ManagementNodeReadOnlyProperties)