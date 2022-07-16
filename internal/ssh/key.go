package ssh

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/pem"
	sshlib "golang.org/x/crypto/ssh"
)

type CryptoBytes []byte

func (c *CryptoBytes) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var data string

	err := unmarshal(&data)
	if err != nil {
		return err
	}

	*c = []byte(data)
	return nil
}

func (c CryptoBytes) MarshalYAML() (interface{}, error) {
	return string(c), nil
}

type RsaKeyPair struct {
	PrivateKey CryptoBytes `json:"privateKey" yaml:"privateKey"`
	PublicKey  CryptoBytes `json:"publicKey" yaml:"publicKey"`
}

func (r *RsaKeyPair) Empty() bool {
	return len(r.PrivateKey) == 0 && len(r.PublicKey) == 0
}

func GenerateRsaKeyPair() (RsaKeyPair, error) {
	privateKey, err := rsa.GenerateKey(rand.Reader, 4096)
	if err != nil {
		return RsaKeyPair{}, err
	}

	err = privateKey.Validate()
	if err != nil {
		return RsaKeyPair{}, err
	}

	publicRsaKey, err := sshlib.NewPublicKey(&privateKey.PublicKey)
	if err != nil {
		return RsaKeyPair{}, err
	}

	pubKeyBytes := sshlib.MarshalAuthorizedKey(publicRsaKey)

	privateKeyPem := pem.EncodeToMemory(&pem.Block{
		Type:  "RSA PRIVATE KEY",
		Bytes: x509.MarshalPKCS1PrivateKey(privateKey),
	})

	return RsaKeyPair{
		PrivateKey: privateKeyPem,
		PublicKey:  pubKeyBytes,
	}, nil
}
