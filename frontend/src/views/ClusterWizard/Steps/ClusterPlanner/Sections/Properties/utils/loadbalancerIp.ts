import projectStore from "@/store/projectStore";


const lbAddonName = "metallb";

export function findLastLoadBalancerIP(): string {
    const addon = projectStore.microK8SAddons.find(e => e.name === lbAddonName);
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