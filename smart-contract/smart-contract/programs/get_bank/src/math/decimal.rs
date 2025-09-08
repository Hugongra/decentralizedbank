//! Math for preserving precision of token amounts which are limited
//! by the SPL Token program to be at most u64::MAX.
//!
//! Decimals are internally scaled by a WAD (10^18) to preserve
//! precision up to 18 decimal places. Decimals are sized to support
//! both serialization and precise math for the full range of
//! unsigned 64-bit integers. The underlying representation is a
//! u192 rather than u256 to reduce compute cost while losing
//! support for arithmetic operations at the high end of u64 range.
use {
    anchor_lang::solana_program::program_error::ProgramError,
    borsh::{BorshDeserialize, BorshSerialize},
    std::{convert::TryFrom, fmt},
    std::io::{Read, Write},
    uint::construct_uint,
    crate::{
        errors::BankErrorCode,
        math::arithmetic::*,
    },
};

// U192 with 192 bits consisting of 3 x 64-bit words
construct_uint! {
    pub struct U192(3);
}

// Implement Borsh serialization for U192
impl BorshSerialize for U192 {
    fn serialize<W: Write>(&self, writer: &mut W) -> std::io::Result<()> {
        for word in self.0.iter() {
            writer.write_all(&word.to_le_bytes())?;
        }
        Ok(())
    }
}

// Implement Borsh deserialization for U192
impl BorshDeserialize for U192 {
    fn deserialize(buf: &mut &[u8]) -> std::io::Result<Self> {
        let mut words = [0u64; 3]; // U192 uses 3 64-bit words
        for word in &mut words {
            let mut bytes = [0u8; 8];
            buf.read_exact(&mut bytes)?;
            *word = u64::from_le_bytes(bytes);
        }
        Ok(U192(words))
    }
    fn deserialize_reader<R: Read>(reader: &mut R) -> std::io::Result<Self> {
        let mut words = [0u64; 3]; // U192 uses 3 64-bit words
        for word in &mut words {
            let mut bytes = [0u8; 8];
            reader.read_exact(&mut bytes)?;
            *word = u64::from_le_bytes(bytes);
        }
        Ok(U192(words))
    }
}

/// Large decimal values, precise to 18 digits
#[derive(Clone, Copy, Debug, Default, PartialEq, PartialOrd, Eq, Ord, BorshSerialize, BorshDeserialize)]
pub struct Decimal(pub U192);

impl Decimal {
    /// One
    pub fn one() -> Self {
        Self(Self::wad())
    }

    /// Zero
    pub fn zero() -> Self {
        Self(U192::zero())
    }

    // OPTIMIZE: use const slice when fixed in BPF toolchain
    fn wad() -> U192 {
        U192::from(WAD)
    }

    // OPTIMIZE: use const slice when fixed in BPF toolchain
    fn half_wad() -> U192 {
        U192::from(HALF_WAD)
    }

    /// Create scaled decimal from percent value
    pub fn from_percent(percent: u16) -> Self {
        Self(U192::from(percent as u64 * PERCENT_SCALER))
    }

    /// Create scaled decimal from rate value
    pub fn from_rate(rate: u64) -> Self {
        Self(U192::from(rate as u128 * RATE_SCALER as u128))
    }

    /// Return raw scaled value if it fits within u128
    #[allow(clippy::wrong_self_convention)]
    pub fn to_scaled_val(&self) -> Result<u128, ProgramError> {
        Ok(u128::try_from(self.0).map_err(|_| BankErrorCode::MathOverflow)?)
    }

    /// Create decimal from scaled value
    pub fn from_scaled_val(scaled_val: u128) -> Self {
        Self(U192::from(scaled_val))
    }

    /// Create a Decimal from a token amount and its decimals.
    pub fn from_token_amount(amount: u64, decimals: u8) -> Self {
        // Normalize the token amount to 18 decimals (WAD format)
        let scaling_factor = 10u128.pow((18 - decimals as u32) as u32);
        Self(U192::from(amount as u128).checked_mul(U192::from(scaling_factor)).unwrap())
    }

    pub fn from_pyth_price(price: i64, exponent: i32) -> Self {
        // Scale to 18 decimals (WAD)
        // First: convert price to i128 to safely handle negatives
        let price_i128 = price as i128;

        let total_exponent = 18 + exponent;

        let scaling_factor = 10u128.checked_pow(total_exponent as u32).unwrap();

        let scaled = price_i128.checked_mul(scaling_factor as i128).unwrap();

        Self(U192::from(scaled as u128))
    }

