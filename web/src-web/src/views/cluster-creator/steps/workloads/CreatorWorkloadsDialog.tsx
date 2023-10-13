import React, {useContext, useEffect, useState} from 'react';
import {Dialog} from "primereact/dialog";
import {Button} from "primereact/button";
import {ClusterResource} from "@/api/model";
import {useFormik} from "formik";
import {InputText} from "primereact/inputtext";
import FormError from "@/components/FormError";
import * as Yup from "yup";
import {InputTextarea} from "primereact/inputtextarea";
import {observer} from "mobx-react-lite";
import {ClusterCreatorStoreContext} from "@/views/cluster-creator/context";


export const schemaAddWorkload = Yup.object({
    name: Yup.string().required("Workload name is required").strict().trim(),
    content: Yup.string().required("Workload content is required").strict().trim()
})

type Props = {
    onClose: () => void;
    selectedWorkloadId?: string | null;
}
const CreatorWorkloadsDialog = (props: Props) => {
    const creatorStore = useContext(ClusterCreatorStoreContext);

    const [initialValues, setInitialValues] = useState({
        id: "",
        name: "",
        content: ""
    } as ClusterResource)

    const [lastError, setLastError] = useState("")

    useEffect(() => {
        if (props.selectedWorkloadId) {
            const resFromStore = creatorStore.k8SResources.find(e => e.name === props.selectedWorkloadId);
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
            if (props.selectedWorkloadId) {
                creatorStore.updateCustomK8SResources(props.selectedWorkloadId, values);
            } else {
                creatorStore.addCustomK8SResources(values)
            }

            props.onClose();
        }
    })

    const onDelete = () => {
        if (props.selectedWorkloadId) {
            creatorStore.deleteCustomK8SResources(props.selectedWorkloadId);
            props.onClose();
        } else {
            console.error("Kubernetes resource is not selected")
        }
    }

    return (
        <Dialog header={props.selectedWorkloadId ? "Edit workload" : "New workload"}
                className="w-[95vw] h-[95vh] lg:w-[80vw] lg:h-[80vh] 2xl:w-[70vw] 2xl:h-[70vh]"
                visible modal draggable={false} closable={true}
                maximizable
                onHide={() => props.onClose()}
                footer={<div className="flex justify-between">
                    <div className="flex">
                        {props.selectedWorkloadId &&
                            <>
                                <Button onClick={onDelete}
                                        type="button"
                                        outlined
                                        className="p-button-danger">
                                    Delete
                                </Button>

                            </>}
                    </div>
                    <div>
                        <Button
                            onClick={formik.submitForm}
                            disabled={!formik.isValid}
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
                            value={formik.values.name}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            className="w-full p-inputtext-sm"></InputText>
                        <FormError error={formik.errors.name} touched={formik.touched.name}/>
                    </div>
                </div>
                <div className="grow flex flex-col min-w-[300px] min-h-[300px]">
                    <div className="mr-1 required">Content:</div>
                    <InputTextarea
                        name="content"
                        className="grow font-monospace"
                        readOnly={formik.isSubmitting}
                        value={formik.values.content}
                        onBlur={formik.handleBlur}
                        onChange={(e) => {
                            formik.setFieldValue("content", e.target.value);
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

export default observer(CreatorWorkloadsDialog);