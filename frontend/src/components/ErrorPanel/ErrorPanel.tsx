import React from 'react';
import { observer } from "mobx-react-lite";
import applicationStore from "@/store/applicationStore";
import "./ErrorPanel.css"
import { BrowserOpenURL } from "@wails-runtime/runtime";
import { ISSUE_TRACKER_URL, LOG_FILE_NAME_1, LOG_FILE_NAME_2 } from "@/constants";
import { Button } from "primereact/button";

const ErrorPanel = () => {
    const renderError = () => {
        return applicationStore.error
    }

    const openIssueTracker = () => {
        BrowserOpenURL(ISSUE_TRACKER_URL)
    }

    if (applicationStore.isError()) {
        return (
            <div className="p-4 error-panel flex justify-between">
                <div>
                    <div className="font-bold">Application error:</div>
                    <div>{renderError()}</div>
                    <div className="mt-4">
                        <div className="font-bold">Please create issue on application <span onClick={openIssueTracker}
                                                                                            className="underline cursor-pointer">GitHub</span> project.
                        </div>
                        <div>
                            Attach log file to the issue from location
                            <span className="underline mx-1">[{LOG_FILE_NAME_1}]</span>
                            or
                            <span className="underline mx-1">[{LOG_FILE_NAME_2}]</span>
                            on macOS, and describe scenario how to reproduce problem.
                        </div>
                    </div>
                </div>
                <div className="flex items-center">
                    <Button
                        onClick={() => applicationStore.clearError()}
                        icon="pi pi-times"
                        className="p-button-rounded p-button-danger" aria-label="Close"/>
                </div>
            </div>
        );
    } else {
        return null
    }
};
export default observer(ErrorPanel);