    /// Convert Decimal back to a token amount with specified decimals.
    pub fn to_token_amount(&self, decimals: u8) -> Result<u64, ProgramError> {
        let scaling_factor = 10u128.pow((18 - decimals as u32) as u32);
        let token_amount = self
            .0
            .checked_add(U192::from(scaling_factor / 2))
            .ok_or(BankErrorCode::MathOverflow)?
            .checked_div(U192::from(scaling_factor))
            .ok_or(BankErrorCode::MathOverflow)?;
        Ok(u64::try_from(token_amount).map_err(|_| BankErrorCode::MathOverflow)?)
    }

    /// Round scaled decimal to u64
    pub fn try_round_u64(&self) -> Result<u64, ProgramError> {
        let rounded_val = Self::half_wad()
            .checked_add(self.0)
            .ok_or(BankErrorCode::MathOverflow)?
            .checked_div(Self::wad())
            .ok_or(BankErrorCode::MathOverflow)?;
        Ok(u64::try_from(rounded_val).map_err(|_| BankErrorCode::MathOverflow)?)
    }

    /// Ceiling scaled decimal to u64
    pub fn try_ceil_u64(&self) -> Result<u64, ProgramError> {
        let ceil_val = Self::wad()
            .checked_sub(U192::from(1u64))
            .ok_or(BankErrorCode::MathOverflow)?
            .checked_add(self.0)
            .ok_or(BankErrorCode::MathOverflow)?
            .checked_div(Self::wad())
            .ok_or(BankErrorCode::MathOverflow)?;
        Ok(u64::try_from(ceil_val).map_err(|_| BankErrorCode::MathOverflow)?)
    }

    /// Converts the scaled decimal to a percentage as a u16 (BPS)
    pub fn to_percent(&self) -> Result<u16, ProgramError> {
        let percent = self
            .0
            .checked_add(U192::from(PERCENT_SCALER / 2))
            .ok_or(BankErrorCode::MathOverflow)?
            .checked_mul(U192::from(BPS))
            .ok_or(BankErrorCode::MathOverflow)?
            .checked_div(U192::from(WAD))
            .ok_or(BankErrorCode::MathOverflow)?;
        Ok(u16::try_from(percent).map_err(|_| BankErrorCode::MathOverflow)?)
    }

    /// Converts the scaled decimal to a rate as a u64
    pub fn to_rate(&self) -> Result<u64, ProgramError> {
        let percent = self
            .0
            .checked_add(U192::from(RATE_SCALER / 2))
            .ok_or(BankErrorCode::MathOverflow)?
            .checked_div(U192::from(RATE_SCALER))
            .ok_or(BankErrorCode::MathOverflow)?;
        Ok(u64::try_from(percent).map_err(|_| BankErrorCode::MathOverflow)?)
    }

}

impl fmt::Display for Decimal {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let mut scaled_val = self.0.to_string();
        if scaled_val.len() <= SCALE {
            scaled_val.insert_str(0, &vec!["0"; SCALE - scaled_val.len()].join(""));
            scaled_val.insert_str(0, "0.");
        } else {
            scaled_val.insert(scaled_val.len() - SCALE, '.');
        }
        f.write_str(&scaled_val)
    }
}

impl From<u64> for Decimal {
    fn from(val: u64) -> Self {
        Self(Self::wad() * U192::from(val))
    }
}

impl From<u128> for Decimal {
    fn from(val: u128) -> Self {
        Self(Self::wad() * U192::from(val))
    }
}

impl TryAdd for Decimal {
    fn try_add(self, rhs: Self) -> Result<Self, ProgramError> {
        Ok(Self(
            self.0
                .checked_add(rhs.0)
                .ok_or(BankErrorCode::MathOverflow)?,
        ))
    }
}

impl TrySub for Decimal {
    fn try_sub(self, rhs: Self) -> Result<Self, ProgramError> {
        Ok(Self(
            self.0
                .checked_sub(rhs.0)
                .ok_or(BankErrorCode::MathOverflow)?,
        ))
    }
}

impl TryDiv<u64> for Decimal {
    fn try_div(self, rhs: u64) -> Result<Self, ProgramError> {
        Ok(Self(
            self.0
                .checked_div(U192::from(rhs))
                .ok_or(BankErrorCode::MathOverflow)?,
        ))
    }
}

impl TryDiv<Decimal> for Decimal {
    fn try_div(self, rhs: Self) -> Result<Self, ProgramError> {
        Ok(Self(
            self.0
                .checked_mul(Self::wad())
                .ok_or(BankErrorCode::MathOverflow)?
                .checked_div(rhs.0)
                .ok_or(BankErrorCode::MathOverflow)?,
        ))
    }
}

impl TryMul<u64> for Decimal {
    fn try_mul(self, rhs: u64) -> Result<Self, ProgramError> {
        Ok(Self(
            self.0
                .checked_mul(U192::from(rhs))
                .ok_or(BankErrorCode::MathOverflow)?,
        ))
    }
}

