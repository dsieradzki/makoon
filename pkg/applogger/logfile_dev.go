//go:build !production

package applogger

func PrepareLogFile() string {
	return "./" + LogFileName
}
