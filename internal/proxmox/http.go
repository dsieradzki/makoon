package proxmox

import (
	"bytes"
	"crypto/tls"
	"encoding/json"
	"errors"
	"fmt"
	log "github.com/sirupsen/logrus"
	"io/ioutil"
	"net/http"
)

type HttpMethod string

func (h HttpMethod) ToString() string {
	return string(h)
}

const (
	GET    HttpMethod = "GET"
	POST   HttpMethod = "POST"
	PUT    HttpMethod = "PUT"
	DELETE HttpMethod = "DELETE"
)

type MediaType string

func (m MediaType) ToString() string {
	return string(m)
}

func NoHeaders() http.Header {
	return http.Header{}
}

func NoCookies() []http.Cookie {
	return []http.Cookie{}
}
func NoBody() interface{} {
	return nil
}
func NoResponse() interface{} {
	return nil
}

const (
	ApplicationJson              MediaType = "application/json"
	ApplicationWwwFormUrlEncoded MediaType = "application/x-www-form-urlencoded"
)

func request(
	method HttpMethod,
	mediaType MediaType,
	endpoint string,
	headers http.Header,
	cookies []http.Cookie,
	body interface{},
	resp interface{}) error {

	var data []byte
	var err error

	switch v := body.(type) {
	case string:
		data = []byte(v)
	default:
		if body != NoBody() {
			data, err = json.Marshal(v)
			if err != nil {
				return err
			}
		}
	}

	request, err := http.NewRequest(method.ToString(), endpoint, bytes.NewBuffer(data))
	if err != nil {
		return err
	}
	appHeaders := headers
	appHeaders.Add("Content-Type", mediaType.ToString())
	request.Header = headers
	for _, cookie := range cookies {
		request.AddCookie(&cookie)
	}

	response, err := httpsClient().Do(request)
	if isErrorResponse(err, response) {
		err := getErrorFromResponse(err, response)
		log.WithError(err).Error("request error")
		return err
	}

	bodyData, err := ioutil.ReadAll(response.Body)
	if err != nil {
		return err
	}
	if len(bodyData) == 0 || resp == nil {
		return nil
	}
	return json.Unmarshal(bodyData, resp)
}

func httpsClient() *http.Client {
	tr := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	}
	return &http.Client{Transport: tr}
}

func isErrorResponse(err error, res *http.Response) bool {
	return err != nil || res.StatusCode != 200
}

func getErrorFromResponse(err error, res *http.Response) error {
	if err != nil {
		return err
	} else {
		body, err := ioutil.ReadAll(res.Body)
		if err != nil {
			return err
		}
		return errors.New(fmt.Sprintf("Status [%d], body [%s]", res.StatusCode, string(body)))
	}
}
