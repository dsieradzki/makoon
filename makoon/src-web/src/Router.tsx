import React from 'react';
import { Navigate, Route, RouteProps, Routes } from "react-router-dom";
import LoginView from "@/views/Login/LoginView";
import ClusterWizardView, { ClusterWizardStoreContext } from "@/views/ClusterWizard/ClusterWizardView";
import ClusterListView from "@/views/ClusterList/ClusterListView";
import ClusterManagementView from "@/views/ClusterManagement/ClusterManagementView";
import { ClusterWizardStore } from "@/store/clusterWizardStore";

type GuardProps = {
    children: React.ReactNode
}

const Guard = (props: GuardProps) => {
    const logged = document.cookie.indexOf('id=') !== -1;
    return logged
        ? <>{props.children}</>
        : <Navigate to={"/login"} replace/>
}

const Router = () => {
    return <Routes>
        <Route path={"/"} element={<Navigate to="/login" replace/>}/>
        <Route path={"/login"} element={<LoginView/>}/>
        <Route path={"/list"} element={
            <Guard>
                <ClusterListView/>
            </Guard>
        }/>

        <Route path={"/cluster/:clusterName"} element={
            <Guard>
                <ClusterManagementView/>
            </Guard>
        }/>

        <Route path={"/new-cluster"} element={
            <Guard>
                <ClusterWizardStoreContext.Provider value={new ClusterWizardStore()}>
                    <ClusterWizardView/>
                </ClusterWizardStoreContext.Provider>
            </Guard>
        }/>
    </Routes>;
};

export default Router;