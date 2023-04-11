mod command_builder;

pub use command_builder::*;

pub fn new(binary: &str) -> CommandBuilder {
    CommandBuilder::new(binary)
}