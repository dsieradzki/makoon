package proxmox

import (
	"github.com/dsieradzki/k4prox/internal/collect"
	log "github.com/sirupsen/logrus"
	"strconv"
)

func (p *Client) CreateVM(vmd VmDefinition) error {
	vmd[NodeName] = p.proxmoxNode
	return p.Postf(vmd, NoResponse(), "/nodes/%s/qemu", vmd[NodeName])
}

func (p *Client) UpdateVM(vmd VmDefinition) error {
	vmd[NodeName] = p.proxmoxNode
	return p.Putf(vmd, NoResponse(), "/nodes/%s/qemu/%d/config", vmd[NodeName], vmd[Vmid])
}

func (p *Client) ResizeDisk(vmd VmDefinition) error {
	vmd[NodeName] = p.proxmoxNode
	return p.Putf(vmd, NoResponse(), "/nodes/%s/qemu/%d/resize", vmd[NodeName], vmd[Vmid])
}

func (p *Client) StartVM(vmid uint32) error {
	// struct{}{} Proxmox API throw error on empty body
	return p.Postf(struct{}{}, NoResponse(), "/nodes/%s/qemu/%d/status/start", p.proxmoxNode, vmid)
}

func (p *Client) ShutdownVM(vmid uint32) error {
	// struct{}{} Proxmox API throw error on empty body
	return p.Postf(struct{}{}, NoResponse(), "/nodes/%s/qemu/%d/status/shutdown", p.proxmoxNode, vmid)
}

func (p *Client) StopVM(vmid uint32) error {
	return p.Postf(NoBody(), NoResponse(), "/nodes/%s/qemu/%d/status/stop", p.proxmoxNode, vmid)
}

func (p *Client) CurrentVMStatus(vmid uint32) (VmStatus, error) {
	var status Response[VmStatusData]
	err := p.Getf(&status, "/nodes/%s/qemu/%d/status/current", p.proxmoxNode, vmid)
	return status.Data.Status, err
}

func (p *Client) GetAllUsedVMIds() ([]uint32, error) {
	// inconsistent value type in Proxmox response, consider to create issue for Proxmox
	type proxmox[T uint32 | string] struct {
		VmId T `json:"vmid"`
	}

	var result []uint32

	var responseVMs Response[[]proxmox[uint32]]
	if err := p.Getf(&responseVMs, "/nodes/%s/qemu", p.proxmoxNode); err != nil {
		return []uint32{}, err
	}

	result = append(
		result,
		collect.Map(responseVMs.Data, func(v proxmox[uint32]) uint32 {
			return v.VmId
		})...)

	var responseLXCs Response[[]proxmox[string]]
	if err := p.Getf(&responseLXCs, "/nodes/%s/lxc", p.proxmoxNode); err != nil {
		return []uint32{}, err
	}

	result = append(
		result,
		collect.Map(responseLXCs.Data, func(l proxmox[string]) uint32 {
			if id, err := strconv.ParseInt(l.VmId, 10, 0); err != nil {
				log.WithError(err).Error("cannot parse VMid")
				return 0
			} else {
				return uint32(id)
			}
		})...)

	return collect.Filter(result, collect.Not[uint32](0)), nil
}
