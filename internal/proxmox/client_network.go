package proxmox

func (p *Client) GetNetworkBridges(node string) ([]Network, error) {
	var response Response[[]Network]
	err := p.Getf(&response, "/nodes/%s/network?type=bridge", node)
	return response.Data, err
}
