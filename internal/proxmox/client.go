package proxmox

import (
	"errors"
	"fmt"
	"github.com/dsieradzki/K4Prox/internal/utils"
	log "github.com/sirupsen/logrus"
	"net/http"
)

func NewProxmoxClient() *Client {
	proxmox := &Client{}
	return proxmox
}

type Client struct {
	proxmoxHost string
	proxmoxPort int
	proxmoxNode string
	session     *SessionData
}

func (p *Client) GetSession() SessionData {
	return *p.session
}

func (p *Client) LoginToProxmox(username string, password string, proxmoxHost string, proxmoxPort int) error {
	p.proxmoxHost = proxmoxHost
	p.proxmoxPort = proxmoxPort
	var proxmoxSession Response[SessionData]
	encodedPassword := utils.PathEscape(password)
	err := request(
		POST,
		ApplicationWwwFormUrlEncoded,
		p.endpoint(fmt.Sprintf("/access/ticket?password=%s", encodedPassword)),
		NoHeaders(),
		NoCookies(),
		fmt.Sprintf("username=%s@pam", username),
		&proxmoxSession,
	)
	if err != nil {
		return err
	}
	p.session = &proxmoxSession.Data
	proxmoxNode, err := p.DetermineProxmoxNodeName()
	p.proxmoxNode = proxmoxNode
	return err

}

func (p *Client) endpoint(e string) string {
	return fmt.Sprintf("https://%s:%d/api2/json%s", p.proxmoxHost, p.proxmoxPort, e)
}

func (p *Client) Get(api string, resp interface{}) error {
	return request(GET, ApplicationJson, p.endpoint(api), p.proxmoxHeaders(), p.proxmoxCookies(), nil, resp)
}

func (p *Client) Post(api string, body interface{}, resp interface{}) error {
	return request(POST, ApplicationJson, p.endpoint(api), p.proxmoxHeaders(), p.proxmoxCookies(), body, resp)
}

func (p *Client) Put(api string, body interface{}, resp interface{}) error {
	return request(PUT, ApplicationJson, p.endpoint(api), p.proxmoxHeaders(), p.proxmoxCookies(), body, resp)
}

func (p *Client) proxmoxHeaders() http.Header {
	return http.Header{
		"CSRFPreventionToken": {p.session.CSRFPreventionToken},
	}
}

func (p *Client) proxmoxCookies() []http.Cookie {
	return []http.Cookie{
		{
			Name:  "PVEAuthCookie",
			Value: p.session.Ticket,
		},
	}
}

func (p *Client) DetermineProxmoxNodeName() (string, error) {
	type node struct {
		NodeName string `json:"node"`
	}
	type nodeData struct {
		Data []node `json:"data"`
	}
	var nodesData nodeData
	err := p.Get(fmt.Sprintf("/nodes"), &nodesData)
	if err != nil {
		return "", err
	}

	for _, node := range nodesData.Data {
		networks, fErr := p.GetNetworkBridges(node.NodeName)
		if fErr != nil {
			return "", fErr
		}
		for _, network := range networks {
			if network.Address == p.proxmoxHost {
				return node.NodeName, nil
			}
		}
	}
	if len(nodesData.Data) == 1 {
		log.Warn("cannot match proxmox node with provided IP address, but there is only one node so it's still ok")
		return nodesData.Data[0].NodeName, nil
	}
	return "", errors.New("cannot determine Proxmox node name")
}

func (p *Client) GetProxmoxNodeName() string {
	return p.proxmoxNode
}

func (p *Client) GetProxmoxHost() string {
	return p.proxmoxHost
}
