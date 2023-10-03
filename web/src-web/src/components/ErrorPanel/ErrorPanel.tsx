import React from 'react';
import { observer } from "mobx-react-lite";
import "./ErrorPanel.css"
import { ISSUE_TRACKER_URL } from "@/constants";
import { Button } from "primereact/button";
import applicationStore from "@/store/application-store";

const ErrorPanel = () => {
    const renderError = () => {
        return applicationStore.error
    }

    const openIssueTracker = () => {
        window.open(ISSUE_TRACKER_URL, '_blank', 'noreferrer');
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