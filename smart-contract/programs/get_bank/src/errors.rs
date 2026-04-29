use anchor_lang::prelude::*;

#[error_code]
pub enum BankErrorCode {
    /******************************************************************
     *                      Math                                      * 
    ******************************************************************/
    #[msg("Math Overflow")]
    MathOverflow,
    #[msg("Invalid Percent, must have 0 <= percent <= 10000")]
    InvalidPercent,
    #[msg("Exceeds Range")]
    ExceedsRange,
    #[msg("Not enough liquidity in the reserve")]
    InsufficientReserve,
    #[msg("Not enough collateral deposited to perform this borrow")]
    InsufficientCollateral,
    #[msg("User does not have enough funds in their reserve account")]
    InsufficientUserReserve,
    #[msg("User does not have enough funds in their deposit account")]
    InsufficientUserDeposit,
    #[msg("Invalid Rate Index, must be higher than the current global rate")]
    InvalidRateIndex,
    #[msg("The amount must be greater than zero")]
    InvalidAmount,
    #[msg("The price must be greater than zero")]
    InvalidPrice,
    /******************************************************************
     *                      Security                                  * 
    ******************************************************************/
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Not Owned By Program")]
    NotOwnedByProgram,
    #[msg("Not Owned By Bank")]
    NotOwnedByBank,
    #[msg("Bank unavailable")]
    BankUnavailable,
    /******************************************************************
     *                      States                                    * 
    ******************************************************************/
    // Asset
    // ----------------------------------------------------------------
    #[msg("Then oracle id pubkey cannot be default")]
    InvalidOracleIdPubkey,
    #[msg("Invalid mint decimals")]
    InvalidMintDecimals,
    #[msg("Invalid Mint Address")]
    InvalidMintAddress,
    #[msg("Wrong Fee Vault Address")]
    WrongFeeVaultAddress,
    #[msg("Wrong Reserve Vault Address")]
    WrongReserveVaultAddress,
    #[msg("Wrong Collateral Vault Address")]
    WrongCollateralVaultAddress,
    #[msg("Wrong User Token Reserve Vault Address")]
    WrongUserTokenReserveVaultAddress,
    // Bank
    // ----------------------------------------------------------------
    #[msg("Invalid Liquidatior pubkey")]
    InvalidLiquidatorPubkey,
    #[msg("Invalid Fee Vault pubkey")]
    InvalidFeeVaultPubkey,
    // Deposit
    // ----------------------------------------------------------------
    #[msg("Wrong Asset Address")]
    WrongAssetAddress,
    #[msg("Wrong Deposit Vault Address.")]
    WrongDepositVaultAddress,
    // Borrow
    // ----------------------------------------------------------------
    #[msg("Liquidation In Progress")]
    LiquidationInProgress,
    #[msg("Wrong Deposit Address")]
    WrongDepositAddress,
    #[msg("Not Borrowed Amount")]
    NotBorrowedAmount,
    #[msg("Not liquidatable")]
    NotLiquidatable,
    
}

impl From<BankErrorCode> for ProgramError {
    fn from(e: BankErrorCode) -> Self {
        ProgramError::Custom(e as u32)
    }
}