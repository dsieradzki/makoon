package service

import "golang.org/x/crypto/bcrypt"

type PasswordEncoder struct {
}

func (PasswordEncoder) EncodeUsingBCrypt(pass string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(pass), bcrypt.DefaultCost)
	res := string(hash)
	return res, err
}
