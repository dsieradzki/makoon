package utils

import (
	"net/url"
	"strings"
)

func PathEscape(v string) string {
	r := url.PathEscape(v)
	r = strings.ReplaceAll(r, "+", "%2B")
	r = strings.ReplaceAll(r, "=", "%3D")
	r = strings.ReplaceAll(r, "&", "%26")
	return r
}
