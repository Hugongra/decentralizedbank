use {
    anchor_lang::prelude::Result,
    crate::math::{Decimal, TryMul, TryAdd, TryDiv}
};

pub fn calculate_weighted_average_rate_index(
    current_amount: u64,
    new_amount: u64,
    global_rate: u64,
    rate_index: u64) -> Result<u64> {
    
    //new_index = (current_amount * rate_index + new_amount * global_rate) / (current_amount + new_amount)
    
    // -----------------------------------------------------------------------------------------------------
    // @) Variables
    // -----------------------------------------------------------------------------------------------------

    let current_amount_d = Decimal::from(current_amount);
    let new_amount_d = Decimal::from(new_amount);
    let rate_index_d = Decimal::from_rate(rate_index);
    let global_rate_d = Decimal::from_rate(global_rate);

    // -----------------------------------------------------------------------------------------------------
    // @ Algorithm
    // -----------------------------------------------------------------------------------------------------
    
    // Calculate Total Increment
    let total_increment = current_amount_d.try_mul(rate_index_d).unwrap()
    .try_add(
        new_amount_d.try_mul(global_rate_d).unwrap()
    ).unwrap();
    
    // Calculate New Index
    let new_index = total_increment
    .try_div(current_amount_d.try_add(new_amount_d).unwrap()).unwrap()
    .to_rate().unwrap();

    Ok(new_index)
}