import React, {useContext, useEffect, useState} from 'react';
import {observer} from "mobx-react-lite";
import {Button} from "primereact/button";
import {Dialog} from "primereact/dialog";
import {HelmApp} from "@/api/model";
import {useFormik} from "formik";
import {InputText} from "primereact/inputtext";
import FormError from "@/components/FormError";
import * as Yup from "yup";
import {InputTextarea} from "primereact/inputtextarea";
import {ClusterCreatorStoreContext} from "@/views/cluster-creator/context";


const schema = Yup.object({
    releaseName: Yup.string().required().trim(),
    chartName: Yup.string().required().trim(),
    chartVersion: Yup.string().trim(),
    repository: Yup.string().required().trim(),
    namespace: Yup.string().required().trim(),
    values: Yup.string()
})
type Props = {
    onClose: () => void;
    selectedAppId?: string | null;
}
const CreatorHelmAppDialog = (props: Props) => {

    const creatorStore = useContext(ClusterCreatorStoreContext)

    const isToDelete = props.selectedAppId != null;


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


    useEffect(() => {
        if (props.selectedAppId) {
            const appFromStore = creatorStore.helmApps.find(e => e.releaseName === props.selectedAppId);
            if (appFromStore) {
                setInitialValues(appFromStore)
            }
        }
    }, [props.selectedAppId])


    const onDelete = async () => {
        if (props.selectedAppId) {
            creatorStore.deleteHelmApp(props.selectedAppId);
            props.onClose();
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
            if (props.selectedAppId) {
                creatorStore.updateHelmApp(props.selectedAppId, values);
            } else {
                creatorStore.addHelmApp(values)
            }
            props.onClose();
        }
    })

    return (
        <Dialog header={props.selectedAppId ? "Edit application" : "New application"}
                visible modal draggable={false} closable={true}
                className="w-[95vw] h-[95vh] lg:w-[80vw] lg:h-[80vh] 2xl:w-[70vw] 2xl:h-[70vh]"
                maximizable
                onHide={() => props.onClose()}
                footer={<div className="flex justify-between">
                    <div>
                        {
                            isToDelete &&
                            <Button
                                type="button"
                                onClick={onDelete}
                                className="p-button-raised p-button-danger p-button-text">
                                Delete
                            </Button>
                        }

                    </div>
                    <div className="flex">
                        <Button disabled={!formik.isValid} type="button"
                                label="Save"
                                onClick={async () => {
                                    await formik.submitForm()
                                }}
                                className="p-button-primary"/>
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
                                readOnly={formik.isSubmitting}
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
                                    readOnly={formik.isSubmitting}
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
                                    readOnly={formik.isSubmitting}
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
                                    readOnly={formik.isSubmitting}
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
                                    readOnly={formik.isSubmitting}
                                    value={formik.values.namespace}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    className="w-full p-inputtext-sm"/>
                                <FormError error={formik.errors.namespace} touched={formik.touched.namespace}/>
                            </div>
                        </div>
                    </div>
                </div>

                <span className="border-r border-bg rounded-full mx-8 w-[0px]"></span>
                <div className="grow flex flex-col min-w-[300px] min-h-[300px]">
                    <div className="mr-1">Values:</div>
                    <InputTextarea className="grow font-monospace"
                                   readOnly={formik.isSubmitting}
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

export default observer(CreatorHelmAppDialog);