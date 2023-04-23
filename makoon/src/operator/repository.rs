use std::fmt::{Debug, Display, Formatter};
use std::fs::{File, OpenOptions};
use std::io::{BufReader, Write};
use std::sync::RwLock;

use serde::{Deserialize, Serialize};

use crate::operator::model::{LogEntry, Cluster};

#[derive(Debug)]
pub enum Error {
    ReadingError(String),
    WritingError(String),
}

impl Display for Error {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            Error::ReadingError(e) => write!(f, "{}", e),
            Error::WritingError(e) => write!(f, "{}", e)
        }
    }
}

impl From<Error> for String {
    fn from(value: Error) -> Self {
        value.to_string()
    }
}


pub type Result<T> = std::result::Result<T, Error>;

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct DbData {
    clusters: Vec<Cluster>,
    action_log: Vec<LogEntry>,
}

pub struct Repository {
    repo: RwLock<YamlRepository>,

}

impl Repository {
    pub fn new(path: String) -> Self {
        Repository {
            repo: RwLock::new(YamlRepository::new(path))
        }
    }

    pub fn get_clusters(&self) -> Result<Vec<Cluster>> {
        self.repo.read().unwrap().get_clusters()
    }

    pub fn get_cluster(&self, name: String) -> Result<Option<Cluster>> {
        self.repo.read().unwrap().get_cluster(name)
    }

    pub fn delete_cluster(&self, name: String) -> Result<()> {
        self.repo.write().unwrap().delete_cluster(name)
    }

    pub fn save_cluster(&self, cluster_to_save: Cluster) -> Result<()> {
        self.repo.write().unwrap().save_cluster(cluster_to_save)
    }

    pub fn logs(&self, cluster_name: String) -> Result<Vec<LogEntry>> {
        self.repo.read().unwrap().logs(cluster_name)
    }

    pub fn save_log(&self, entry: LogEntry) -> Result<()> {
        self.repo.write().unwrap().save_log(entry)
    }
}

pub struct YamlRepository {
    path: String,
}


impl YamlRepository {
    pub fn new(path: String) -> Self {
        let repo = YamlRepository {
            path: path.clone(),
        };
        match repo.load() {
            Ok(_) => (),
            Err(e) => {
                repo.save(
                    DbData {
                        clusters: vec![],
                        action_log: vec![],
                    }).unwrap_or_else(|_| panic!("cannot save database to [{}], error: [{:?}]", path, e));
            }
        };
        repo
    }
    fn save(&self, data: DbData) -> Result<()> {
        let mut file = OpenOptions::new()
            .read(true)
            .write(true)
            .create(true)
            .truncate(true)
            .open(self.path.clone())
            .map_err(|e| Error::WritingError(e.to_string()))?;

        let result = serde_json::to_string(&data).map_err(|e| Error::WritingError(e.to_string()))?;
        return file.write_all(result.as_bytes()).map_err(|e| Error::WritingError(e.to_string()));
    }
    fn load(&self) -> Result<DbData> {
        let file = File::open(self.path.clone()).map_err(|e| Error::ReadingError(e.to_string()))?;
        let reader = BufReader::new(file);
        let result = serde_json::from_reader(reader).map_err(|e| Error::ReadingError(e.to_string()))?;
        Ok(result)
    }

    pub fn get_clusters(&self) -> Result<Vec<Cluster>> {
        self.load().map(|v| v.clusters)
    }

    pub fn get_cluster(&self, name: String) -> Result<Option<Cluster>> {
        let clusters = self.get_clusters()?;
        Ok(clusters.into_iter()
            .find(|i| i.cluster_name == name))
    }

    pub fn delete_cluster(&self, name: String) -> Result<()> {
        let mut data = self.load()?;

        data.clusters.retain(|e| e.cluster_name != name);
        data.action_log.retain(|e| e.cluster_name != name);

        self.save(data)
    }

    pub fn save_cluster(&self, cluster_to_save: Cluster) -> Result<()> {
        let mut data = self.load()?;

        let to_update = data.clusters.iter().any(|i| i.cluster_name == cluster_to_save.cluster_name);
        if to_update {
            let clusters = data.clusters.into_iter()
                .map(move |i| {
                    return if i.cluster_name == (&cluster_to_save).cluster_name {
                        (&cluster_to_save).clone()
                    } else {
                        i
                    };
                })
                .collect();
            data.clusters = clusters;
        } else {
            data.clusters.push(cluster_to_save);
        }

        self.save(data)
    }

    pub fn logs(&self, cluster_name: String) -> Result<Vec<LogEntry>> {
        let data = self.load()?;
        let mut result: Vec<LogEntry> = data.action_log
            .into_iter()
            .filter(|i| i.cluster_name == cluster_name)
            .collect();
        result.sort_by(|a, b| b.date.cmp(&a.date));
        Ok(result)
    }

    pub fn save_log(&self, entry: LogEntry) -> Result<()> {
        let mut data = self.load()?;
        data.action_log.push(entry);
        self.save(data)
    }
}
