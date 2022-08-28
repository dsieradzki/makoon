//go:build !production

package logfile

func PrepareLogFile() string {
	return "./" + LogFileName
}
