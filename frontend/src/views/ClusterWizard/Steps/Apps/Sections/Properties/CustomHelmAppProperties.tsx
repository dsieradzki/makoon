import React, { useContext, useState } from 'react';
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { useFormik } from "formik";
import { k4p } from "@wails/models";
import * as Yup from "yup"
import uiPropertiesPanelStore from "@/store/uiPropertiesPanelStore";
import { useOnFirstMount } from "@/utils/hooks";
import { observer } from "mobx-react-lite";
import { LogError } from "@wails-runtime/runtime";
import FormError from "@/components/FormError";
import { ClusterWizardStoreContext } from "@/views/ClusterWizard/ClusterWizardView";

const schema = Yup.object({
    releaseName: Yup.string().required(),
    chartName: Yup.string().required(),
    repository: Yup.string().required(),
    namespace: Yup.string().required(),
    valueFileContent: Yup.string()
})
const CustomHelmAppProperties = () => {
    const clusterStore = useContext(ClusterWizardStoreContext)
    const [initialValues, setInitialValues] = useState({} as k4p.HelmApp)

    useOnFirstMount(async () => {
        const appFromStore = clusterStore.customHelmApps.find(e => e.releaseName === uiPropertiesPanelStore.selectedPropertiesId);
        if (appFromStore) {
            setInitialValues(appFromStore)
        }
    })
    const onDelete = () => {
        if (uiPropertiesPanelStore.selectedPropertiesId) {
            clusterStore.deleteCustomHelmApp(uiPropertiesPanelStore.selectedPropertiesId);
            uiPropertiesPanelStore.hidePanel()
        } else {
            LogError("Helm app is not selected")
        }
    }

    const formik = useFormik<k4p.HelmApp>({
        validateOnMount: true,
        enableReinitialize: true,
        initialValues: initialValues,
        validationSchema: schema,
        onSubmit: (values, formikHelpers) => {
            if (uiPropertiesPanelStore.selectedPropertiesId) {
                clusterStore.updateCustomHelmApp(uiPropertiesPanelStore.selectedPropertiesId, values);
            } else {
                clusterStore.addCustomHelmApp(values)
            }
            uiPropertiesPanelStore.hidePanel()
        }
    })

    return (
        <div className="flex flex-col w-full h-full items-center">
            <div className="grow w-full">
                <div className="text-3xl text-center font-bold mt-5">Helm app</div>
                <form onSubmit={formik.handleSubmit}>
                    <div className="p-10">
                        <div className="mt-3">
                            <div className="flex flex-col mb-2">
                                <div className="mr-1 required">Release name:</div>
                                <div className="">
                                    <InputText
                                        name="releaseName"
                                        value={formik.values.releaseName}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        className="w-full p-inputtext-sm"></InputText>
                                    <FormError error={formik.errors.releaseName} touched={formik.touched.releaseName}/>
                                </div>
                            </div>
                            <div className="flex flex-col mb-2">
                                <div className="mr-1 required">Chart name:</div>
                                <div className="">
                                    <InputText
                                        name="chartName"
                                        value={formik.values.chartName}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        className="w-full p-inputtext-sm"/>
                                    <FormError error={formik.errors.chartName} touched={formik.touched.chartName}/>
                                </div>
                            </div>
                            <div className="flex flex-col mb-2">
                                <div className="mr-1 required">Repository:</div>
                                <div className="">
                                    <InputText
                                        name="repository"
                                        value={formik.values.repository}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        className="w-full p-inputtext-sm"/>
                                    <FormError error={formik.errors.repository} touched={formik.touched.repository}/>
                                </div>
                            </div>
                            <div className="flex flex-col mb-2">
                                <div className="mr-1 required">Namespace:</div>
                                <div className="">
                                    <InputText
                                        name="namespace"
                                        value={formik.values.namespace}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        className="w-full p-inputtext-sm"/>
                                    <FormError error={formik.errors.namespace} touched={formik.touched.namespace}/>
                                </div>
                            </div>
                            <div className="flex flex-col mb-2">
                                <div className="mr-1">Values:</div>
                                <div className="">
                                    <InputTextarea
                                        name="valueFileContent"
                                        value={formik.values.valueFileContent}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        className="w-full p-inputtext-sm"/>
                                    <FormError error={formik.errors.valueFileContent} touched={formik.touched.valueFileContent}/>
                                </div>
                            </div>
                        </div>
                        <div className="mt-10 flex flex-col items-center">
                            <div className="flex justify-center items-center">
                                <div className="mr-5">
                                    <Button disabled={!formik.isValid} type="submit" label="SAVE"
                                            className="p-button-primary"/>
                                </div>
                                {uiPropertiesPanelStore.selectedPropertiesId &&
                                    <Button onClick={onDelete} label="Delete"
                                            className="p-button-raised p-button-danger p-button-text"/>}
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default observer(CustomHelmAppProperties)