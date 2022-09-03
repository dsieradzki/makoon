import React, { useState } from 'react';
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import uiPropertiesPanelStore from "@/store/uiPropertiesPanelStore";
import { useFormik } from "formik";
import projectStore from "@/store/projectStore";
import { LogError } from "@wails-runtime/runtime";
import FormError from "@/components/FormError";
import * as Yup from "yup"
import { useOnFirstMount } from "@/reactHooks";
import { observer } from "mobx-react-lite";

const schema = Yup.object({
    name: Yup.string().required(),
    content: Yup.string().required()
})

const CustomK8SResourceProperties = () => {
    const [initialValues, setInitialValues] = useState({
            name: "",
            content: ""
        })
    useOnFirstMount(async () => {
        const resFromStore = projectStore.customK8SResources.find(e => e.name === uiPropertiesPanelStore.selectedPropertiesId);
        if (resFromStore) {
            setInitialValues(resFromStore)
        }
    })
    const formik = useFormik({
        enableReinitialize: true,
        validateOnMount: true,
        initialValues: initialValues,
        validationSchema: schema,
        onSubmit: (values, formikHelpers) => {
            if (uiPropertiesPanelStore.selectedPropertiesId) {
                projectStore.updateCustomK8SResources(uiPropertiesPanelStore.selectedPropertiesId, values);
            } else {
                projectStore.addCustomK8SResources(values)
            }
            uiPropertiesPanelStore.hidePanel()
        }
    })
    const onDelete = () => {
        if (uiPropertiesPanelStore.selectedPropertiesId) {
            projectStore.deleteCustomK8SResources(uiPropertiesPanelStore.selectedPropertiesId);
            uiPropertiesPanelStore.hidePanel()
        } else {
            LogError("Kubernetes resource is not selected")
        }
    }
    return <>
        <div className="flex flex-col w-full h-full items-center">

            <div className="grow w-full">
                <form onSubmit={formik.handleSubmit}>
                    <div className="text-3xl text-center font-bold mt-5">Custom Resource</div>
                    <div className="p-10">

                        <div className="flex flex-col mb-2">
                            <div className="mr-1 required">Name:</div>
                            <div className="">
                                <InputText
                                    name="name"
                                    value={formik.values.name}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    className="w-full p-inputtext-sm"></InputText>
                                <FormError error={formik.errors.name} touched={formik.touched.name}/>
                            </div>
                        </div>
                        <div className="flex flex-col mb-2">
                            <div className="mr-1 required">Content:</div>
                            <div className="">
                                <InputTextarea
                                    name="content"
                                    value={formik.values.content}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    className="w-full p-inputtext-sm font-mono"/>
                                <FormError error={formik.errors.content} touched={formik.touched.content}/>
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
                </form>
            </div>
        </div>
    </>
};

export default observer(CustomK8SResourceProperties);