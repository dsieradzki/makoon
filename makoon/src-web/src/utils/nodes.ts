import {ClusterNode, ClusterNodeType} from "@/api/model";

export function generateNode(iNodes: ClusterNode[], nodeType: ClusterNodeType, defaultMasterNode: ClusterNode): ClusterNode {
    let nodes = iNodes.slice();

    const latestNodeWithNodeType: ClusterNode | null = nodes
            .sort(vmIdDesc)
            .find((e: ClusterNode) => e.nodeType === nodeType)
        || null;

    if (latestNodeWithNodeType == null) {
        const anyNode: ClusterNode | null =
            nodes.length > 0
                ? nodes.sort(vmIdAsc)[0]
                : null;
        if (anyNode == null) {
            return defaultMasterNode;
        } else {
            const nodeBaseOnAnotherType = createNextNodeDefinition(
                anyNode,
                nodeType == "worker"
                    ? nodes.length > 5 ? nodes.length : 5
                    : -5);
            nodeBaseOnAnotherType.name = nodeType + "-1"

            nodeBaseOnAnotherType.nodeType = nodeType;
            return nodeBaseOnAnotherType;
        }

    }
    return createNextNodeDefinition(latestNodeWithNodeType);
}

function createNextNodeDefinition(node: ClusterNode, step = 1): ClusterNode {
    const namePrefix = node.name.substring(0, node.name.lastIndexOf("-"))
    const nameNumber = node.name.substring(node.name.lastIndexOf("-") + 1)

    const lastOctetIdx = node.ipAddress.lastIndexOf(".");
    const firstOctets = node.ipAddress.substring(0, lastOctetIdx + 1);
    const lastOctet = node.ipAddress.substring(lastOctetIdx + 1);
    return {
        vmId: node.vmId + step,
        storagePool: node.storagePool,
        cores: node.cores,
        memory: node.memory,
        nodeType: node.nodeType,
        name: namePrefix + "-" + (Number(nameNumber) + step).toString(),
        ipAddress: firstOctets + (Number(lastOctet) + step).toString()
    }
}

function vmIdAsc(a: ClusterNode, b: ClusterNode): number {
    return a.vmId - b.vmId;
}

function vmIdDesc(a: ClusterNode, b: ClusterNode): number {
    return b.vmId - a.vmId;
}
