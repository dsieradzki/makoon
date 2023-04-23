mod http;
mod client;
mod client_operations;

mod error;
pub mod model;

pub use error::Error;

pub type Result<T> = std::result::Result<T, Error>;

pub use client::*;
pub use client_operations::*;

//TODO: cleanup using this outside
pub fn to_url_encoded(val: &str) -> String {
    let result = urlencoding::encode(val);
    result.to_string()
}


#[cfg(test)]
mod test {
    use crate::to_url_encoded;

    #[test]
    fn to_url_encoded_ssh_key() {
        let input = r#"ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQCoLCbdAlkatCns0eVPPTWFD0SbSm72I3jLEET6BDNRr2Nu0FXmM04zpBaWySmRuS+Pq1Kh6OVt7K9ngQJIagFTGnuW/NBDBG4e89KbKh9+txfIVrKiBQHwVHBUXXN07uyTKrVUHOoX0E8gwQR1lBChsfb9aNYUwgMdBQpgA3qYQb2AfUoTDmzhBYG8PNjAK1fICt0AaHAyYrfKi7n/XvjxapwR5i3y7YwS0vz6tWAwg2KDReP4bdnyPxYVDZhnsSqgiXLvLbCB7qGbnP+xNe2B23hLSsKrtv8FXqn2PwFXu+blmPiRnSifhBh1ChhliMXulQKUo5duRC/xuNhoNi87Sosc2WDPit6/QtV7kFGfZvwsV+7XdH0ltsn3Ly6nLTTas48IZhgk4Ew6xVJ8gub4JHgZblOrRB5ENv/MVoYwzSDUD3SCEmF3DCbl02H/ljMabVsTrNeHy4vZXCwzuTVgyWWY/WSGGrnK1OrcwUrYYhhwwtFCSfknsCcc360+u2wwCIKnpBURiGdRMupRRMRoLdxekobGKz90MHQsGlVGPtk/3qeVQ7aoX6tNaucnUdaxkfO4Dk5bXJtWSZLmqOdKAbfrRIxuvSnvusYG8ODTEkg1BGp5kbmdkMCRWOzNJvn9+V7A4U6m4AXRXgk2u8kmtzSO/SWgSdwWlO6BE7Pmvw=="#;
        let output = r#"ssh-rsa%20AAAAB3NzaC1yc2EAAAADAQABAAACAQCoLCbdAlkatCns0eVPPTWFD0SbSm72I3jLEET6BDNRr2Nu0FXmM04zpBaWySmRuS%2BPq1Kh6OVt7K9ngQJIagFTGnuW%2FNBDBG4e89KbKh9%2BtxfIVrKiBQHwVHBUXXN07uyTKrVUHOoX0E8gwQR1lBChsfb9aNYUwgMdBQpgA3qYQb2AfUoTDmzhBYG8PNjAK1fICt0AaHAyYrfKi7n%2FXvjxapwR5i3y7YwS0vz6tWAwg2KDReP4bdnyPxYVDZhnsSqgiXLvLbCB7qGbnP%2BxNe2B23hLSsKrtv8FXqn2PwFXu%2BblmPiRnSifhBh1ChhliMXulQKUo5duRC%2FxuNhoNi87Sosc2WDPit6%2FQtV7kFGfZvwsV%2B7XdH0ltsn3Ly6nLTTas48IZhgk4Ew6xVJ8gub4JHgZblOrRB5ENv%2FMVoYwzSDUD3SCEmF3DCbl02H%2FljMabVsTrNeHy4vZXCwzuTVgyWWY%2FWSGGrnK1OrcwUrYYhhwwtFCSfknsCcc360%2Bu2wwCIKnpBURiGdRMupRRMRoLdxekobGKz90MHQsGlVGPtk%2F3qeVQ7aoX6tNaucnUdaxkfO4Dk5bXJtWSZLmqOdKAbfrRIxuvSnvusYG8ODTEkg1BGp5kbmdkMCRWOzNJvn9%2BV7A4U6m4AXRXgk2u8kmtzSO%2FSWgSdwWlO6BE7Pmvw%3D%3D%0A"#;

        assert_eq!(output, to_url_encoded(&input.to_string()));
    }
}