import React, { useEffect, useRef } from 'react';
import Header from "@/components/Header";
import { useOnFirstMount } from "@/utils/hooks";
import clustersListStore, { LOADING_INDICATOR_LOAD_CLUSTERS } from "@/store/clustersListStore";
import Table from "@/components/Table/Table";
import { useNavigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import Section from "@/components/Section";
import Block from "@/components/Block";
import Panel from "@/components/Panel";
import processingIndicatorStoreUi from "@/store/processingIndicatorStoreUi";
import ClusterStatus from "@/views/ClusterList/ClusterStatus";
import clusterManagementStore from "@/store/clusterManagementStore";

const ClusterListView = () => {
    const navigate = useNavigate()

    useOnFirstMount(async () => {
        await clustersListStore.loadClusters()
    })
    const clusterListLoading = processingIndicatorStoreUi.status(LOADING_INDICATOR_LOAD_CLUSTERS)

    const refresh = useRef(true);
    useEffect(() => {
        const refreshInterval = setInterval(async () => {
            if (refresh.current) {
                refresh.current = false;
                await clustersListStore.loadClusters();
                refresh.current = true;
            } else {
            }
        }, 5000);
        return () => {
            clearInterval(refreshInterval);
        }
    }, [])

    const goToClusterManagement = (clusterName: string) => {
        navigate(`/cluster/${clusterName}`)
    }
    return <>
        <Header title="Clusters"/>
        <div className="flex justify-center">
            <div className="max-w-[1024px] w-[1024px] pt-4">
                <div className="flex">
                    <Panel className="grow mr-4">
                        <div className="flex justify-evenly">
                            <div className="flex flex-col items-center">
                                <div>Clusters</div>
                                <div className="font-bold">{clustersListStore.clustersSum}</div>
                            </div>
                            <div className="flex flex-col items-center">
                                <div>Nodes</div>
                                <div className="font-bold">{clustersListStore.nodesSum}</div>
                            </div>
                            <div className="flex flex-col items-center">
                                <div>CPU</div>
                                <div className="font-bold">{clustersListStore.cpuSum}</div>
                            </div>
                            <div className="flex flex-col items-center">
                                <div>RAM</div>
                                <div className="font-bold">{clustersListStore.ramSum} MB</div>
                            </div>
                            <div className="flex flex-col items-center">
                                <div>Disks size</div>
                                <div className="font-bold">{clustersListStore.disksSizeSum} GB</div>
                            </div>
                        </div>
                    </Panel>
                    <Block onClick={() => {
                        navigate("/new-cluster")
                    }}
                           tooltip="New cluster"
                           className="flex justify-center items-center h-[82px]">
                        <div className="flex items-center justify-start p-2">
                            <i className="pi pi-plus primary-text-color mr-4" style={{fontSize: "1.5rem"}}></i>
                            <span className="text-center">New cluster</span>
                        </div>
                    </Block>
                </div>
                <Section title="Clusters">
                    <Table
                        loadingInProgress={clusterListLoading}
                        length={clustersListStore.clusters.length}
                        emptyMessage="No clusters">
                        <Table.Header className="w-1/3">Name</Table.Header>
                        <Table.Header>Nodes</Table.Header>
                        <Table.Header>CPU</Table.Header>
                        <Table.Header>RAM</Table.Header>
                        <Table.Header>Disks size</Table.Header>
                        <Table.Header className="w-[1px] whitespace-nowrap"/>
                        {
                            clustersListStore.clusters.map((row) =>
                                <Table.Row
                                    key={row.name}
                                    id={row.name}
                                    onClick={goToClusterManagement}>
                                    <Table.Column className="font-bold">{row.name}</Table.Column>
                                    <Table.Column>{row.nodesCount}</Table.Column>
                                    <Table.Column>{row.coresSum} cores</Table.Column>
                                    <Table.Column>{row.memorySum} MB</Table.Column>
                                    <Table.Column>{row.diskSizeSum} GB</Table.Column>
                                    <Table.Column>
                                        <ClusterStatus className="mr-4 w-full"
                                                       status={row.status}/>
                                    </Table.Column>
                                </Table.Row>)
                        }
                    </Table>
                </Section>

            </div>
        </div>
    </>
};

export default observer(ClusterListView);