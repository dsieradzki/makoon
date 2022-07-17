package proxmox

import "fmt"

func (p *Client) GetNetworkBridges(node string) ([]Network, error) {
	var response Response[[]Network]
	err := p.Get(fmt.Sprintf("/nodes/%s/network?type=bridge", node), &response)
	return response.Data, err
}
