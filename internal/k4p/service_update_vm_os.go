package k4p

import (
	log "github.com/sirupsen/logrus"
	"k4prox/internal/ssh"
	"k4prox/internal/utils"
	"time"
)

func (k *Service) UpdateVmOs(provisionRequest Cluster, keyPair ssh.RsaKeyPair) error {
	for _, node := range provisionRequest.Nodes {
		sshClient := ssh.NewSshClientKey(provisionRequest.NodeUsername, keyPair, node.IpAddress)
		eventSession := k.eventCollector.Startf("[VM%d] Update virtual machine OS", node.Vmid)

		err := utils.Retry(30, 10*time.Second, func(attempt int) error {
			log.Infof("trying to update OS packages, attempt [%d]", attempt)

			executionResult, err := sshClient.Execute(
				"sudo apt-get update && " +
					"sudo DEBIAN_FRONTEND=noninteractive apt-get upgrade -y &&" +
					" sudo DEBIAN_FRONTEND=noninteractive apt-get autoremove -y")
			if err != nil {
				return err
			}
			if executionResult.IsError() {
				return executionResult.Error()
			}
			log.Debug("OS packages updated successfully")
			log.Debug(executionResult.Output)
			return nil
		})

		if err != nil {
			eventSession.ReportError(err)
			return err
		} else {
			eventSession.Done()
		}

	}
	return nil
}
