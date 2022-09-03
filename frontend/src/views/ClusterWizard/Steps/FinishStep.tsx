import React from 'react';
import Block from "@/components/Block";
import { BrowserOpenURL, LogDebug, LogError } from "@wails-runtime/runtime";
import { SaveKubeConfigDialog, SaveSshAuthorizationKeyDialog, SaveSshPrivateKeyDialog } from "@wails/project/Service";

const FinishStep = () => {
    const onSaveKubeConfig = async function () {
        try {
            await SaveKubeConfigDialog();
            LogDebug("kube config saved")
        } catch (err: any) {
            LogError(err)
        }
    }
    const onSaveSshPrivateKey = async function () {
        try {
            await SaveSshPrivateKeyDialog();
            LogDebug("ssh private key saved")
        } catch (err: any) {
            LogError(err)
        }

    }
    const onSaveSshAuthorizationKey = async function () {
        try {
            await SaveSshAuthorizationKeyDialog();
            LogDebug("ssh private key saved")
        } catch (err: any) {
            LogError(err)
        }
    }
    const giveStart = async function () {
        BrowserOpenURL("https://github.com/dsieradzki/k4prox")
    }

    return (
        <div className="w-full pt-20 flex items-center flex-col">
            <div className="text-7xl">Cluster is ready!</div>

            <div></div>
            <div className="mt-10 mb-10 w-full flex justify-center">
                <div className="text-amber-600">Project file contains sensitive data, keep it safe.</div>
            </div>
            <div className="w-full flex justify-center">
                <Block onClick={onSaveKubeConfig} className="mr-20 flex justify-center items-center w-[200px] h-[200px]">
                    <div className="flex flex-col items-center justify-center">
                        <i className="pi pi-cloud text-stone-400" style={{fontSize: "5rem"}}></i>
                        <span className="mt-5 text-center">Save Kubernetes config</span>
                    </div>
                </Block>
                <Block onClick={onSaveSshPrivateKey} className="mr-10 flex justify-center items-center w-[200px] h-[200px]">
                    <div className="flex flex-col items-center justify-center">
                        <i className="pi pi-key text-stone-400" style={{fontSize: "5rem"}}></i>
                        <span className="mt-5 text-center">Save ssh private key</span>
                    </div>
                </Block>
                <Block onClick={onSaveSshAuthorizationKey} className="flex justify-center items-center w-[200px] h-[200px]">
                    <div className="flex flex-col items-center justify-center">
                        <i className="pi pi-key text-stone-400" style={{fontSize: "5rem"}}></i>
                        <span className="mt-5 text-center">Save ssh authorization key</span>
                    </div>
                </Block>
            </div>
            <div className="mt-14 flex flex-col items-center">
                <div onClick={giveStart} className="cursor-pointer text-xl"><p className="pi pi-star primary-text-color"></p> dsieradzki/k4prox
                    on GitHub
                </div>
            </div>
        </div>
    );
};

export default FinishStep;