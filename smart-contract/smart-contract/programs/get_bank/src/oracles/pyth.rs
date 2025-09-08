use anchor_lang::prelude::*;
use pyth_solana_receiver_sdk::price_update::{self, PriceUpdateV2};

use crate::{errors::BankErrorCode, math::Decimal, oracles::MAXIMUM_PRICE_AGE};

pub fn fetch_price(price_feed: &Account<PriceUpdateV2>, expected_feed_id: Pubkey) -> Result<Decimal> {

    let feed_id_ex = hex::encode(expected_feed_id.to_bytes());

    let feed_id: [u8; 32] = price_update::get_feed_id_from_hex(&feed_id_ex)?;

    let price = price_feed.get_price_no_older_than(&Clock::get()?, MAXIMUM_PRICE_AGE, &feed_id)?;

    require!(price.price > 0, BankErrorCode::InvalidPrice);

    Ok(Decimal::from_pyth_price(price.price, price.exponent))
}