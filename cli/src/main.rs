const VERSION: &str = env!("CARGO_PKG_VERSION");

fn main() {
    let matches = clap::Command::new("makoon-cli")
        .author("Damian Sieradzki")
        .subcommand_required(true)
        .version(VERSION)
        .get_matches();

    match matches.subcommand() {
        Some(("clusters", _)) => {
            print!("List of clusters");
        }
        _ => unreachable!(),
    };

    /*


    clusters
       list
       add
       delete
       upgrade
       generate-config

     */
}
