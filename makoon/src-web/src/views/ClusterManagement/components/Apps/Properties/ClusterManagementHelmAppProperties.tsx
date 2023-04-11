import React, { useEffect, useState } from 'react';
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { useFormik } from "formik";
import * as Yup from "yup"
import uiPropertiesPanelStore from "@/store/uiPropertiesPanelStore";
import { observer } from "mobx-react-lite";
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
import { AppStatusType, HelmApp } from "@/api/model";

const waitHelmInfo = "if set, will wait until all Pods, PVCs, Services, and minimum number of Pods of a Deployment, StatefulSet, or ReplicaSet are in a ready state before marking the release as successful."

const schema = Yup.object({
    releaseName: Yup.string().required().trim(),
    chartName: Yup.string().required().trim(),
    chartVersion: Yup.string().trim(),
    repository: Yup.string().required().trim(),
    namespace: Yup.string().required().trim(),
    values: Yup.string()
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
        chartVersion: "",
        wait: false,
        namespace: "",
        repository: "",
        values: ""
    } as HelmApp)

    const [submitMode, setSubmitMode] = useState<"SAVE" | "SAVE_AND_INSTALL">()
    const [lastError, setLastError] = useState("")
    const currentStatus = clusterManagementStore.helmAppsStatus.find(e => e.id == uiPropertiesPanelStore.selectedPropertiesId)?.status || ""

    useEffect(() => {
        if (uiPropertiesPanelStore.selectedPropertiesId) {
            const appFromStore = clusterManagementStore.helmApps.find(e => e.id === uiPropertiesPanelStore.selectedPropertiesId);
            if (appFromStore) {
                setInitialValues(appFromStore)
            }
        }
    }, [uiPropertiesPanelStore.selectedPropertiesId])


    const isToDelete = currentStatus == AppStatusType.NotInstalled;
    const isToUninstall = currentStatus == AppStatusType.Deployed || currentStatus == AppStatusType.Failed;
    const isToInstall = currentStatus == AppStatusType.NotInstalled;
    const isToSave = isToInstall || currentStatus == "";

    const onDelete = async () => {
        if (uiPropertiesPanelStore.selectedPropertiesId) {
            await clusterManagementStore.deleteHelmChart(uiPropertiesPanelStore.selectedPropertiesId);
            uiPropertiesPanelStore.hidePanel()
        } else {
            console.error("Helm app is not selected")
        }
    }
    const onUninstall = async () => {
        if (uiPropertiesPanelStore.selectedPropertiesId) {
            await clusterManagementStore.uninstallHelmChart(uiPropertiesPanelStore.selectedPropertiesId)
        } else {
            console.error("Helm app is not selected")
        }
    }

    const formik = useFormik<HelmApp>({
        validateOnMount: true,
        enableReinitialize: true,
        initialValues: initialValues,
        validationSchema: schema,
        onSubmit: async (values) => {
            if (!initialValues.id) {
                const id = await clusterManagementStore.addHelmChart(values)
                uiPropertiesPanelStore.selectPanel(CLUSTER_MANAGEMENT_HELM_APP_PROPERTIES_PANEL_NAME, String(id))
            } else {
                await clusterManagementStore.updateHelmChart(values);
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
            <div className="text-3xl text-center font-bold mt-5">Helm app</div>
            <form onSubmit={formik.handleSubmit} className="grow w-full flex flex-col p-10">
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
                                name="chartVersion"
                                placeholder="latest"
                                disabled={formik.isSubmitting || isToUninstall}
                                value={formik.values.chartVersion}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                className="w-full p-inputtext-sm"/>
                            <FormError error={formik.errors.chartVersion}
                                       touched={formik.touched.chartVersion}/>
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
                <div className="grow flex flex-col mb-2">
                    <div className="mr-1">Values:</div>
                    <Editor
                        language="yaml"
                        value={formik.values.values}
                        height="calc(100vh - 650px)"
                        theme={"vs-dark"}
                        className="editor-border"
                        onChange={(data) => {
                            formik.setFieldValue("values", data);
                        }}
                        options={{
                            ...editorOptions,
                            readOnly: formik.isSubmitting || isToUninstall
                        }}/>
                    <FormError error={formik.errors.values}
                               touched={formik.touched.values}/>
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
                {
                    lastError &&
                    <div className="mt-10">
                        <div className="p-4 error-panel flex justify-between">
                            {lastError}
                        </div>
                    </div>
                }

                <div className="flex flex-col items-center">
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
                                    {(processingIndicatorStoreUi.status(LOADING_INDICATOR_UNINSTALL_HELM_CHART)) &&
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
            </form>
        </div>
    )
        ;
};

export default observer(ClusterManagementHelmAppProperties)