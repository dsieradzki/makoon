import React from 'react'
import {createRoot} from 'react-dom/client'
import './style.css'
import App from './App'
import {createHashRouter, RouterProvider} from 'react-router-dom'
import axios from "axios";

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