impl TryMul<Decimal> for Decimal {
    fn try_mul(self, rhs: Self) -> Result<Self, ProgramError> {
        Ok(Self(
            self.0
                .checked_mul(rhs.0)
                .ok_or(BankErrorCode::MathOverflow)?
                .checked_div(Self::wad())
                .ok_or(BankErrorCode::MathOverflow)?,
        ))
    }
}

#[cfg(test)]
mod test {

    use anchor_lang::prelude::msg;

    use super::*;

    #[test]
    fn test_scaler() {
        assert_eq!(U192::exp10(SCALE), Decimal::wad());
    }

    #[test]
    fn test_u192() {
        let one = U192::from(1);
        assert_eq!(one.0, [1u64, 0, 0]);

        let wad = Decimal::wad();
        assert_eq!(wad.0, [WAD, 0, 0]);

        let hundred = Decimal::from(100u64);
        // 2^64 * 5 + 7766279631452241920 = 1e20
        assert_eq!(hundred.0 .0, [7766279631452241920, 5, 0]);
    }

    #[test]
    fn test_percentage_methods() {
        // Arrange
        let percent = Decimal::from_percent(255u16);
        let upper_increment = Decimal(U192::from(50_000_000_000_000u128));
        let lower_increment = Decimal(U192::from(40_000_000_000_000u128));

        // Act
        let sum_a = percent.try_add(upper_increment).unwrap().to_percent().unwrap();
        let sum_b = percent.try_add(lower_increment).unwrap().to_percent().unwrap();

        // Assert
        assert_eq!(sum_a, 256u16);
        assert_eq!(sum_b, 255u16);
    }

    
    #[test]
    fn test_rate_methods() {
        // Arrange
        let rate = Decimal::from_rate(1_000_000_000_000_000u64);
        let upper_increment = Decimal(U192::from(500u128));
        let lower_increment = Decimal(U192::from(400u128));
        
        // Act
        let sum_a = rate.try_add(upper_increment).unwrap().to_rate().unwrap();
        let sum_b = rate.try_add(lower_increment).unwrap().to_rate().unwrap();

        // Assert
        assert_eq!(sum_a, 1_000_000_000_000_001u64);
        assert_eq!(sum_b, 1_000_000_000_000_000u64);
    }

    #[test]
    fn test_decimal_from_token_amount() {
        let usdc_amount = 1_000_000u64; // 1 USDC
        let usdc_decimals = 6;

        let sol_amount = 1_000_000_000u64; // 1 SOL
        let sol_decimals = 9;

        let usdc_amount_d = Decimal::from_token_amount(usdc_amount, usdc_decimals);
        let sol_amount_d = Decimal::from_token_amount(sol_amount, sol_decimals);

        assert_eq!(usdc_amount_d.0, sol_amount_d.0);
    }

    #[test]
    fn test_from_pyth_price() {
        let price = 206344593399i64;
        let exponent = -8i32;

        let price_decimal = Decimal::from_pyth_price(price, exponent);
        msg!("Price decimal: {:?}", price_decimal.0);

    }

    #[test]
    fn test_decimal_to_token_amount() {
        // Assume Decimal in WAD format representing 10 tokens
        let decimal = Decimal::from_scaled_val(10_000_000_000_000_000_000u128); // 10 * 10^18
        let usdc_decimals = 6;

        let token_amount = decimal.to_token_amount(usdc_decimals).unwrap();

        // Convert back to USDC smallest unit (6 decimals): 10 * 10^6 = 10_000_000
        assert_eq!(token_amount, 10_000_000u64);
    }

    #[test]
    fn test_decimal_serialization_deserialization() {
        // Create an instance of Decimal
        let original = Decimal(U192::from(123456789u64));

        // Serialize the Decimal
        let mut serialized = Vec::new();
        original.serialize(&mut serialized).expect("Serialization failed");
        println!("Serialized: {:?}", serialized);

        // Deserialize back into a Decimal
        let deserialized: Decimal = Decimal::deserialize(&mut &serialized[..]).expect("Deserialization failed");
        println!("Deserialized: {:?}", deserialized);

        // Assert that the original and deserialized values are the same
        assert_eq!(original, deserialized, "Original and deserialized values do not match");

        println!("Serialization and deserialization test passed!");
    }

    #[test]
    fn test_token_value() {
        let amount = 1_000_000_000u64; // 1 SOL
        let mint_decimals = 9u8;
        let decimal_amount = Decimal::from_token_amount(amount, mint_decimals);
        let price = 200u64;
        let price_decimal = Decimal::from(price);

        msg!("Decimal amount: {:?}", decimal_amount);
        msg!("Price decimal: {:?}", price_decimal);

        let token_value = decimal_amount
        .try_mul(price_decimal).unwrap();

        msg!("Token value: {:?}", token_value);

        assert_eq!(token_value.0, Decimal::wad() * 200);
    }

}