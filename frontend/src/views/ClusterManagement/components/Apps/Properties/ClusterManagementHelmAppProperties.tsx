import React, { useEffect, useRef, useState } from 'react';
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { useFormik } from "formik";
import { k4p } from "@wails/models";
import * as Yup from "yup"
import uiPropertiesPanelStore from "@/store/uiPropertiesPanelStore";
import { observer } from "mobx-react-lite";
import { LogError } from "@wails-runtime/runtime";
import FormError from "@/components/FormError";
import clusterManagementStore, {
    LOADING_INDICATOR_DELETE_HELM_CHART,
    LOADING_INDICATOR_UNINSTALL_HELM_CHART,
    LOADING_INDICATOR_UPDATE_HELM_CHARTS_STATUS
} from "@/store/clusterManagementStore";
import processingIndicatorStoreUi from "@/store/processingIndicatorStoreUi";
import { InputSwitch } from "primereact/inputswitch";
import { CLUSTER_MANAGEMENT_HELM_APP_PROPERTIES_PANEL_NAME } from "@/components/PropertiesPanel";
import Editor from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import HelmApp = k4p.HelmApp;

const waitHelmInfo = "if set, will wait until all Pods, PVCs, Services, and minimum number of Pods of a Deployment, StatefulSet, or ReplicaSet are in a ready state before marking the release as successful."

const schema = Yup.object({
    releaseName: Yup.string().required().trim(),
    chartName: Yup.string().required().trim(),
    version: Yup.string().trim(),
    repository: Yup.string().required().trim(),
    namespace: Yup.string().required().trim(),
    valueFileContent: Yup.string()
})

const editorOptions = {
    fontSize: 16,
    minimap: {
        enabled: false
    } as monaco.editor.IEditorMinimapOptions
} as monaco.editor.IStandaloneEditorConstructionOptions;

