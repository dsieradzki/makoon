mod dispatcher;
mod error;
mod event;
mod generator;
mod operator;
mod repository;
mod repository_json;
pub mod model;
pub mod supported;

pub use dispatcher::Dispatcher;
pub use error::Error;
pub use operator::{Config, Operator};
pub use repository::Repository;

pub type Result<T> = std::result::Result<T, Error>;

pub use generator::DefaultClusterConfigurationGenerator;
