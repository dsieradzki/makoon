import React from 'react';
import {Navigate, Route, Routes} from "react-router-dom";
import ClusterList from "@/views/cluster-list";
import ClusterManagement from "@/views/clusters-management";
import Nodes from "@/views/clusters-management/components/nodes";
import Apps from "@/views/clusters-management/components/apps";
import Workloads from "@/views/clusters-management/components/workloads";
import Login from "@/views/login";
import Logs from "@/views/clusters-management/components/cluster-logs";

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
        <Route path={"/login"} element={<Login/>}/>
        <Route path={"/list"} element={
            <Guard>
                <ClusterList/>
            </Guard>
        }/>

        <Route path={"/cluster/:clusterName"} element={
            <Guard>
                <ClusterManagement/>
            </Guard>
        }>
            <Route path={""} element={<Navigate to={"nodes"} replace/>}/>
            <Route path={"nodes"} element={<Nodes/>}/>
            <Route path={"apps"} element={<Apps/>}/>
            <Route path={"workloads"} element={<Workloads/>}/>
            <Route path={"logs"} element={<Logs/>}/>
        </Route>
    </Routes>;
};

export default Router;