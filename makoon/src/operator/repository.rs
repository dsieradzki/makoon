use std::fmt::{Debug, Display, Formatter};

use crate::operator::model::{Cluster, LogEntry};
use crate::operator::repository_json::JsonRepository;

#[derive(Clone, Debug)]
pub enum Error {
    DB(String),
    IO(String),
}

impl Display for Error {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            Error::DB(e) => write!(f, "{}", e),
            Error::IO(e) => write!(f, "{}", e)
        }
    }
}

impl From<Error> for String {
    fn from(value: Error) -> Self {
        value.to_string()
    }
}

pub type Result<T> = std::result::Result<T, Error>;


pub struct Repository {
    inner: JsonRepository,
}


impl Repository {
    pub fn new(path: &str) -> Result<Self> {
        Ok(
            Repository {
                inner: JsonRepository::new(path)?
            }
        )
    }

    pub fn get_clusters(&self) -> Result<Vec<Cluster>> {
        self.inner.get_clusters()
    }

    pub fn get_cluster(&self, name: &str) -> Result<Option<Cluster>> {
        self.inner.get_cluster(name)
    }

    pub fn delete_cluster(&self, name: &str) -> Result<()> {
        self.inner.delete_cluster(name)
    }

    pub fn save_cluster(&self, cluster_to_save: Cluster) -> Result<()> {
        self.inner.save_cluster(cluster_to_save)
    }

    pub fn logs(&self, cluster_name: &str) -> Result<Vec<LogEntry>> {
        self.inner.logs(cluster_name)
    }

    pub fn save_log(&self, entry: LogEntry) -> Result<()> {
        self.inner.save_log(entry)
    }
    pub fn delete_logs(&self, cluster_name: &str) -> Result<()> {
        self.inner.delete_logs(cluster_name)?;
        Ok(())
    }
}


