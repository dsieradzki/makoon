package proxmox

import (
	"fmt"
	"github.com/dsieradzki/k4prox/internal/collect"
	"strconv"
)

func (p *Client) CreateVM(vmd VmDefinition) error {
	vmd[NodeName] = p.proxmoxNode
	return p.Post(fmt.Sprintf("/nodes/%s/qemu", vmd[NodeName]), vmd, NoResponse())
}

func (p *Client) UpdateVM(vmd VmDefinition) error {
	vmd[NodeName] = p.proxmoxNode
	return p.Put(fmt.Sprintf("/nodes/%s/qemu/%d/config", vmd[NodeName], vmd[Vmid]), vmd, NoResponse())
}

func (p *Client) ResizeDisk(vmd VmDefinition) error {
	vmd[NodeName] = p.proxmoxNode
	return p.Put(fmt.Sprintf("/nodes/%s/qemu/%d/resize", vmd[NodeName], vmd[Vmid]), vmd, NoResponse())
}

func (p *Client) StartVM(vmid uint32) error {
	// struct{}{} Proxmox API throw error on empty body
	return p.Post(fmt.Sprintf("/nodes/%s/qemu/%d/status/start", p.proxmoxNode, vmid), struct{}{}, NoResponse())
}

func (p *Client) ShutdownVM(vmid uint32) error {
	// struct{}{} Proxmox API throw error on empty body
	return p.Post(fmt.Sprintf("/nodes/%s/qemu/%d/status/shutdown", p.proxmoxNode, vmid), struct{}{}, NoResponse())
}

func (p *Client) StopVM(vmid uint32) error {
	return p.Post(fmt.Sprintf("/nodes/%s/qemu/%d/status/stop", p.proxmoxNode, vmid), NoBody(), NoResponse())
}

func (p *Client) CurrentVMStatus(vmid uint32) (VmStatus, error) {
	var status Response[VmStatusData]
	err := p.Get(fmt.Sprintf("/nodes/%s/qemu/%d/status/current", p.proxmoxNode, vmid), &status)
	return status.Data.Status, err
}

func (p *Client) GetAllUsedVMIds() ([]uint32, error) {
	type proxmoxVM struct {
		VmId uint32 `json:"vmid"`
	}
	type proxmoxLXC struct { // inconsistent value type from Proxmox, consider to create issue for Proxmox
		VmId string `json:"vmid"`
	}

	var result []uint32

	var responseVMs Response[[]proxmoxVM]
	err := p.Get(fmt.Sprintf("/nodes/%s/qemu", p.proxmoxNode), &responseVMs)
	if err != nil {
		return []uint32{}, err
	}

	result = append(result, collect.Map(responseVMs.Data, func(v proxmoxVM) uint32 {
		return uint32(v.VmId)
	})...)

	var responseLXCs Response[[]proxmoxLXC]
	err = p.Get(fmt.Sprintf("/nodes/%s/lxc", p.proxmoxNode), &responseLXCs)
	if err != nil {
		return []uint32{}, err
	}
	result = append(result, collect.Map(responseLXCs.Data, func(l proxmoxLXC) uint32 {
		var id int64
		id, err = strconv.ParseInt(l.VmId, 10, 0)
		return uint32(id)
	})...)

	return result, err
}