const ClusterManagementHelmAppProperties = () => {
    const [initialValues, setInitialValues] = useState({
        id: "",
        releaseName: "",
        chartName: "",
        version: "",
        wait: false,
        namespace: "",
        repository: "",
        valueFileContent: ""
    } as k4p.HelmApp)

    const [submitMode, setSubmitMode] = useState<"SAVE" | "SAVE_AND_INSTALL">()
    const [lastError, setLastError] = useState("")
    const currentStatus = clusterManagementStore.helmAppsStatus.find(e => e.id == uiPropertiesPanelStore.selectedPropertiesId)?.status || ""
    const valuesEditor = useRef<monaco.editor.IStandaloneCodeEditor>();

    useEffect(() => {
        if (uiPropertiesPanelStore.selectedPropertiesId) {
            const appFromStore = clusterManagementStore.helmApps.find(e => e.id === uiPropertiesPanelStore.selectedPropertiesId);
            if (appFromStore) {
                setInitialValues(appFromStore)
            }
        }
    }, [uiPropertiesPanelStore.selectedPropertiesId])


    const isToDelete = currentStatus == "not_installed"
    const isToUninstall = currentStatus == "deployed" || currentStatus == "failed"
    const isToInstall = currentStatus == "not_installed"
    const isToSave = isToInstall || currentStatus == ""

    const onDelete = async () => {
        if (uiPropertiesPanelStore.selectedPropertiesId) {
            await clusterManagementStore.deleteHelmChart(uiPropertiesPanelStore.selectedPropertiesId);
            uiPropertiesPanelStore.hidePanel()
        } else {
            LogError("Helm app is not selected")
        }
    }
    const onUninstall = async () => {
        if (uiPropertiesPanelStore.selectedPropertiesId) {
            await clusterManagementStore.uninstallHelmChart(uiPropertiesPanelStore.selectedPropertiesId)
        } else {
            LogError("Helm app is not selected")
        }
    }

    const formik = useFormik<k4p.HelmApp>({
        validateOnMount: true,
        enableReinitialize: true,
        initialValues: initialValues,
        validationSchema: schema,
        onSubmit: async (values) => {
            const request = {
                ...values,
                valueFileContent: valuesEditor.current?.getValue() ?? ""
            } as HelmApp;

            if (!initialValues.id) {
                const id = await clusterManagementStore.addHelmChart(request)
                uiPropertiesPanelStore.selectPanel(CLUSTER_MANAGEMENT_HELM_APP_PROPERTIES_PANEL_NAME, String(id))
            } else {
                await clusterManagementStore.updateHelmChart(request);
                if (submitMode == "SAVE_AND_INSTALL") {
                    try {
                        setLastError("")
                        await clusterManagementStore.installHelmChartWithoutHandleGlobalErrorHandling(initialValues.id)
                        uiPropertiesPanelStore.hidePanel()
                    } catch (e: any) {
                        setLastError(String(e))
                    }
                }
            }
        }
    })

    const anyOperationInProgress = processingIndicatorStoreUi.status(LOADING_INDICATOR_UNINSTALL_HELM_CHART)
        || processingIndicatorStoreUi.status(LOADING_INDICATOR_UPDATE_HELM_CHARTS_STATUS)
        || processingIndicatorStoreUi.status(LOADING_INDICATOR_DELETE_HELM_CHART)
        || formik.isSubmitting

    useEffect(() => {
        if (anyOperationInProgress) {
            uiPropertiesPanelStore.blockHiding()
        } else {
            uiPropertiesPanelStore.unblockHiding()
        }
    }, [anyOperationInProgress])

    return (
        <div className="flex flex-col w-full h-full items-center">
            <div className="grow w-full">
                <div className="text-3xl text-center font-bold mt-5">Helm app</div>
                <form onSubmit={formik.handleSubmit}>
                    <div className="p-10">
                        <div className="mt-3">
                            <div className="flex flex-col mb-2">
                                <div className="mr-1 required">Repository:</div>
                                <div className="">
                                    <InputText
                                        name="repository"
                                        value={formik.values.repository}
                                        disabled={formik.isSubmitting || isToUninstall}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        className="w-full p-inputtext-sm"/>
                                    <FormError error={formik.errors.repository} touched={formik.touched.repository}/>
                                </div>
                            </div>

                            <div className="flex mb-2">
                                <div className="grow flex flex-col mr-2">
                                    <div className="mr-1 required">Chart name:</div>
                                    <div className="">
                                        <InputText
                                            name="chartName"
                                            disabled={formik.isSubmitting || isToUninstall}
                                            value={formik.values.chartName}
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                            className="w-full p-inputtext-sm"/>
                                        <FormError error={formik.errors.chartName} touched={formik.touched.chartName}/>
                                    </div>
                                </div>
                                <div className="grow flex flex-col">
                                    <div className="mr-1">version:</div>
                                    <div className="">
                                        <InputText
                                            name="version"
                                            placeholder="latest"
                                            disabled={formik.isSubmitting || isToUninstall}
                                            value={formik.values.version}
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                            className="w-full p-inputtext-sm"/>
                                        <FormError error={formik.errors.version} touched={formik.touched.version}/>
                                    </div>
                                </div>
                            </div>
                            <div className="flex mb-5">
                                <div className="grow flex flex-col mr-2">
                                    <div className="mr-1 required">Release name:</div>
                                    <div className="">
                                        <InputText
                                            name="releaseName"
                                            disabled={formik.isSubmitting || isToUninstall}
                                            value={formik.values.releaseName}
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                            className="w-full p-inputtext-sm"></InputText>
                                        <FormError error={formik.errors.releaseName}
                                                   touched={formik.touched.releaseName}/>
                                    </div>
                                </div>
                                <div className="grow flex flex-col">
                                    <div className="mr-1 required">Namespace:</div>
                                    <div className="">
                                        <InputText
                                            name="namespace"
                                            disabled={formik.isSubmitting || isToUninstall}
                                            value={formik.values.namespace}
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                            className="w-full p-inputtext-sm"/>
                                        <FormError error={formik.errors.namespace} touched={formik.touched.namespace}/>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col mb-2">
                                <div className="mr-1">Values:</div>
                                <Editor
                                    language="yaml"
                                    value={formik.values.valueFileContent}
                                    height="80vh"
                                    theme={"vs-dark"}
                                    className="editor-border"
                                    onMount={editor => {
                                        valuesEditor.current = editor;
                                    }}
                                    options={{
                                        ...editorOptions,
                                        readOnly: formik.isSubmitting || isToUninstall
                                    }}/>
                                <FormError error={formik.errors.valueFileContent}
                                           touched={formik.touched.valueFileContent}/>
                            </div>
                            <div className="flex items-center mb-2">
                                <InputSwitch
                                    title={waitHelmInfo}
                                    name="wait"
                                    disabled={formik.isSubmitting || isToUninstall}
                                    checked={formik.values.wait}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                />
                                <span className="ml-2" title={waitHelmInfo}>Wait for resources</span>
                            </div>
                        </div>


                        {
                            lastError &&
                            <div className="mt-10">
                                <div className="p-4 error-panel flex justify-between">
                                    {lastError}
                                </div>
                            </div>
                        }


                        <div className="mt-10 flex flex-col items-center">
                            <div className="flex justify-center items-center">
                                {
                                    isToInstall &&
                                    <div className="mr-5">
                                        <Button disabled={!formik.isValid || anyOperationInProgress}
                                                type="button"
                                                onClick={async () => {
                                                    setSubmitMode("SAVE_AND_INSTALL")
                                                    await formik.submitForm()
                                                }}
                                                className="p-button-primary">
                                            {formik.isSubmitting && submitMode == "SAVE_AND_INSTALL" &&
                                                <i className="pi pi-spin pi-spinner text-base mr-2"></i>}
                                            SAVE AND INSTALL
                                        </Button>
                                    </div>

                                }
                                {
                                    isToSave &&
                                    <div className="mr-5">
                                        <Button disabled={!formik.isValid || anyOperationInProgress} type="button"
                                                label="SAVE"
                                                onClick={async () => {
                                                    setSubmitMode("SAVE")
                                                    await formik.submitForm()
                                                }}
                                                className="p-button-primary"/>
                                    </div>
                                }

                                {
                                    isToUninstall &&
                                    <div className="mr-5">
                                        <Button
                                            disabled={anyOperationInProgress}
                                            onClick={onUninstall}
                                            type="button"
                                            className="p-button-raised p-button-danger p-button-text">
                                            {(processingIndicatorStoreUi.status(LOADING_INDICATOR_UNINSTALL_HELM_CHART)
                                                    || processingIndicatorStoreUi.status(LOADING_INDICATOR_UPDATE_HELM_CHARTS_STATUS)) &&
                                                <i className="pi pi-spin pi-spinner text-base mr-2"></i>}
                                            UNINSTALL
                                        </Button>
                                    </div>
                                }
                                {isToDelete &&
                                    <Button
                                        disabled={anyOperationInProgress}
                                        type="button"
                                        onClick={onDelete}
                                        className="p-button-raised p-button-danger p-button-text">
                                        {(processingIndicatorStoreUi.status(LOADING_INDICATOR_DELETE_HELM_CHART)) &&
                                            <i className="pi pi-spin pi-spinner text-base mr-2"></i>}
                                        Delete
                                    </Button>
                                }
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
        ;
};

export default observer(ClusterManagementHelmAppProperties)