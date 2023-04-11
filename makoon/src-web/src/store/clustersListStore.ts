import { makeAutoObservable, runInAction } from "mobx";
import { apiCall } from "@/utils/api";
import { ClusterHeader } from "@/api/model";
import api from "@/api/api";

export const LOADING_INDICATOR_LOAD_CLUSTERS = "LOADING_INDICATOR_LOAD_CLUSTERS"

class ClustersListStore {
    clusters: ClusterHeader[] = []

    constructor() {
        makeAutoObservable(this)
    }

    async loadClusters() {
        const clusters = await apiCall(() => api.clusters.getClusters(), LOADING_INDICATOR_LOAD_CLUSTERS)
        runInAction(() => {
            this.clusters = clusters
        })
    }

    get clustersSum() {
        return this.clusters.length
    }

    get nodesSum() {
        return this.clusters.reduce((acc, i) => acc + i.nodesCount, 0)
    }

    get cpuSum() {
        return this.clusters.reduce((acc, i) => acc + i.coresSum, 0)
    }

    get ramSum() {
        return this.clusters.reduce((acc, i) => acc + i.memorySum, 0)
    }

    get disksSizeSum() {
        return this.clusters.reduce((acc, i) => acc + i.diskSizeSum, 0)
    }
}


const clustersListStore = new ClustersListStore()

export default clustersListStore