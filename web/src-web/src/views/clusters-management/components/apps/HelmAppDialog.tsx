import React, {useEffect, useState} from 'react';
import {observer} from "mobx-react-lite";
import {Button} from "primereact/button";
import {Dialog} from "primereact/dialog";
import {AppStatusType, ClusterStatus, HelmApp} from "@/api/model";
import clusterManagementStore, {
    LOADING_INDICATOR_DELETE_HELM_CHART,
    LOADING_INDICATOR_UNINSTALL_HELM_CHART
} from "@/store/cluster-management-store";
import {useFormik} from "formik";
import processingIndicatorStore from "@/store/processing-indicator-store";
import {InputText} from "primereact/inputtext";
import FormError from "@/components/FormError";
import * as Yup from "yup";
import {InputTextarea} from "primereact/inputtextarea";
import {AxiosError} from "axios";
import {schemaAddHelmApp} from "@/views/cluster-creator/steps/apps/CreatorHelmAppDialog";


type Props = {
    onClose: () => void;
    onSubmit: (id: string) => void;
    selectedAppId?: string | null;
}
const HelmAppDialog = (props: Props) => {

    const currentStatus = clusterManagementStore.helmAppsStatus.find(e => e.id == props.selectedAppId)?.status || ""
    const isToDelete = currentStatus == AppStatusType.NotInstalled;
    const isToUninstall = currentStatus == AppStatusType.Deployed || currentStatus == AppStatusType.Failed;
    const isToInstall = currentStatus == AppStatusType.NotInstalled;
    const isToSave = isToInstall || currentStatus == "";


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

    const [submitMode, setSubmitMode] = useState<"SAVE" | "INSTALL">()
    const [lastError, setLastError] = useState("")

    useEffect(() => {
        if (props.selectedAppId) {
            const appFromStore = clusterManagementStore.helmApps.find(e => e.id === props.selectedAppId);
            if (appFromStore) {
                setInitialValues(appFromStore)
            }
        }
    }, [props.selectedAppId])
    
    const onDelete = async () => {
        if (props.selectedAppId) {
            await clusterManagementStore.deleteHelmChart(props.selectedAppId);
            props.onClose();
        } else {
            console.error("Helm app is not selected")
        }
    }
    const onUninstall = async () => {
        if (props.selectedAppId) {
            await clusterManagementStore.uninstallHelmChart(props.selectedAppId)
        } else {
            console.error("Helm app is not selected")
        }
    }

    const formik = useFormik<HelmApp>({
        validateOnMount: true,
        enableReinitialize: true,
        initialValues: initialValues,
        validationSchema: schemaAddHelmApp,
        onSubmit: async (values) => {
            if (!initialValues.id) {
                const id = await clusterManagementStore.addHelmChart(values)
                props.onSubmit(id);
            } else {
                await clusterManagementStore.updateHelmChart(values);
                if (submitMode == "INSTALL") {
                    try {
                        setLastError("")
                        await clusterManagementStore.installHelmChartWithoutHandleGlobalErrorHandling(initialValues.id)
                        props.onSubmit(initialValues.id);
                    } catch (e: any) {
                        if (e instanceof AxiosError && e?.response?.data) {
                            setLastError(e.response.data);
                        } else {
                            setLastError(String(e))
                        }
                    }
                }
            }
        }
    })

    const anyOperationInProgress = processingIndicatorStore.status(LOADING_INDICATOR_UNINSTALL_HELM_CHART)
        || processingIndicatorStore.status(LOADING_INDICATOR_DELETE_HELM_CHART)
        || formik.isSubmitting
        || clusterManagementStore.cluster.status != ClusterStatus.Sync

    return (
        <Dialog header={props.selectedAppId ? "Edit application" : "New application"}
                visible modal draggable={false} closable={!anyOperationInProgress}
                className="w-[95vw] h-[95vh] lg:w-[80vw] lg:h-[80vh] 2xl:w-[70vw] 2xl:h-[70vh]"
                maximizable
                onHide={() => props.onClose()}
                footer={<div className="flex justify-between">
                    <div>
                        {
                            isToDelete &&
                            <Button
                                disabled={anyOperationInProgress}
                                type="button"
                                onClick={onDelete}
                                className="p-button-raised p-button-danger p-button-text">
                                {(processingIndicatorStore.status(LOADING_INDICATOR_DELETE_HELM_CHART)) &&
                                    <i className="pi pi-spin pi-spinner text-base mr-2"></i>}
                                Delete
                            </Button>
                        }
                        {
                            isToUninstall &&
                            <div className="mr-5">
                                <Button
                                    disabled={anyOperationInProgress}
                                    onClick={onUninstall}
                                    type="button"
                                    className="p-button-raised p-button-danger p-button-text">
                                    {(processingIndicatorStore.status(LOADING_INDICATOR_UNINSTALL_HELM_CHART)) &&
                                        <i className="pi pi-spin pi-spinner text-base mr-2"></i>}
                                    Uninstall
                                </Button>
                            </div>
                        }
                    </div>
                    <div className="flex">
                        {
                            isToInstall &&
                            <div className="mr-2">
                                <Button disabled={!formik.isValid || anyOperationInProgress}
                                        type="button"
                                        onClick={async () => {
                                            setSubmitMode("INSTALL")
                                            await formik.submitForm()
                                        }}
                                        className="p-button-primary" outlined>
                                    {formik.isSubmitting && submitMode == "INSTALL" &&
                                        <i className="pi pi-spin pi-spinner text-base mr-2"></i>}
                                    Install
                                </Button>
                            </div>

                        }
                        {
                            isToSave &&
                            <div>
                                <Button disabled={!formik.isValid || anyOperationInProgress} type="button"
                                        label="Save"
                                        onClick={async () => {
                                            setSubmitMode("SAVE")
                                            await formik.submitForm()
                                        }}
                                        className="p-button-primary"/>
                            </div>
                        }


                    </div>

                </div>}>


            <form onSubmit={formik.handleSubmit} className="w-full h-full flex px-10 pt-10">
                <div>
                    <div className="flex flex-col mb-2">
                        <div className="mr-1 required">Repository:</div>
                        <div className="">
                            <InputText
                                name="repository"
                                value={formik.values.repository}
                                readOnly={formik.isSubmitting || isToUninstall}
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
                                    readOnly={formik.isSubmitting || isToUninstall}
                                    value={formik.values.chartName}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    className="w-full p-inputtext-sm"/>
                                <FormError error={formik.errors.chartName} touched={formik.touched.chartName}/>
                            </div>
                        </div>
                        <div className="grow flex flex-col">
                            <div className="mr-1">Version:</div>
                            <div className="">
                                <InputText
                                    name="chartVersion"
                                    placeholder="latest"
                                    readOnly={formik.isSubmitting || isToUninstall}
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
                                    readOnly={formik.isSubmitting || isToUninstall}
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
                                    readOnly={formik.isSubmitting || isToUninstall}
                                    value={formik.values.namespace}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    className="w-full p-inputtext-sm"/>
                                <FormError error={formik.errors.namespace} touched={formik.touched.namespace}/>
                            </div>
                        </div>
                    </div>
                    {/*
                     TODO: Feature is unstable, after waiting for resources, request has become long-running
                     because installation process is connected to it. Move installation process to dispatcher
                     and add "installing" state to application.
                    */}
                    {/*<div className="flex items-center mb-2">*/}
                    {/*    <InputSwitch*/}
                    {/*        title={waitHelmInfo}*/}
                    {/*        name="wait"*/}
                    {/*        disabled={formik.isSubmitting || isToUninstall}*/}
                    {/*        checked={formik.values.wait}*/}
                    {/*        onChange={formik.handleChange}*/}
                    {/*        onBlur={formik.handleBlur}*/}
                    {/*    />*/}
                    {/*    <span className="ml-2" title={waitHelmInfo}>Wait for resources</span>*/}
                    {/*</div>*/}
                    {
                        lastError &&
                        <div className="mt-10">
                            <div className="p-4 error-panel flex justify-between">
                                {lastError}
                            </div>
                        </div>
                    }
                </div>

                <span className="border-r border-bg rounded-full mx-8 w-[0px]"></span>
                <div className="grow flex flex-col min-w-[300px] min-h-[300px]">
                    <div className="mr-1">Values:</div>
                    <InputTextarea className="grow font-monospace"
                                   readOnly={formik.isSubmitting || isToUninstall}
                                   value={formik.values.values}
                                   onChange={(e) => {
                                       formik.setFieldValue("values", e.target.value)
                                   }}/>
                    <FormError error={formik.errors.values}
                               touched={formik.touched.values}/>
                </div>
            </form>

        </Dialog>
    );
};

export default observer(HelmAppDialog);