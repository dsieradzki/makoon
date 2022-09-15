import React from 'react';
import { Navigate, Route, Routes } from "react-router-dom";
import LoginView from "@/views/LoginView";
import ProjectView from "@/views/ProjectView";
import ClusterWizardView from "@/views/ClusterWizard/ClusterWizardView";

const Router = () => {
    return <Routes>
        <Route path={"/"} element={<Navigate to="/login" replace/>}></Route>
        <Route path={"/login"} element={<LoginView/>}></Route>
        <Route path={"/project"} element={<ProjectView/>}></Route>
        <Route path={"/cluster-planner"} element={<ClusterWizardView/>}></Route>
        <Route path={"/cluster-open-not-provisioned"} element={<ClusterWizardView step={1}/>}></Route>
        <Route path={"/cluster-is-ready"} element={<ClusterWizardView step={3}/>}></Route>
    </Routes>;
};

export default Router;