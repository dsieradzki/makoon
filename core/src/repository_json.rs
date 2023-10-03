use std::fs::{File, OpenOptions};
use std::io::{BufReader, Write};
use std::sync::{Arc, Mutex};
use log::{error, warn};

use serde::{Deserialize, Serialize};
use crate::model::{Cluster, LogEntry};
use crate::repository::Error;


pub struct JsonRepository {
    path: String,
    mutex: Arc<Mutex<u8>>,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct DbData {
    pub(crate) clusters: Vec<Cluster>,
    pub(crate) action_log: Vec<LogEntry>,
}

impl JsonRepository {
    pub fn new(path: &str) -> crate::repository::Result<Self> {
        let repo = JsonRepository {
            path: format!("{}.json", path),
            mutex: Arc::new(Mutex::new(0)),
        };
        match repo.load() {
            Ok(_) => (),
            Err(e) => match e.clone() {
                Error::DB(es) => {
                    error!("Cannot load database, error: [{}]", es);
                    return Err(e);
                }
                Error::IO(e) => {
                    warn!(
                        "Cannot load database file, error: [{}], create new database file",
                        e
                    );
                    repo.save(DbData {
                        clusters: vec![],
                        action_log: vec![],
                    })
                    .unwrap_or_else(|_| {
                        panic!("cannot save database to [{}], error: [{:?}]", path, e)
                    });
                }
            },
        };
        Ok(repo)
    }
    fn save(&self, data: DbData) -> crate::repository::Result<()> {
        let mutex = self.mutex.clone();
        let mutex = mutex.lock().unwrap();

        let mut file = OpenOptions::new()
            .read(true)
            .write(true)
            .create(true)
            .truncate(true)
            .open(self.path.clone())
            .map_err(|e| Error::IO(e.to_string()))?;

        let result = serde_json::to_string_pretty(&data).map_err(|e| Error::DB(e.to_string()))?;
        let result = file
            .write_all(result.as_bytes())
            .map_err(|e| Error::DB(e.to_string()));
        drop(mutex);
        return result;
    }
    fn load(&self) -> crate::repository::Result<DbData> {
        let mutex = self.mutex.clone();
        let mutex = mutex.lock().unwrap();

        let file = File::open(self.path.clone()).map_err(|e| Error::IO(e.to_string()))?;
        let reader = BufReader::new(file);
        let result = serde_json::from_reader(reader).map_err(|e| Error::DB(e.to_string()))?;
        drop(mutex);
        Ok(result)
    }

    pub fn get_clusters(&self) -> crate::repository::Result<Vec<Cluster>> {
        self.load().map(|v| v.clusters)
    }

    pub fn get_cluster(&self, name: &str) -> crate::repository::Result<Option<Cluster>> {
        let clusters = self.get_clusters()?;
        Ok(clusters.into_iter().find(|i| i.cluster_name == name))
    }

    pub fn delete_cluster(&self, name: &str) -> crate::repository::Result<()> {
        let mut data = self.load()?;

        data.clusters.retain(|e| e.cluster_name != name);
        data.action_log.retain(|e| e.cluster_name != name);

        self.save(data)
    }

    pub fn save_cluster(&self, cluster_to_save: Cluster) -> crate::repository::Result<()> {
        let mut data = self.load()?;

        let to_update = data
            .clusters
            .iter()
            .any(|i| i.cluster_name == cluster_to_save.cluster_name);
        if to_update {
            let clusters = data
                .clusters
                .into_iter()
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

    pub fn logs(&self, cluster_name: &str) -> crate::repository::Result<Vec<LogEntry>> {
        let data = self.load()?;
        let mut result: Vec<LogEntry> = data
            .action_log
            .into_iter()
            .filter(|i| i.cluster_name == cluster_name)
            .collect();
        result.sort_by(|a, b| b.date.cmp(&a.date));
        Ok(result)
    }

    pub fn save_log(&self, entry: LogEntry) -> crate::repository::Result<()> {
        let mut data = self.load()?;
        data.action_log.push(entry);
        self.save(data)
    }
    pub fn delete_logs(&self, cluster_name: &str) -> crate::repository::Result<()> {
        let mut data = self.load()?;
        data.action_log.retain(|i| i.cluster_name != cluster_name);
        self.save(data)?;
        Ok(())
    }
}
