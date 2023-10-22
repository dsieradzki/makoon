import React, {useEffect, useState} from 'react';
import {Dialog} from "primereact/dialog";
import {Button} from "primereact/button";
import processingIndicatorStore from "@/store/processing-indicator-store";
import clusterManagementStore, {
    LOADING_INDICATOR_DELETE_K8S_RESOURCE,
    LOADING_INDICATOR_INSTALL_K8S_RESOURCE,
    LOADING_INDICATOR_UNINSTALL_K8S_RESOURCE
} from "@/store/cluster-management-store";
import {ClusterResource, ClusterState, ClusterStatus} from "@/api/model";
import {useFormik} from "formik";
import {InputText} from "primereact/inputtext";
import FormError from "@/components/FormError";
import * as Yup from "yup";
import {InputTextarea} from "primereact/inputtextarea";
import {observer} from "mobx-react-lite";
import {AxiosError} from "axios";
import {schemaAddWorkload} from "@/views/cluster-creator/steps/workloads/CreatorWorkloadsDialog";


type Props = {
    onClose: () => void;
    onSubmit: (id: string) => void;
    selectedWorkloadId?: string | null;
}
const WorkloadsDialog = (props: Props) => {

    const [initialValues, setInitialValues] = useState({
        id: "",
        name: "",
        content: ""
    } as ClusterResource)

    const [lastError, setLastError] = useState("")

    useEffect(() => {
        if (props.selectedWorkloadId) {
            const resFromStore = clusterManagementStore.k8SResources.find(e => e.id === props.selectedWorkloadId);
            if (resFromStore) {
                setInitialValues(resFromStore)
            }
        }
    }, [props.selectedWorkloadId])


    const formik = useFormik({
        enableReinitialize: true,
        validateOnMount: true,
        initialValues: initialValues,
        validationSchema: schemaAddWorkload,
        onSubmit: async (values) => {
            if (initialValues.id) {
                await clusterManagementStore.updateK8sResources(values);
                props.onSubmit(initialValues.id);
            } else {
                const id = await clusterManagementStore.addK8sResources(values)
                props.onSubmit(id);
            }
        }
    })

    const handleAxiosError = (e: any) => {
        if (e instanceof AxiosError && e?.response?.data) {
            setLastError(e.response.data);
        } else {
            setLastError(String(e))
        }
    }
    const onInstall = async () => {
        try {
            setLastError("")
            await clusterManagementStore.installK8sResourcesWithoutGlobalErrorHandling(initialValues.id)
        } catch (e: any) {
            handleAxiosError(e);
        }
    }

    const onUninstall = async () => {
        try {
            setLastError("")
            await clusterManagementStore.uninstallK8sResourcesWithoutErrorHandling(initialValues.id)
        } catch (e: any) {
            handleAxiosError(e);
        }
    }

    const onDelete = async () => {
        if (initialValues.id) {
            await clusterManagementStore.deleteK8sResources(initialValues.id);
            props.onClose();
        } else {
            console.error("Kubernetes resource is not selected")
        }
    }

    const anyOperationInProgress = processingIndicatorStore.status(LOADING_INDICATOR_INSTALL_K8S_RESOURCE)
        || processingIndicatorStore.status(LOADING_INDICATOR_UNINSTALL_K8S_RESOURCE)
        || processingIndicatorStore.status(LOADING_INDICATOR_DELETE_K8S_RESOURCE)
        || formik.isSubmitting
        || clusterManagementStore.cluster.status?.state != ClusterState.Sync

    return (
        <Dialog header={props.selectedWorkloadId ? "Edit workload" : "New workload"}
                className="w-[95vw] h-[95vh] lg:w-[80vw] lg:h-[80vh] 2xl:w-[70vw] 2xl:h-[70vh]"
                visible modal draggable={false} closable={!anyOperationInProgress}
                maximizable
                onHide={() => props.onClose()}
                footer={<div className="flex justify-between">
                    <div className="flex">
                        {initialValues.id &&
                            <>
                                <Button onClick={onUninstall}
                                        disabled={anyOperationInProgress}
                                        type="button"
                                        outlined
                                        className="p-button-danger">
                                    {(processingIndicatorStore.status(LOADING_INDICATOR_UNINSTALL_K8S_RESOURCE)) &&
                                        <i className="pi pi-spin pi-spinner text-base mr-2"></i>}
                                    Uninstall
                                </Button>
                                <Button onClick={onDelete}
                                        disabled={anyOperationInProgress}
                                        type="button"
                                        outlined
                                        className="p-button-danger">
                                    {(processingIndicatorStore.status(LOADING_INDICATOR_DELETE_K8S_RESOURCE)) &&
                                        <i className="pi pi-spin pi-spinner text-base mr-2"></i>}
                                    Delete
                                </Button>

                            </>}
                    </div>
                    <div>
                        {
                            initialValues.id && <Button onClick={onInstall}
                                                        disabled={anyOperationInProgress}
                                                        type="button"
                                                        outlined
                                                        className="p-button-primary">
                                {(processingIndicatorStore.status(LOADING_INDICATOR_INSTALL_K8S_RESOURCE)) &&
                                    <i className="pi pi-spin pi-spinner text-base mr-2"></i>}
                                Install
                            </Button>
                        }
                        <Button
                            onClick={formik.submitForm}
                            disabled={!formik.isValid || anyOperationInProgress}
                            type="button"
                            label=""
                            className="p-button-primary">
                            {formik.isSubmitting &&
                                <i className="pi pi-spin pi-spinner text-base mr-2"></i>}
                            Save
                        </Button>
                    </div>
                </div>}>
            <form onSubmit={formik.handleSubmit} className="grow w-full h-full flex flex-col p-10">
                <div className="flex flex-col mb-2">
                    <div className="mr-1 required">Name:</div>
                    <div className="">
                        <InputText
                            name="name"
                            readOnly={anyOperationInProgress}
                            value={formik.values.name}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            className="w-full p-inputtext-sm"></InputText>
                        <FormError error={formik.errors.name} touched={formik.touched.name}/>
                    </div>
                </div>
                <div className="grow flex flex-col min-w-[300px] min-h-[300px]">
                    <div className="mr-1 required">Content:</div>
                    <InputTextarea name="content"
                                   className="grow font-monospace"
                                   readOnly={formik.isSubmitting || anyOperationInProgress}
                                   value={formik.values.content}
                                   onBlur={formik.handleBlur}
                                   onChange={(e) => {
                                       formik.setFieldValue("content", e.target.value)
                                   }}/>
                    <FormError error={formik.errors.content}
                               touched={formik.touched.content}/>
                </div>
                {
                    lastError &&
                    <div>
                        <div className="p-4 error-panel flex justify-between">
                            {lastError}
                        </div>
                    </div>
                }
            </form>
        </Dialog>
    );
};

export default observer(WorkloadsDialog);