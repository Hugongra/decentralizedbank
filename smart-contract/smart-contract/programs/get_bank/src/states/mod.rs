mod asset;
mod bank;
mod borrow;
mod deposit;
mod last_update;
mod utils;

pub use asset::*;
pub use bank::*;
pub use borrow::*;
pub use deposit::*;
pub use last_update::*;
pub use utils::*;

pub const PROGRAM_VERSION: u8 = 1;

pub const SLOTS_PER_YEAR: u64 = 78_840_000;
