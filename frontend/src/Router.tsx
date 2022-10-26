import React from 'react';
import { Navigate, Route, Routes } from "react-router-dom";
import LoginView from "@/views/LoginView";
import ProjectView from "@/views/ProjectView";
import ClusterWizardView from "@/views/ClusterWizard/ClusterWizardView";
import ClusterManagementView from "@/views/ClusterManagement/ClusterManagementView";

const Router = () => {
    return <Routes>
        <Route path={"/"} element={<Navigate to="/login" replace/>}/>
        <Route path={"/login"} element={<LoginView/>}/>
        <Route path={"/cluster"} element={<ClusterManagementView/>}/>
        <Route path={"/project"} element={<ProjectView/>}/>
        <Route path={"/cluster-planner"} element={<ClusterWizardView/>}/>
        <Route path={"/cluster-planner-in-progress"} element={<ClusterWizardView step={1}/>}/>
    </Routes>;
};

export default Router;