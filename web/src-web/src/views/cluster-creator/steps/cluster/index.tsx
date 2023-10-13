import React, {useContext, useEffect, useImperativeHandle, useState} from 'react';
import {InputText} from "primereact/inputtext";
import * as Yup from "yup";
import {useFormik} from "formik";
import {FormikHelpers} from "formik/dist/types";
import {Dropdown} from "primereact/dropdown";
import {InputNumber} from "primereact/inputnumber";
import {observer} from "mobx-react-lite";
import {ClusterSettingsModel} from "@/store/cluster-creator-store";
import {apiCall} from "@/utils/api";
import {hostnameEnd, hostnameMain, hostnameStart} from "@/utils/patterns";
import api from "@/api/api";
import {AvailableNetwork} from "@/api/model";
import FormError from "@/components/FormError";
import {ClusterCreatorStoreContext, CreatorNavigation, StepProps} from "@/views/cluster-creator/context";
import clustersListStore from "@/store/clusters-list-store";

const renderDescription = (description: string) => {
    return <div className="min-w-[40%] max-w-[40%]">
        <div className="font-bold">Description:</div>
        <div>{description}</div>
    </div>
}

const renderSectionHead = (name: string) => {
    return <div className="text-xl my-3">
        {name}
    </div>
}

const ClusterStep = (props: StepProps, ref: any) => {
    useImperativeHandle(ref, () => ({
        async next(): Promise<void> {
            await formik.submitForm();
            await props.onNext();
        },
        async previous(): Promise<void> {
            await props.onPrevious();
        },
    } as CreatorNavigation));
    const [networks, setNetworks] = useState<AvailableNetwork[]>([])
    const clusterStore = useContext(ClusterCreatorStoreContext)
    const storedModel = clusterStore.clusterSettings;
    const settings = clusterStore.settings;

    const getClusterNames = (): string[] => {
        return clustersListStore.clusters.map(e => e.name)
    }
    const schema = Yup.object().shape({
        clusterName: Yup.string()
            .required("Cluster name is required")
            .strict()
            .trim()
            .max(128)
            .matches(hostnameStart, {message: "Name can start with characters: a-z, A-Z, 0-9"})
            .matches(hostnameMain, {message: "Name can contain characters: a-z, A-Z, 0-9, -"})
            .matches(hostnameEnd, {message: "Name can end with characters: a-z, A-Z, 0-9"})
            .test({
                name: "is-name-available",
                message: "Cluster name is already used",
                test: (val) => {
                    const foundCluster = getClusterNames().find(e => e === val);
                    return foundCluster == null
                },
                exclusive: false
            }),
        nodeUsername: Yup.string().required("Username is required").strict().trim(),
        nodePassword: Yup.string().required("Password is required").strict().trim(),
        diskSize: Yup.number().required("Disk size is required"),
        network: Yup.object().shape({
            bridge: Yup.string().required("Bridge is required"),
            subnetMask: Yup.number().required("Subnet mask is required"),
            gateway: Yup.string().required("Gateway address is required").strict().trim(),
            dns: Yup.string().required("DNS address is required").strict().trim(),
        })
    });

    const formik = useFormik<ClusterSettingsModel>({
        validateOnMount: true,
        initialValues: storedModel,
        validationSchema: schema,
        enableReinitialize: true,
        onSubmit: async (values: ClusterSettingsModel, formikHelpers: FormikHelpers<any>) => {
            clusterStore.updateClusterSettings(values)
            formikHelpers.resetForm()
        },
        onReset: (_: ClusterSettingsModel, formikHelpers: FormikHelpers<any>) => {
        }
    })


    useEffect(() => {
        props.nextDisabled(!formik.isValid)
        props.previousDisabled(false);
    }, [formik.isValid]);

    useEffect(() => {
        if (settings.node && settings.node.length > 0) {
            apiCall(() => api.networks.bridges(settings.node))
                .then(d => {
                    setNetworks(d);
                })
        }
    }, [settings.node]);

    return (
        <>
            <form onSubmit={formik.handleSubmit} onReset={formik.handleReset}>
                <div className="flex flex-col"
                     style={{backgroundColor: "var(--color-background)"}}>

                    {renderSectionHead("General")}
                    <div className="flex mt-3 mb-4">
                        <div className="grow flex flex-col pr-5">
                            <div className="text-stone-400 required">Cluster name</div>
                            <InputText name="clusterName"
                                       className="w-full p-inputtext-sm"
                                       value={formik.values.clusterName}
                                       onChange={formik.handleChange}
                                       onBlur={formik.handleBlur}/>

                            <FormError error={formik.errors.clusterName} touched={formik.touched.clusterName}/>
                        </div>
                        {renderDescription("Cluster name will be used to identify your cluster in application and as prefix for all nodes.")}
                    </div>
                    {renderSectionHead("User")}
                    <div className="flex mt-3 mb-4">
                        <div className="grow flex flex-col pr-5">
                            <div>
                                <div className="text-stone-400 required">Node Username</div>
                                <InputText name="nodeUsername"
                                           className="w-full p-inputtext-sm"
                                           value={formik.values.nodeUsername}
                                           onChange={formik.handleChange}
                                           onBlur={formik.handleBlur}/>
                                <FormError error={formik.errors.nodeUsername} touched={formik.touched.nodeUsername}/>
                            </div>
                            <div className="mt-3 text-stone-400">
                                <div
                                    title="Application will generate SSH key for node access, authentication via password is disabled by default">
                                    <span className="required">Node Password</span> <p
                                    className="ml-1 pi pi-exclamation-triangle text-warning"
                                    style={{fontSize: "1rem"}}></p></div>
                                <InputText name="nodePassword"
                                           className="w-full p-inputtext-sm"
                                           value={formik.values.nodePassword}
                                           onChange={formik.handleChange}
                                           onBlur={formik.handleBlur}/>

                                <FormError error={formik.errors.nodePassword} touched={formik.touched.nodePassword}/>
                            </div>
                        </div>
                        {renderDescription("Username and password will be used for all nodes. " +
                            "Application will generate SSH key for node access, authentication via password is disabled by default.")}
                    </div>

                    {renderSectionHead("Storage")}
                    <div className="flex mt-3">
                        <div className="grow flex flex-col pr-5">
                            <div>
                                <div className="text-stone-400 required">Disks size (GiB)</div>
                                <InputNumber name="diskSize"
                                             className="w-full p-inputtext-sm"
                                             value={formik.values.diskSize}
                                             onChange={v => {
                                                 formik.setFieldValue("diskSize", v.value, true)
                                             }}
                                             onBlur={formik.handleBlur}
                                             showButtons
                                             buttonLayout="horizontal" incrementButtonIcon="pi pi-plus"
                                             decrementButtonIcon="pi pi-minus" min={1}/>

                                <FormError error={formik.errors.diskSize} touched={formik.touched.diskSize}/>
                            </div>
                        </div>
                        {renderDescription("Common disk size for each node. Storage pool can be selected separately for each node in node properties.")}
                    </div>

                    {renderSectionHead("Network")}
                    <div className="flex mt-3">
                        <div className="grow flex flex-col pr-5">
                            <div>
                                <div className="text-stone-400 required">Network bridge</div>
                                <Dropdown name="network.bridge"
                                          className="w-full"
                                          value={formik.values.network.bridge}
                                          optionValue={"iface"}
                                          optionLabel={"iface"}
                                          itemTemplate={(option: AvailableNetwork) => {
                                              return <div>{option.iface}{option.address ? ` - ${option.address}` : ""}</div>
                                          }}
                                          onChange={formik.handleChange}
                                          options={networks}/>
                            </div>
                            <div className="mt-2">
                                <div className="text-stone-400 required">Subnet mask (CIDR Notation)</div>
                                <InputNumber name="network.subnetMask"
                                             className="w-full p-inputtext-sm"
                                             value={formik.values.network.subnetMask}
                                             onChange={v => {
                                                 formik.setFieldValue("network.subnetMask", v.value, true)
                                             }}
                                             onBlur={formik.handleBlur}
                                             showButtons
                                             buttonLayout="horizontal" incrementButtonIcon="pi pi-plus"
                                             decrementButtonIcon="pi pi-minus" min={1}/>

                                <FormError error={formik.errors.network?.subnetMask}
                                           touched={formik.touched.network?.subnetMask}/>
                            </div>
                            <div className="mt-2">
                                <div className="text-stone-400 required">Gateway</div>
                                <InputText name="network.gateway"
                                           className="w-full p-inputtext-sm"
                                           value={formik.values.network.gateway}
                                           onChange={formik.handleChange}
                                           onBlur={formik.handleBlur}/>

                                <FormError error={formik.errors.network?.gateway}
                                           touched={formik.touched.network?.gateway}/>
                            </div>
                            <div className="mt-2">
                                <div className="text-stone-400 required">DNS server</div>
                                <InputText name="network.dns"
                                           className="w-full p-inputtext-sm"
                                           value={formik.values.network.dns}
                                           onChange={formik.handleChange}
                                           onBlur={formik.handleBlur}/>

                                <FormError error={formik.errors.network?.dns}
                                           touched={formik.touched.network?.dns}/>
                            </div>
                        </div>
                        {renderDescription("Network settings for all nodes. Node IP address can be selected separately in the node properties.")}
                    </div>
                </div>
            </form>
        </>
    );
};

export default observer(React.forwardRef(ClusterStep));