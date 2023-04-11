import React, { useEffect, useRef, useState } from 'react';
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import uiPropertiesPanelStore from "@/store/uiPropertiesPanelStore";
import { useFormik } from "formik";
import FormError from "@/components/FormError";
import * as Yup from "yup"
import { observer } from "mobx-react-lite";
import clusterManagementStore, {
    LOADING_INDICATOR_DELETE_K8S_RESOURCE,
    LOADING_INDICATOR_INSTALL_K8S_RESOURCE,
    LOADING_INDICATOR_UNINSTALL_K8S_RESOURCE
} from "@/store/clusterManagementStore";
import { CLUSTER_MANAGER_K8S_RESOURCES_PROPERTIES_PANEL_NAME } from "@/components/PropertiesPanel";
import processingIndicatorStoreUi from "@/store/processingIndicatorStoreUi";
import Editor from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { ClusterResource } from "@/api/model";

const schema = Yup.object({
    name: Yup.string().required().strict().trim(),
    content: Yup.string().required()
})

const editorOptions = {
    fontSize: 16,
    minimap: {
        enabled: false
    } as monaco.editor.IEditorMinimapOptions
} as monaco.editor.IStandaloneEditorConstructionOptions;
const K8SResourceProperties = () => {
    const [initialValues, setInitialValues] = useState({
        id: "",
        name: "",
        content: ""
    } as ClusterResource)

    const [lastError, setLastError] = useState("")

    useEffect(() => {
        if (uiPropertiesPanelStore.selectedPropertiesId) {
            const resFromStore = clusterManagementStore.k8SResources.find(e => e.id === uiPropertiesPanelStore.selectedPropertiesId);
            if (resFromStore) {
                setInitialValues(resFromStore)
            }
        }
    }, [uiPropertiesPanelStore.selectedPropertiesId])

    const formik = useFormik({
        enableReinitialize: true,
        validateOnMount: true,
        initialValues: initialValues,
        validationSchema: schema,
        onSubmit: async (values) => {
            if (initialValues.id) {
                await clusterManagementStore.updateK8sResources(values);
            } else {
                const id = await clusterManagementStore.addK8sResources(values)
                uiPropertiesPanelStore.selectPanel(CLUSTER_MANAGER_K8S_RESOURCES_PROPERTIES_PANEL_NAME, String(id))
            }
        }
    })

    const onInstall = async () => {
        try {
            setLastError("")
            await clusterManagementStore.installK8sResourcesWithoutGlobalErrorHandling(initialValues.id)
        } catch (e: any) {
            setLastError(String(e))
        }
    }

    const onUninstall = async () => {
        try {
            setLastError("")
            await clusterManagementStore.uninstallK8sResourcesWithoutErrorHandling(initialValues.id)
        } catch (e: any) {
            setLastError(String(e))
        }
    }

    const onDelete = async () => {
        if (initialValues.id) {
            await clusterManagementStore.deleteK8sResources(initialValues.id);
            uiPropertiesPanelStore.hidePanel()
        } else {
            console.error("Kubernetes resource is not selected")
        }
    }

    const anyOperationInProgress = processingIndicatorStoreUi.status(LOADING_INDICATOR_INSTALL_K8S_RESOURCE)
        || processingIndicatorStoreUi.status(LOADING_INDICATOR_UNINSTALL_K8S_RESOURCE)
        || processingIndicatorStoreUi.status(LOADING_INDICATOR_DELETE_K8S_RESOURCE)
        || formik.isSubmitting

    useEffect(() => {
        if (anyOperationInProgress) {
            uiPropertiesPanelStore.blockHiding()
        } else {
            uiPropertiesPanelStore.unblockHiding()
        }
    }, [anyOperationInProgress])

    return <>
        <div className="flex flex-col w-full h-full items-center">
            <form onSubmit={formik.handleSubmit} className="grow w-full flex flex-col p-10">
                <div className="text-3xl text-center font-bold mt-5">Kubernetes Resource</div>
                <div className="flex flex-col mb-2">
                    <div className="mr-1 required">Name:</div>
                    <div className="">
                        <InputText
                            name="name"
                            disabled={anyOperationInProgress}
                            value={formik.values.name}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            className="w-full p-inputtext-sm"></InputText>
                        <FormError error={formik.errors.name} touched={formik.touched.name}/>
                    </div>
                </div>
                <div className="grow flex flex-col mb-2">
                    <div className="mr-1 required">Content:</div>
                    <div className="grow">
                        <Editor
                            language="yaml"
                            value={formik.values.content}
                            theme={"vs-dark"}
                            height="calc(100vh - 400px)"
                            className="editor-border "
                            onChange={(data) => {
                                formik.setFieldValue("content", data);
                            }}
                            options={{
                                ...editorOptions,
                                readOnly: anyOperationInProgress
                            }}/>
                        <FormError error={formik.errors.content}
                                   touched={formik.touched.content}/>
                    </div>
                </div>
                {
                    lastError &&
                    <div>
                        <div className="p-4 error-panel flex justify-between">
                            {lastError}
                        </div>
                    </div>
                }
                <div className="mt-2 flex flex-col items-center">
                    <div className="flex justify-center items-center">
                        <div className="mr-2">
                            <Button
                                disabled={!formik.isValid || anyOperationInProgress}
                                type="submit"
                                label=""
                                className="p-button-primary">

                                {formik.isSubmitting &&
                                    <i className="pi pi-spin pi-spinner text-base mr-2"></i>}
                                SAVE
                            </Button>
                        </div>
                        {initialValues.id &&
                            <>
                                <div className="mr-2">
                                    <Button onClick={onInstall}
                                            disabled={anyOperationInProgress}
                                            type="button"
                                            className="p-button-primary">
                                        {(processingIndicatorStoreUi.status(LOADING_INDICATOR_INSTALL_K8S_RESOURCE)) &&
                                            <i className="pi pi-spin pi-spinner text-base mr-2"></i>}
                                        Install
                                    </Button>
                                </div>

                                <div className="mr-2">
                                    <Button onClick={onUninstall}
                                            disabled={anyOperationInProgress}
                                            type="button"
                                            className="p-button-primary">
                                        {(processingIndicatorStoreUi.status(LOADING_INDICATOR_UNINSTALL_K8S_RESOURCE)) &&
                                            <i className="pi pi-spin pi-spinner text-base mr-2"></i>}
                                        Uninstall
                                    </Button>
                                </div>

                                <Button onClick={onDelete}
                                        disabled={anyOperationInProgress}
                                        type="button"
                                        className="p-button-raised p-button-danger p-button-text">
                                    {(processingIndicatorStoreUi.status(LOADING_INDICATOR_DELETE_K8S_RESOURCE)) &&
                                        <i className="pi pi-spin pi-spinner text-base mr-2"></i>}
                                    Delete
                                </Button>
                            </>}
                    </div>
                </div>
            </form>
        </div>
    </>
};

export default observer(K8SResourceProperties);