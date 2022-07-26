import {useProjectStore} from "@/stores/projectStore";


const lbAddonName = "metallb";

export function findLastLoadBalancerIP(): string {
    const projectStore = useProjectStore();
    const addon = projectStore.microK8sAddons.find(e => e.name === lbAddonName);
    if (!addon) {
        return "";
    }
    if (!addon || addon.args.length == 0) {
        return "";
    }
    const idxOfSep = addon.args.indexOf("-");
    if (idxOfSep == -1) {
        return "";
    }
    return addon.args.substring(idxOfSep + 1);
}