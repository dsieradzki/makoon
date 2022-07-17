package proxmox

import (
	"fmt"
	"github.com/dsieradzki/k4prox/internal/collect"
	"strings"
)

func (p *Client) GetStorage() ([]Storage, error) {
	var response Response[[]Storage]
	err := p.Get(fmt.Sprintf("/storage"), &response)
	return collect.Filter(response.Data, func(i Storage) bool {
		return strings.Contains(i.Content, "images")
	}), err

}
