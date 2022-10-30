import React from 'react';
import { Navigate, Route, Routes } from "react-router-dom";
import LoginView from "@/views/Login/LoginView";
import ClusterWizardView, { ClusterWizardStoreContext } from "@/views/ClusterWizard/ClusterWizardView";
import ClusterListView from "@/views/ClusterList/ClusterListView";
import ClusterManagementView from "@/views/ClusterManagement/ClusterManagementView";
import { ClusterWizardStore } from "@/store/clusterWizardStore";
import FirstSetupView from "@/views/FirstSetup/FirstSetupView";

const Router = () => {
    return <Routes>
        <Route path={"/"} element={<Navigate to="/login" replace/>}/>
        <Route path={"/setup"} element={<FirstSetupView/>}/>
        <Route path={"/login"} element={<LoginView/>}/>
        <Route path={"/cluster/:clusterName"} element={<ClusterManagementView/>}/>
        <Route path={"/list"} element={<ClusterListView/>}/>
        <Route path={"/new-cluster"} element={
            <ClusterWizardStoreContext.Provider value={new ClusterWizardStore()}>
                <ClusterWizardView/>
            </ClusterWizardStoreContext.Provider>
        }/>
    </Routes>;
};

export default Router;