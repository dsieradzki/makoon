package proxmox

import (
	log "github.com/sirupsen/logrus"
	"strconv"
	"strings"
)

type (
	VmDefinition map[string]interface{}
)

const (
	NodeName     = "node"
	Vmid         = "vmid"
	Name         = "name"
	Cores        = "cores"
	Memory       = "memory"
	Ostype       = "ostype"
	Boot         = "boot"
	BootDisk     = "bootdisk"
	ScsiHW       = "scsihw"
	Vga          = "vga"
	CiNameserver = "nameserver"
	CiUser       = "ciuser"
	CiPassword   = "cipassword"
	CiSshKeys    = "sshkeys"
)

type Response[T any] struct {
	Data T `json:"data"`
}

type SessionData struct {
	CSRFPreventionToken string `json:"CSRFPreventionToken"`
	Ticket              string `json:"ticket"`
	Username            string `json:"username"`
}

type VmStatus string

const VmStatusRunning VmStatus = "running"
const VmStatusStopped VmStatus = "stopped"

type VmStatusData struct {
	Status VmStatus `json:"status"`
}

type Network struct {
	Iface   string `json:"iface"`
	Address string `json:"address"`
	Gateway string `json:"gateway"`
	CIDR    string `json:"cidr"`
}

func (n *Network) GetCIDRSubMask() uint8 {
	sep := strings.Index(n.CIDR, "/")
	mask := n.CIDR[sep+1 : len(n.CIDR)]
	maskI, err := strconv.ParseInt(mask, 10, 0)
	if err != nil {
		log.Error("cannot parse subnet mask")
		return 0
	}
	return uint8(maskI)
}

type Storage struct {
	StorageName string `json:"storage"`
	Content     string `json:"content"`
}
