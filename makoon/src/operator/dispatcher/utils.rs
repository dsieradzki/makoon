use std::time::Duration;

pub fn retry<F, R, E>(f: F) -> Result<R, E>
    where
        E: ToString,
        F: Fn() -> Result<R, E> {
    let mut attempts = 30;
    loop {
        match f() {
            Ok(v) => return Ok(v),
            Err(e) => {
                if attempts > 0 {
                    attempts -= 1;
                    debug!("Remaining retries: [{}]: {}", attempts, e.to_string());
                    std::thread::sleep(Duration::from_secs(10))
                } else {
                    return Err(e);
                }
            }
        }
    }
}
