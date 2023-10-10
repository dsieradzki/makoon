import Panel from "@/components/Panel";
import React from "react";
import {observer} from "mobx-react-lite";
import clustersListStore from "@/store/clusters-list-store";

const UsedResourcesPanel = () => {
    return <Panel title="Used resources" icon="pi-server" className="mb-8">
        <div className="flex justify-evenly">
            <div className="m-4 flex flex-col items-center">
                <div className="text-3xl flex items-center">
                    {clustersListStore.cpuSum}
                    <div className="relative" style={{top: "-10px", left: "5px"}}>
                        <div className="absolute text-sm">cores</div>
                    </div>
                </div>
                <div className="text-sm">CPU</div>
            </div>

            <span className="border-r-2 border-bg rounded-full mx-8 w-[0px]"></span>

            <div className="m-4 flex flex-col items-center">
                <div className="text-3xl flex items-center">
                    {clustersListStore.ramSum}
                    <div className="relative" style={{top: "-10px", left: "5px"}}>
                        <div className="absolute text-sm">MiB</div>
                    </div>
                </div>
                <div className="text-sm">MEMORY</div>
            </div>

            <span className="border-r-2 border-bg rounded-full mx-8 w-[0px]"></span>

            <div className="m-4 flex flex-col items-center">
                <div className="text-3xl flex items-center">
                    {clustersListStore.disksSizeSum}
                    <div className="relative" style={{top: "-10px", left: "5px"}}>
                        <div className="absolute text-sm">GiB</div>
                    </div>
                </div>
                <div className="text-sm">STORAGE</div>
            </div>
        </div>
    </Panel>
}

export default observer(UsedResourcesPanel);