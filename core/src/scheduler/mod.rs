use std::sync::{Arc, Mutex};
use std::sync::atomic::{AtomicBool, Ordering};
use std::thread::JoinHandle;
use std::time::Duration;
use chrono::{DateTime, Utc};
use log::{debug, info};

pub struct Scheduler {
    tasks: Arc<Mutex<Vec<Box<dyn Fn() + Send + 'static>>>>,
    t: Option<JoinHandle<()>>,
    exit: Arc<AtomicBool>,
    config: Config,
}

impl Scheduler {
    pub fn add_task<F>(&self, f: F)
        where F: Fn() + Send + 'static {
        let mut tasks = self.tasks.lock().unwrap();
        tasks.push(Box::new(f));
        info!("Task has been added to scheduler");
    }
    pub fn shutdown(&self) {
        info!("Scheduler has been requested to shutdown");
        let exit = self.exit.clone();
        exit.store(true, Ordering::SeqCst);
    }
    fn run(&mut self) {
        info!("Scheduler has been started with config: \n{:#?}", self.config);
        let exit = self.exit.clone();
        let tasks = self.tasks.clone();
        let interval = chrono::Duration::from_std(self.config.interval).unwrap();

        self.t = Some(std::thread::spawn(move || {
            let mut last_tick = DateTime::<Utc>::MIN_UTC;
            loop {
                if exit.load(Ordering::SeqCst) {
                    return;
                }
                if Utc::now() >= last_tick + interval {
                    debug!("Run tasks");
                    let tasks = tasks.lock().unwrap();
                    for task in tasks.iter() {
                        task();
                    }
                    last_tick = Utc::now();
                }
                std::thread::sleep(Duration::from_secs(1));
            }
        }));
    }
}

#[derive(Debug)]
struct Config {
    interval: Duration,
}

impl Default for Config {
    fn default() -> Self {
        Config {
            interval: Duration::from_secs(60),
        }
    }
}

impl Scheduler {
    fn new(config: Config) -> Self {
        let mut s = Scheduler {
            tasks: Arc::new(Mutex::new(vec![])),
            t: None,
            exit: Arc::new(AtomicBool::new(false)),
            config,
        };
        s.run();
        return s;
    }
}

impl Default for Scheduler {
    fn default() -> Self {
        Scheduler::new(Config::default())
    }
}

impl Drop for Scheduler {
    fn drop(&mut self) {
        self.shutdown();
        match self.t.take() {
            None => {}
            Some(t) => {
                t.join().unwrap();
            }
        }
        info!("Scheduler is shutdown")
    }
}

#[cfg(test)]
mod tests {
    use std::sync::Arc;
    use std::sync::atomic::{AtomicBool, AtomicU8, Ordering};
    use std::time::Duration;
    use crate::scheduler::{Config, Scheduler};

    #[test]
    fn scheduler_should_run_task_ones() {
        let scheduler = Scheduler::new(
            Config {
                interval: Duration::from_millis(10),
            });
        let flag = Arc::new(AtomicBool::new(false));
        let flag_task = flag.clone();
        scheduler.add_task(move || {
            flag_task.store(true, Ordering::SeqCst);
        });
        std::thread::sleep(Duration::from_millis(500));
        assert!(flag.load(Ordering::SeqCst));
    }

    #[test]
    fn scheduler_should_run_task_ten_times() {
        let scheduler = Scheduler::new(
            Config {
                interval: Duration::from_millis(10),
            });
        let count = Arc::new(AtomicU8::new(0));
        let count_task = count.clone();
        scheduler.add_task(move || {
            let count = count_task.load(Ordering::SeqCst) + 1;
            count_task.store(count, Ordering::SeqCst);
        });
        std::thread::sleep(Duration::from_millis(500));
        assert!(count.load(Ordering::SeqCst) >= 10);
    }
}