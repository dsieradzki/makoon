import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { Formik, useFormik } from "formik";
import * as Yup from 'yup';
import { Login } from "@wails/auth/Service";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import LogoContainer from "@/components/LogoContainer";
import { FormikHelpers } from "formik/dist/types";
import FormError from "@/components/FormError";

type FormValues = {
    host: string
    username: string
    password: string
}

const schema = Yup.object().shape({
    host: Yup.string().required(),
    username: Yup.string().required(),
    password: Yup.string().required()
});

const initialValues: FormValues = {host: "", username: "", password: ""}

const LoginView = () => {
    const [loginError, setLoginError] = useState(false)
    const navigate = useNavigate()

    const formik = useFormik<FormValues>({
        validateOnMount: true,
        initialValues: initialValues,
        validationSchema: schema,
        onSubmit: async (values: FormValues, formikHelpers: FormikHelpers<any>) => {
            try {
                await Login(values.username, values.password, values.host);
                setLoginError(false)
                navigate("/project")
            } catch (err) {
                setLoginError(true)
            }
            formikHelpers.setSubmitting(false);
        }
    })
    return <LogoContainer>
        <form onSubmit={formik.handleSubmit} className="flex flex-col items-center">
            <div className="mt-14 w-full max-w-[400px]">
                <div className="text-lg font-bold">Proxmox host:</div>
                <div className="flex items-center">
                    <InputText name="host"
                               value={formik.values.host}
                               onChange={formik.handleChange}
                               onBlur={formik.handleBlur}
                               className="w-[330px]"
                               placeholder="192.168.1.10"></InputText>
                    <div className="ml-1">:8006, :22</div>
                </div>
                <FormError error={formik.errors.host} touched={formik.touched.host}/>
            </div>

            <div className="mt-1 w-full max-w-[400px]">
                <div className="text-lg font-bold">Proxmox username:</div>
                <div className="flex items-center">
                    <InputText
                        name="username"
                        value={formik.values.username}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className="w-[330px]" placeholder="root"></InputText>
                    <div className="ml-1">@pam</div>
                </div>
                <FormError error={formik.errors.username} touched={formik.touched.username}/>
            </div>

            <div className="mt-1 w-full max-w-[400px]">
                <div className="text-lg font-bold">Proxmox password:</div>
                <Password
                    name="password"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    feedback={false}
                    toggleMask={true}
                    className="w-full" inputClassName="w-full">
                </Password>
                <FormError error={formik.errors.password} touched={formik.touched.password}/>

            </div>

            {
                loginError &&
                <div className="mt-6 font-bold p-error">
                    Cannot login to Proxmox
                </div>
            }

            <div className="mt-10">
                <Button type="submit" disabled={!formik.isValid}>
                    {formik.isSubmitting && <i className="pi pi-spin pi-spinner text-base mr-2"></i>}
                    Login to Proxmox
                </Button>
            </div>
        </form>
        <div className="mt-10 text-stone-600 text-center">
            Copyright (c) 2022 Damian Sieradzki
        </div>
    </LogoContainer>
}

export default LoginView