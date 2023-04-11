pub struct CommandBuilder {
    prog: String,
    sudo: bool,
}

pub struct InstallCommand {
    parts: Vec<String>,
}

pub struct UninstallCommand {
    parts: Vec<String>,
}

pub struct ListCommand {
    parts: Vec<String>,
}

pub struct RepoCommand {
    parts: Vec<String>,
}

impl Default for CommandBuilder {
    fn default() -> Self {
        CommandBuilder::new("helm")
    }
}

impl CommandBuilder {
    pub fn new(binary: &str) -> Self {
        CommandBuilder {
            prog: binary.to_string(),
            sudo: false,
        }
    }
    fn build(&self) -> Vec<String> {
        let mut parts = Vec::new();
        if self.sudo {
            parts.push("sudo".to_string());
        }
        parts.push(self.prog.to_string());
        parts
    }
    pub fn sudo(&mut self) -> &mut Self {
        self.sudo = true;
        self
    }
    pub fn install(&self) -> InstallCommand {
        let mut parts = self.build();
        parts.push("install".to_string());
        InstallCommand {
            parts
        }
    }
    pub fn upgrade_or_install(&self) -> InstallCommand {
        let mut parts = self.build();
        parts.push("upgrade".to_string());
        parts.push("--install".to_string());
        InstallCommand {
            parts
        }
    }

    pub fn uninstall(&self, name: &str) -> UninstallCommand {
        let mut parts = self.build();
        parts.push("uninstall".to_string());
        parts.push(name.to_string());
        UninstallCommand {
            parts
        }
    }
    pub fn list(&self) -> ListCommand {
        let mut parts = self.build();
        parts.push("list".to_string());
        ListCommand {
            parts
        }
    }

    pub fn repo(&self) -> RepoCommand {
        let mut parts = self.build();
        parts.push("repo".to_string());
        RepoCommand {
            parts
        }
    }
}

impl InstallCommand {
    pub fn name(self, name: &str) -> Self {
        let mut res = self;
        res.parts.push(name.to_string());
        res
    }
    pub fn chart(self, repo: &str, name: &str) -> Self {
        let mut res = self;
        res.parts.push(format!("{}/{}", repo, name));
        res
    }

    pub fn namespace(self, namespace: &str) -> Self {
        let mut res = self;
        res.parts.push("--namespace".to_string());
        res.parts.push(namespace.to_string());
        res
    }

    pub fn with_values_file(self, path: &str) -> Self {
        let mut res = self;
        res.parts.push("-f".to_string());
        res.parts.push(path.to_string());
        res
    }

    pub fn create_namespace(self) -> Self {
        let mut res = self;
        res.parts.push("--create-namespace".to_string());
        res
    }

    pub fn wait(self) -> Self {
        let mut res = self;
        res.parts.push("--wait".to_string());
        res
    }

    pub fn version(self, version: &str) -> Self {
        let mut res = self;
        res.parts.push("--version".to_string());
        res.parts.push(version.to_string());
        res
    }
    pub fn build(&self) -> String {
        self.parts.join(" ")
    }
}

impl ListCommand {
    pub fn all(self) -> Self {
        let mut res = self;
        res.parts.push("-A".to_string());
        res
    }

    pub fn json(self) -> Self {
        let mut res = self;
        res.parts.push("-o json".to_string());
        res
    }

    pub fn build(&self) -> String {
        self.parts.join(" ")
    }
}

impl UninstallCommand {
    pub fn namespace(self, ns: &str) -> Self {
        let mut res = self;
        res.parts.push("--namespace".to_string());
        res.parts.push(ns.to_string());
        res
    }

    pub fn build(&self) -> String {
        self.parts.join(" ")
    }
}

impl RepoCommand {
    pub fn add(self, name: &str, url: &str) -> Self {
        let mut res = self;
        res.parts.push("add".to_string());
        res.parts.push(name.to_string());
        res.parts.push(url.to_string());
        res
    }

    pub fn update(self) -> Self {
        let mut res = self;
        res.parts.push("update".to_string());
        res
    }

    pub fn build(&self) -> String {
        self.parts.join(" ")
    }
}


#[cfg(test)]
mod test {
    use crate::helm::command_builder::CommandBuilder;

    #[test]
    fn install_chart() {
        let result = CommandBuilder::default()
            .sudo()
            .install()
            .name("chart_name")
            .namespace("my_ns")
            .with_values_file("/tmp/values.yaml")
            .create_namespace()
            .version("0.1.0")
            .build();
        assert_eq!("sudo helm install chart_name --namespace my_ns -f /tmp/values.yaml --create-namespace --version 0.1.0", result)
    }

    #[test]
    fn upgrade_install_chart() {
        let result = CommandBuilder::default()
            .sudo()
            .upgrade_or_install()
            .name("chart_name")
            .namespace("my_ns")
            .with_values_file("/tmp/values.yaml")
            .create_namespace()
            .version("0.1.0")
            .build();
        assert_eq!("sudo helm upgrade --install chart_name --namespace my_ns -f /tmp/values.yaml --create-namespace --version 0.1.0", result)
    }

    #[test]
    fn list_releases() {
        let result = CommandBuilder::default()
            .list()
            .all()
            .json()
            .build();
        assert_eq!("helm list -A -o json", result)
    }

    #[test]
    fn uninstall_release() {
        let result = CommandBuilder::default()
            .uninstall("release")
            .namespace("my_ns")
            .build();

        assert_eq!("helm uninstall release --namespace my_ns", result);
    }

    #[test]
    fn repo_add() {
        let result = CommandBuilder::default()
            .repo()
            .add("sample", "https://aaa.com")
            .build();

        assert_eq!("helm repo add sample https://aaa.com", result);
    }


    #[test]
    fn repo_update() {
        let result = CommandBuilder::default()
            .repo()
            .update()
            .build();

        assert_eq!("helm repo update", result);
    }
}