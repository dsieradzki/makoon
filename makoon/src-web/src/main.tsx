import React from 'react'
import { createRoot } from 'react-dom/client'
import './style.css'
import App from './App'
import { createBrowserRouter, createHashRouter, HashRouter, RouterProvider } from 'react-router-dom'


import { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker"
import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker"
import cssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker"
import htmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker"
import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker"
import axios from "axios";

self.MonacoEnvironment = {
    getWorker(_, label) {
        if (label === "json") {
            return new jsonWorker()
        }
        if (label === "css" || label === "scss" || label === "less") {
            return new cssWorker()
        }
        if (label === "html" || label === "handlebars" || label === "razor") {
            return new htmlWorker()
        }
        if (label === "typescript" || label === "javascript") {
            return new tsWorker()
        }
        return new editorWorker()
    }
}

loader.config({monaco});

loader.init().then(/* ... */);


const container = document.getElementById('root')

const root = createRoot(container!)

export const router = createHashRouter(
    [
        // match everything with "*"
        {path: "*", element: <App/>}
    ],
    {
        basename: "/"
    })
axios.interceptors.response.use(response => response, error => {
    if (error?.response?.status === 401) {
        console.warn("Unauthenticated request. Redirect to login page");
        router.navigate("/login")
            .then(() => {
                console.warn("Redirected after unauthenticated request")
            })
    }
    return Promise.reject(error);
});


root.render(
    <React.StrictMode>
        <RouterProvider router={router}/>
    </React.StrictMode>
)
