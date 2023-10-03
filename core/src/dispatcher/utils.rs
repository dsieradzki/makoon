use std::time::Duration;
use log::info;

pub fn retry<F, R, E>(f: F) -> Result<R, E>
where
    E: ToString,
    F: Fn() -> Result<R, E>,
{
    retry_with_opts::<F, R, E>(f, 10, 30)
}

pub fn retry_with_opts<F, R, E>(f: F, delay: u64, attempts: u64) -> Result<R, E>
where
    E: ToString,
    F: Fn() -> Result<R, E>,
{
    let mut attempts_left = attempts;
    loop {
        match f() {
            Ok(v) => return Ok(v),
            Err(e) => {
                if attempts_left > 0 {
                    attempts_left -= 1;
                    info!(
                        "Operation probe: [{}/{}], wait [{}] seconds: {}",
                        (attempts - attempts_left),
                        attempts,
                        delay,
                        e.to_string()
                    );
                    std::thread::sleep(Duration::from_secs(delay))
                } else {
                    return Err(e);
                }
            }
        }
    }
}
