use std::collections::HashMap;
use std::fmt::{Display, Formatter};

use serde::{Deserialize, Serialize};

#[derive(Clone)]
pub struct LoginRequest {
    pub host: String,
    pub base_path: String,
    pub port: u16,
    pub username: String,
    pub password: String,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct AccessData {
    pub host: String,
    pub base_path: String,
    pub port: u16,
    pub token: Token,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct Token {
    #[serde(rename = "CSRFPreventionToken")]
    pub csrf_prevention_token: String,
    pub ticket: String,
    pub username: String,
}

//------------- Proxmox API ----------------
#[doc = "Response data wrapper"]
#[derive(Serialize, Deserialize, Debug)]
pub struct Data<T> {
    pub data: T,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "lowercase")]
pub enum StorageType {
    BtrFS,
    CephFS,
    Cifs,
    Dir,
    Glusterfs,
    Iscsi,
    IscsiDirect,
    Lvm,
    LvmThin,
    Nfs,
    Pbs,
    Rbd,
    Zfs,
    ZfsPool,
}


impl Display for StorageType {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            StorageType::BtrFS => write!(f, "btrfs"),
            StorageType::CephFS => write!(f, "cephfs"),
            StorageType::Cifs => write!(f, "cifs"),
            StorageType::Dir => write!(f, "dir"),
            StorageType::Glusterfs => write!(f, "glusterfs"),
            StorageType::Iscsi => write!(f, "iscsi"),
            StorageType::IscsiDirect => write!(f, "iscsidirect"),
            StorageType::Lvm => write!(f, "lvm"),
            StorageType::LvmThin => write!(f, "lvmthin"),
            StorageType::Nfs => write!(f, "nfs"),
            StorageType::Pbs => write!(f, "pbs"),
            StorageType::Rbd => write!(f, "rbd"),
            StorageType::Zfs => write!(f, "zfs"),
            StorageType::ZfsPool => write!(f, "zfspool"),
        }
    }
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "lowercase")]
pub enum StorageContentType {
    Iso,
    Images,
    Rootdir,
    Vztmpl,
    Backup,
    Snippets,
}

