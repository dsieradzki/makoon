import React, { useContext, useState } from 'react';
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import uiPropertiesPanelStore from "@/store/uiPropertiesPanelStore";
import { useFormik } from "formik";
import FormError from "@/components/FormError";
import * as Yup from "yup"
import { useOnFirstMount } from "@/utils/hooks";
import { observer } from "mobx-react-lite";
import { ClusterWizardStoreContext } from "@/views/ClusterWizard/ClusterWizardView";
import { ClusterResource } from "@/api/model";
import Editor from "@monaco-editor/react";
import * as monaco from "monaco-editor";

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

const K8sResourceProperties = () => {
    const clusterStore = useContext(ClusterWizardStoreContext)
    const [initialValues, setInitialValues] = useState({
        id: "",
        name: "",
        content: ""
    } as ClusterResource)
    useOnFirstMount(async () => {
        const resFromStore = clusterStore.k8SResources.find(e => e.name === uiPropertiesPanelStore.selectedPropertiesId);
        if (resFromStore) {
            setInitialValues(resFromStore)
        }
    })
    const formik = useFormik({
        enableReinitialize: true,
        validateOnMount: true,
        initialValues: initialValues,
        validationSchema: schema,
        onSubmit: (values) => {
            if (uiPropertiesPanelStore.selectedPropertiesId) {
                clusterStore.updateCustomK8SResources(uiPropertiesPanelStore.selectedPropertiesId, values);
            } else {
                clusterStore.addCustomK8SResources(values)
            }
            uiPropertiesPanelStore.hidePanel()
        }
    })
    const onDelete = () => {
        if (uiPropertiesPanelStore.selectedPropertiesId) {
            clusterStore.deleteCustomK8SResources(uiPropertiesPanelStore.selectedPropertiesId);
            uiPropertiesPanelStore.hidePanel()
        } else {
            console.error("Kubernetes resource is not selected")
        }
    }
    return <>
        <div className="flex flex-col w-full h-full items-center">
            <form onSubmit={formik.handleSubmit} className="grow w-full flex flex-col">
                <div className="text-3xl text-center font-bold mt-5">Kubernetes Resource</div>
                <div className="grow p-10 flex flex-col">
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
                    <div className="grow flex flex-col mb-2">
                        <div className="mr-1 required">Content:</div>
                        <Editor
                            language="yaml"
                            value={formik.values.content}
                            height="calc(100vh - 400px)"
                            theme={"vs-dark"}
                            className="editor-border"
                            onChange={(data) => {
                                formik.setFieldValue("content", data);
                            }}
                            options={{
                                ...editorOptions,
                                readOnly: formik.isSubmitting,
                            }}/>
                        <FormError error={formik.errors.content}
                                   touched={formik.touched.content}/>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="flex justify-center items-center">
                            <div className="mr-5">
                                <Button disabled={!formik.isValid} type="submit" label="SAVE"
                                        className="p-button-primary"/>
                            </div>
                            {uiPropertiesPanelStore.selectedPropertiesId &&
                                <Button onClick={onDelete}
                                        label="Delete"
                                        type="button"
                                        className="p-button-raised p-button-danger p-button-text"/>}
                        </div>
                    </div>
                </div>

            </form>
        </div>
    </>
};

export default observer(K8sResourceProperties);