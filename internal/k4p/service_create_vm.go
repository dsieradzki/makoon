package k4p

import (
	"fmt"
	"github.com/dsieradzki/k4prox/internal/proxmox"
	"github.com/dsieradzki/k4prox/internal/ssh"
	"github.com/dsieradzki/k4prox/internal/utils"
)

func (k *Service) CreateVirtualMachines(provisionRequest Cluster, keyPair ssh.RsaKeyPair) error {
	for _, val := range provisionRequest.Nodes {
		err := k.createVirtualMachine(provisionRequest, val, keyPair)
		if err != nil {
			return err
		}
	}
	return nil
}

func (k *Service) createVirtualMachine(pr Cluster, node KubernetesNode, keyPair ssh.RsaKeyPair) error {
	eventSession := k.eventCollector.Startf("[VM%d] Create Virtual Machine", node.Vmid)
	err := k.proxmoxClient.CreateVM(proxmox.VmDefinition{
		proxmox.Vmid:   node.Vmid,
		proxmox.Name:   node.Name,
		proxmox.Cores:  node.Cores,
		proxmox.Memory: node.Memory,
		proxmox.Ostype: "l26",
		"net0": fmt.Sprintf(
			"model=virtio,bridge=%s",
			pr.Network.Bridge),
	})
	if err != nil {
		eventSession.ReportError(err)
		return err
	}
	eventSession.Done()
	//
	//
	//
	eventSession = k.eventCollector.Startf("[VM%d] Import disk", node.Vmid)
	importDiskResult, err := k.proxmoxSsh.Executef(
		"qm importdisk %d %s %s", node.Vmid, k4pToysDir+"/"+linuxCloudImageFileName, node.StoragePool)

	if err != nil {
		eventSession.ReportError(err)
		return err
	}
	if importDiskResult.IsError() {
		eventSession.ReportError(importDiskResult.Error())
		return importDiskResult.Error()
	}
	eventSession.Done()
	//
	//
	//
	eventSession = k.eventCollector.Startf("[VM%d] Setup scsi controller and attach to disk", node.Vmid)
	err = k.proxmoxClient.UpdateVM(proxmox.VmDefinition{
		proxmox.Vmid:   node.Vmid,
		proxmox.ScsiHW: "virtio-scsi-pci",
		"scsi0":        fmt.Sprintf("%s:vm-%d-disk-0", node.StoragePool, node.Vmid),
	})
	if err != nil {
		eventSession.ReportError(err)
		return err
	}
	eventSession.Done()
	//
	//
	//
	eventSession = k.eventCollector.Startf("[VM%d] Resize disk to desired size", node.Vmid)
	err = k.proxmoxClient.ResizeDisk(proxmox.VmDefinition{
		proxmox.Vmid: node.Vmid,
		"disk":       "scsi0",
		"size":       fmt.Sprintf("%dG", pr.NodeDiskSize),
	})
	if err != nil {
		eventSession.ReportError(err)
		return err
	}
	eventSession.Done()
	//
	//
	//
	eventSession = k.eventCollector.Startf("[VM%d] Setup cloud init drive", node.Vmid)
	err = k.proxmoxClient.UpdateVM(proxmox.VmDefinition{
		proxmox.Vmid: node.Vmid,
		"ide2":       fmt.Sprintf("%s:cloudinit", node.StoragePool),
	})
	if err != nil {
		eventSession.ReportError(err)
		return err
	}
	eventSession.Done()
	//
	//
	//
	eventSession = k.eventCollector.Startf("[VM%d] Setup boot disk", node.Vmid)
	err = k.proxmoxClient.UpdateVM(proxmox.VmDefinition{
		proxmox.Vmid:     node.Vmid,
		proxmox.Boot:     "c",
		proxmox.BootDisk: "scsi0",
	})
	if err != nil {
		eventSession.ReportError(err)
		return err
	}
	eventSession.Done()
	//
	//
	//
	eventSession = k.eventCollector.Startf("[VM%d] Setup serial console", node.Vmid)
	err = k.proxmoxClient.UpdateVM(proxmox.VmDefinition{
		proxmox.Vmid: node.Vmid,
		"serial0":    "socket",
		proxmox.Vga:  "serial0",
	})
	if err != nil {
		eventSession.ReportError(err)
		return err
	}
	eventSession.Done()
	//
	//
	//
	eventSession = k.eventCollector.Startf("[VM%d] Setup cloud init", node.Vmid)
	encodedPublicKey := utils.PathEscape(string(keyPair.PublicKey))

	err = k.proxmoxClient.UpdateVM(proxmox.VmDefinition{
		proxmox.Vmid: node.Vmid,
		"ipconfig0": fmt.Sprintf(
			"ip=%s/%d,gw=%s",
			node.IpAddress,
			pr.Network.SubnetMask,
			pr.Network.Gateway),
		proxmox.CiNameserver: pr.Network.DnsServer,
		proxmox.CiUser:       pr.NodeUsername,
		proxmox.CiPassword:   pr.NodeUsername,
		proxmox.CiSshKeys:    encodedPublicKey,
	})
	if err != nil {
		eventSession.ReportError(err)
		return err
	}
	eventSession.Done()
	return nil
}