impl Display for StorageContentType {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            StorageContentType::Iso => write!(f, "iso"),
            StorageContentType::Images => write!(f, "images"),
            StorageContentType::Rootdir => write!(f, "rootdir"),
            StorageContentType::Vztmpl => write!(f, "vztmpl"),
            StorageContentType::Backup => write!(f, "backup"),
            StorageContentType::Snippets => write!(f, "snippets")
        }
    }
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Storage {
    #[doc = "Storage name"]
    pub storage: String,

    #[doc = "Content, for example: rootdir, images, iso, vztmpl, backup"]
    pub content: String,

    #[doc = "Storage type"]
    #[serde(rename = "type")]
    pub storage_type: StorageType,

    #[doc = "Set when storage is accessible."]
    // Todo: Implement auto conversion from numeric to proper bool
    #[serde(skip_serializing_if = "Option::is_none")]
    pub active: Option<u8>,

    #[doc = "Available storage space in bytes."]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub avail: Option<u64>,

    #[doc = "Set when storage is enabled (not disabled)."]
    // Todo: Implement auto conversion from numeric to proper bool
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enabled: Option<u8>,

    #[doc = "Shared flag from storage configuration."]
    // Todo: Implement auto conversion from numeric to proper bool
    #[serde(skip_serializing_if = "Option::is_none")]
    pub shared: Option<u8>,

    #[doc = "Total storage space in bytes."]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub total: Option<u64>,

    #[doc = "Used storage space in bytes."]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub used: Option<u64>,

    #[doc = "Used fraction (used/total)."]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub used_fraction: Option<f64>,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "lowercase")]
pub enum NodeStatus {
    Unknown,
    Online,
    Offline,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Node {
    #[doc = "The cluster node name."]
    pub node: String,

    #[doc = "Node status."]
    pub status: NodeStatus,

    #[doc = "CPU utilization."]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cpu: Option<f64>,

    #[doc = "Support level."]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub level: Option<String>,

    #[doc = "Number of available CPUs."]
    #[serde(rename = "maxcpu")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_cpu: Option<u16>,

    #[doc = "Number of available memory in bytes."]
    #[serde(rename = "maxmem")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_mem: Option<u64>,

    #[doc = "Used memory in bytes."]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mem: Option<u64>,

    #[doc = "The SSL fingerprint for the node certificate."]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ssl_fingerprint: Option<String>,

    #[doc = "Node uptime in seconds."]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub uptime: Option<u64>,
}

#[derive(Clone, PartialEq, Eq, Serialize, Deserialize, Debug)]
pub enum VmStatus {
    #[serde(rename = "running")]
    Running,
    #[serde(rename = "stopped")]
    Stopped,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct VirtualMachine {
    #[doc = "Qemu process status."]
    pub status: VmStatus,

    #[doc = "The (unique) ID of the VM."]
    #[serde(rename = "vmid")]
    pub vm_id: u32,

    #[doc = "Maximum usable CPUs."]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cpus: Option<u16>,

    #[doc = "The current config lock, if any."]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub lock: Option<String>,

    #[doc = "Root disk size in bytes."]
    #[serde(rename = "maxdisk")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_disk: Option<u64>,

    #[doc = "Maximum memory in bytes."]
    #[serde(rename = "maxmem")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_mem: Option<u64>,

    #[doc = "VM name."]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,

    #[doc = "PID of running qemu process."]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pid: Option<u32>,

    #[doc = "Qemu QMP agent status."]
    #[serde(rename = "qmpstatus")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub qmp_status: Option<String>,

    #[doc = "The currently running machine type (if running)."]
    #[serde(rename = "running-machine")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub running_machine: Option<String>,

    #[doc = "The currently running QEMU version (if running)."]
    #[serde(rename = "running-qemu")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub running_qemu: Option<String>,

    #[doc = "The current configured tags, if any"]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tags: Option<String>,

    #[doc = "Uptime."]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub uptime: Option<u64>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct LxcContainer {
    #[doc = "Container name."]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,

    #[doc = "LXC Container status."]
    pub status: VmStatus,

    #[doc = "The (unique) ID of the VM."]
    #[serde(rename = "vmid")]
    pub vm_id: String,

    #[doc = "Maximum usable CPUs."]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cpus: Option<u16>,

    #[doc = "The current config lock, if any."]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub lock: Option<String>,

    #[doc = "Root disk size in bytes."]
    #[serde(rename = "maxdisk")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_disk: Option<u64>,

    #[doc = "Maximum memory in bytes."]
    #[serde(rename = "maxmem")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_mem: Option<u64>,

    #[doc = "Maximum SWAP memory in bytes."]
    #[serde(rename = "maxswap")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_swap: Option<u64>,

    #[doc = "The current configured tags, if any"]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tags: Option<String>,

    #[doc = "Uptime."]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub uptime: Option<u64>,
}

#[derive(Default, Serialize, Deserialize, Debug)]
pub enum NetworkType {
    #[serde(rename = "bridge")]
    Bridge,
    #[serde(rename = "bond")]
    Bond,
    #[serde(rename = "eth")]
    Eth,
    #[serde(rename = "alias")]
    Alias,
    #[serde(rename = "vlan")]
    Vlan,
    #[serde(rename = "OVSBridge")]
    OVSBridge,
    #[serde(rename = "OVSBond")]
    OVSBond,
    #[serde(rename = "OVSPort")]
    OVSPort,
    #[serde(rename = "OVSIntPort")]
    OVSIntPort,
    #[serde(rename = "any_bridge")]
    #[default]
    AnyBridge,
}

impl Display for NetworkType {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            NetworkType::Bridge => write!(f, "bridge"),
            NetworkType::Bond => write!(f, "bond"),
            NetworkType::Eth => write!(f, "eth"),
            NetworkType::Alias => write!(f, "alias"),
            NetworkType::Vlan => write!(f, "vlan"),
            NetworkType::OVSBridge => write!(f, "OVSBridge"),
            NetworkType::OVSBond => write!(f, "OVSBond"),
            NetworkType::OVSPort => write!(f, "OVSPort"),
            NetworkType::OVSIntPort => write!(f, "OVSIntPort"),
            NetworkType::AnyBridge => write!(f, "any_bridge")
        }
    }
}

#[derive(Default, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Network {
    #[serde(rename = "type")]
    pub network_type: NetworkType,
    pub iface: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub bridge_ports: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub address: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub gateway: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub netmask: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cidr: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub method: Option<String>,
    pub families: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub active: Option<i8>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub bridge_fd: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub bridge_stp: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub priority: Option<i16>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub autostart: Option<i8>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub method6: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub comments: Option<String>,
}

#[derive(Default, Serialize, Deserialize, Debug)]
#[serde(rename_all = "lowercase")]
pub enum OsType {
    Other,
    Wxp,
    W2k,
    W2k3,
    W2k8,
    Wvista,
    Win7,
    Win8,
    Win10,
    Win11,
    L24,
    #[default]
    L26,
    Solaris,
}


#[derive(Serialize, Deserialize, Debug)]
pub enum ScsiHw {
    #[serde(rename = "lsi")]
    Lsi,
    #[serde(rename = "lsi53c810")]
    Lsi53c810,
    #[serde(rename = "virtio-scsi-pci")]
    VirtioScsiPci,
    #[serde(rename = "virtio-scsi-single")]
    VirtioScsiSingle,
    #[serde(rename = "megasas")]
    Megasas,
    #[serde(rename = "pvscsi")]
    Pvscsi,
}

