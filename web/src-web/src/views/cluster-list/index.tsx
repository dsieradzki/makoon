import React, {useState} from "react";
import MainContainer from "@/components/MainContainer";
import {observer} from "mobx-react-lite";
import {Button} from "primereact/button";
import UsedResourcesPanel from "@/views/cluster-list/components/UsedResourcesPanel";
import ClusterListPanel from "@/views/cluster-list/components/ClusterListPanel";
import clustersListStore from "@/store/clusters-list-store";
import ClusterCreator from "@/views/cluster-creator";
import {useInterval} from "@/utils/hooks";

const ClusterList = () => {
    const [creatorVisible, setCreatorVisible] = useState(false);

    useInterval(async () => {
        await clustersListStore.loadClusters();
    });

    return <MainContainer header={{
        titlePrefix: "Running",
        title: "Clusters",
        content: <Button label="Create cluster" icon="pi pi-pencil" onClick={() => {
            setCreatorVisible(true);
        }}/>
    }}>
        {
            creatorVisible
                ? <ClusterCreator onHide={() => setCreatorVisible(false)}/>
                : null
        }

        <UsedResourcesPanel/>
        <ClusterListPanel/>
    </MainContainer>
}

export default observer(ClusterList);