#[derive(Default, Serialize, Deserialize, Debug)]
pub struct CreateVirtualMachine {
    #[doc = "The cluster node name."]
    pub node: String,

    #[doc = "The (unique) ID of the VM."]
    #[serde(rename = "vmid")]
    pub vm_id: u32,

    #[doc = "Set a name for the VM. Only used on the configuration web interface."]
    pub name: String,

    #[doc = "The number of cores per socket."]
    pub cores: u16,

    #[doc = "Amount of RAM for the VM in MB. This is the maximum available memory when you use the balloon device."]
    pub memory: u64,

    /// Specify guest operating system. This is used to enable special
    /// optimization/features for specific operating systems:
    /// other;; unspecified OS
    /// wxp;; Microsoft Windows XP
    /// w2k;; Microsoft Windows 2000
    /// w2k3;; Microsoft Windows 2003
    /// w2k8;; Microsoft Windows 2008
    /// wvista;; Microsoft Windows Vista
    /// win7;; Microsoft Windows 7
    /// win8;; Microsoft Windows 8/2012/2012r2
    /// win10;; Microsoft Windows 10/2016/2019
    /// win11;; Microsoft Windows 11/2022
    /// l24;; Linux 2.4 Kernel
    /// l26;; Linux 2.6 - 5.X Kernel
    /// solaris;; Solaris/OpenSolaris/OpenIndiania kernel
    #[serde(rename = "ostype")]
    pub os_type: OsType,

    #[doc = "Specify network devices."]
    #[serde(flatten)]
    pub net: HashMap<String, String>,

    #[doc = "SCSI controller model"]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scsihw: Option<ScsiHw>,

    #[doc = "Use volume as SCSI hard disk or CD-ROM (n is 0 to 30). Use the special syntax STORAGE_ID:SIZE_IN_GiB to allocate a new volume."]
    #[doc = "Use STORAGE_ID:0 and the 'import-from' parameter to import from an existing volume."]
    #[serde(flatten)]
    pub scsi: HashMap<String, String>,

    #[doc = "Use volume as IDE hard disk or CD-ROM (n is 0 to 3). Use the special syntax STORAGE_ID:SIZE_IN_GiB to allocate a new volume."]
    #[doc = "Use STORAGE_ID:0 and the 'import-from' parameter to import from an existing volume."]
    #[serde(flatten)]
    pub ide: HashMap<String, String>,

    #[doc = "Specify guest boot order. Use the 'order=' sub-property as usage with no key or 'legacy=' is deprecated."]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub boot: Option<String>,

    /// Create a serial device inside the VM (n is 0 to 3), and pass through a
    /// host serial device (i.e. /dev/ttyS0), or create a unix socket on the
    /// host side (use 'qm terminal' to open a terminal connection).
    /// NOTE: If you pass through a host serial device, it is no longer possible to migrate such machines -
    /// use with special care.
    /// CAUTION: Experimental! User reported problems with this option.
    #[serde(flatten)]
    pub serial: HashMap<String, String>,

    /// Configure the VGA Hardware. If you want to use high resolution modes (>= 1280x1024x16) you may need to increase the vga memory option.
    /// Since QEMU 2.9 the default VGA display type is 'std' for all OS types besides some Windows versions (XP and older) which use 'cirrus'.
    /// The 'qxl' option enables the SPICE display server. For win* OS you can select how many independent displays you want,
    /// Linux guests can add displays them self.
    /// You can also run without any graphic card, using a serial device as terminal.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub vga: Option<String>,

    /// cloud-init: Specify IP addresses and gateways for the corresponding interface.
    /// IP addresses use CIDR notation, gateways are optional but need an IP of the same type specified.
    /// The special string 'dhcp' can be used for IP addresses to use DHCP, in which case no explicit
    /// gateway should be provided.
    /// For IPv6 the special string 'auto' can be used to use stateless autoconfiguration. This requires
    /// cloud-init 19.4 or newer.
    /// If cloud-init is enabled and neither an IPv4 nor an IPv6 address is specified, it defaults to using
    /// dhcp on IPv4.
    #[serde(flatten)]
    pub ipconfig: HashMap<String, String>,

    #[doc = "cloud-init: Sets DNS server IP address for a container. Create will automatically use the setting from the host if neither searchdomain nor nameserver are set."]
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "nameserver")]
    pub nameserver: Option<String>,

    #[doc = "cloud-init: User name to change ssh keys and password for instead of the image's configured default user."]
    #[serde(rename = "ciuser")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ci_user: Option<String>,

    #[doc = "cloud-init: Password to assign the user. Using this is generally not recommended. Use ssh keys instead. Also note that older cloud-init versions do not support hashed passwords."]
    #[serde(rename = "cipassword")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ci_password: Option<String>,

    #[doc = "cloud-init: Setup public SSH keys (one key per line, OpenSSH format)."]
    #[serde(rename = "sshkeys")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ssh_keys: Option<String>,
}


#[derive(Serialize, Deserialize, Debug)]
pub struct ResizeDisk {
    #[doc = "The (unique) ID of the VM."]
    #[serde(rename = "vmid")]
    pub vm_id: u32,
    #[doc = "The cluster node name."]
    pub node: String,
    #[doc = "The disk you want to resize."]
    pub disk: String,
    #[doc = "The new size. With the `+` sign the value is added to the actual size of the volume and without it, the value is taken as an absolute one. Shrinking disk size is not supported."]
    pub size: String,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "lowercase")]
pub enum DownloadImageContentType {
    Iso,
    VzTmpl,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct DownloadImage {
    #[doc = "Content type."]
    pub content: DownloadImageContentType,
    #[doc = "The name of the file to create. Caution: This will be normalized!"]
    pub filename: String,
    #[doc = "The cluster node name."]
    pub node: String,

    #[doc = "The storage identifier."]
    pub storage: String,
    #[doc = "The URL to download the file from."]
    pub url: String,

    #[doc = "The expected checksum of the file."]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub checksum: Option<String>,

    #[doc = "The algorithm to calculate the checksum of the file."]
    #[doc = "md5 | sha1 | sha224 | sha256 | sha384 | sha512"]
    #[serde(rename = "checksum-algorithm")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub checksum_algorithm: Option<String>,

    #[doc = "If false, no SSL/TLS certificates will be verified."]
    #[serde(rename = "verify-certificates")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub verify_certificates: Option<u8>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct StorageContent {
    #[doc = "Format identifier ('raw', 'qcow2', 'subvol', 'iso', 'tgz' ...)"]
    pub format: String,

    #[doc = "Volume size in bytes."]
    pub size: u64,

    #[doc = "Volume identifier."]
    pub volid: String,

    #[doc = "Associated Owner VMID."]
    #[serde(rename = "vmid")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub vm_id: Option<u32>,

    #[doc = "Creation time (seconds since the UNIX Epoch)."]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ctime: Option<u64>,

    #[doc = "If whole backup is encrypted, value is the fingerprint or '1'  if encrypted. Only useful for the Proxmox Backup Server storage type."]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub encrypted: Option<String>,

    #[doc = "Optional notes. If they contain multiple lines, only the first one is returned here."]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub notes: Option<String>,

    #[doc = "Volume identifier of parent (for linked cloned)."]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub parent: Option<String>,

    #[doc = "Protection status. Currently only supported for backups."]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub protected: Option<u8>,

    #[doc = "Used space. Please note that most storage plugins do not report anything useful here."]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub used: Option<u64>,

    #[doc = "Last backup verification result, only useful for PBS storages."]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub verification: Option<String>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct StorageContentDetails {
    #[doc = "Format identifier ('raw', 'qcow2', 'subvol', 'iso', 'tgz' ...)"]
    pub format: String,

    #[doc = "The Path"]
    pub path: String,

    #[doc = "Volume size in bytes."]
    pub size: u64,

    #[doc = "Used space. Please note that most storage plugins do not report anything useful here."]
    pub used: u64,

    #[doc = "Optional notes."]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub notes: Option<String>,

    #[doc = "Protection status. Currently only supported for backups."]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub protected: Option<u8>,

}

pub type VmCurrentStatus = VirtualMachine;

pub struct ParamBuilder {
    params: Vec<String>,
    sep: String,
}

impl Default for ParamBuilder {
    fn default() -> Self {
        ParamBuilder::new("=".to_owned())
    }
}

impl ParamBuilder {
    pub fn new(separator: String) -> Self {
        ParamBuilder {
            params: Vec::new(),
            sep: separator,
        }
    }

    pub fn add_param(&mut self, key: &str, val: &str) -> &mut Self {
        self.params.push(format!("{}{}{}", key, self.sep, val));
        self
    }

    pub fn add_param_with_separator(&mut self, key: &str, val: &str, sep: &str) -> &mut Self {
        self.params.push(format!("{}{}{}", key, sep, val));
        self
    }

    pub fn build(&self) -> String {
        self.params.join(",")
    }
}

#[cfg(test)]
mod tests {
    use crate::model::ParamBuilder;

    #[test]
    fn test_param_builder() {
        let result =
            ParamBuilder::default()
                .add_param("name", "value")
                .add_param("name2", "value2")
                .build();

        assert_eq!(result, "name=value,name2=value2")
    }

    #[test]
    fn test_param_builder_with_custom_value_separator() {
        let mut builder = ParamBuilder::default();
        builder.add_param_with_separator("name", "value", ":");
        builder.add_param("name2", "value2");
        assert_eq!(builder.build(), "name:value,name2=value2")
    }
}
