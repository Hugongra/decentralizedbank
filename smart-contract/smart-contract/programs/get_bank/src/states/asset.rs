use {
    super::*, crate::{
        errors::BankErrorCode, math::{BPS, HALF_BPS, HALF_RATE}, RATE, SLOTS_PER_YEAR
    }, anchor_lang::{
        prelude::*,
        solana_program::{
            log::sol_log_compute_units, 
            pubkey::Pubkey
        }
    }, anchor_spl::{
        associated_token::AssociatedToken,
        token::{Mint, Token, TokenAccount}
    }
};

#[account]
#[derive(Debug, Default, PartialEq)]
pub struct Asset {
    /// Version of the struct
    pub version: u8,
    /// Last slot when supply and rates updated
    pub last_update: LastUpdate,
    /// Bank address
    pub bank: Pubkey,
    /// Reserve mint address, for native token SOL is default
    pub mint_pubkey: Pubkey,
    /// Collateral representative mint address
    pub representative_mint_pubkey: Pubkey,
    /// Mint decimals
    pub mint_decimals: u8,
    /// Total Deposit amount
    pub deposit_amount: u64,
    /// Total Borrow amount
    pub borrow_amount: u64,
    /// Global Deposit Rate
    pub deposit_global_rate: u64,
    /// Global Borrow Rate
    pub borrow_global_rate: u64,
    /// Deposit APR
    pub deposit_apr: u16,
    /// Borrow APR
    pub borrow_apr: u16,
    /// Asset configuration params
    pub config: AssetConfig
}

impl Asset {
    pub const LEN: usize =
    8 +
    1 + 
    LastUpdate::LEN + 
    32 +
    32 +
    32 +
    1 +
    8 +
    8 +
    8 +
    8 +
    2 +
    2 +
    AssetConfig::LEN;

    /******************************************************************
     *                      UTILITY METHODS                           *      
    ******************************************************************/

    pub fn update_aprs_and_rates(&mut self, slot: u64) -> Result<()> {

        // -----------------------------------------------------------------------------------------------------
        // 1) Recalculate APRs
        // -----------------------------------------------------------------------------------------------------

        // Calculate the utilization rate: borrow_amount / deposit_amount
        let utilization_rate: u16 = if self.deposit_amount == 0 {
            0
        } else {
            (self.borrow_amount as u128)
                .checked_mul(BPS as u128)
                .and_then(|v| v.checked_div(self.deposit_amount as u128))
                .ok_or(BankErrorCode::MathOverflow)? as u16
        };

        // Calculate the borrow APR
        if utilization_rate <= self.config.optimal_utilization_rate {
            // borrow_apr: min_borrow_apr + utilization_rate * r_slope_1
            self.borrow_apr = u16::try_from(
                (self.config.min_borrow_apr as u64)
                    .checked_add(
                        (utilization_rate as u64)
                            .checked_mul(self.config.r_slope_1 as u64)
                            .and_then(|v| v.checked_add(HALF_BPS as u64))
                            .and_then(|v| v.checked_div(BPS as u64))
                            .ok_or(BankErrorCode::MathOverflow)?
                    )
                    .ok_or(BankErrorCode::MathOverflow)?
            ).map_err(|_| BankErrorCode::MathOverflow)?;
        } else {
            // borrow_apr: min_borrow_apr + optimal_utilization_rate * r_slope_1 + (utilization_rate - optimal_utilization_rate) * r_slope_2
            self.borrow_apr = u16::try_from(
                (self.config.min_borrow_apr as u64)
                    .checked_add(
                        (self.config.optimal_utilization_rate as u64)
                            .checked_mul(self.config.r_slope_1 as u64)
                            .and_then(|v| v.checked_add(HALF_BPS as u64))
                            .and_then(|v| v.checked_div(BPS as u64))
                            .ok_or(BankErrorCode::MathOverflow)?
                    )
                    .ok_or(BankErrorCode::MathOverflow)?
                    .checked_add(
                        (utilization_rate as u64 - self.config.optimal_utilization_rate as u64)
                            .checked_mul(self.config.r_slope_2 as u64)
                            .and_then(|v| v.checked_add(HALF_BPS as u64))
                            .and_then(|v| v.checked_div(BPS as u64))
                            .ok_or(BankErrorCode::MathOverflow)?
                    )
                    .ok_or(BankErrorCode::MathOverflow)?
            ).map_err(|_| BankErrorCode::MathOverflow)?;
        }

        // Calculate the deposit APR: utilization_rate * borrow_apr * (1 - borrow_fee)
        self.deposit_apr = (utilization_rate as u64)
            .checked_mul(self.borrow_apr as u64)
            .and_then(|v| v.checked_mul((BPS - self.config.borrow_fee) as u64))
            .and_then(|v| v.checked_div(BPS as u64))
            .and_then(|v| v.checked_add(HALF_BPS as u64))
            .and_then(|v| v.checked_div(BPS as u64))
            .ok_or(BankErrorCode::MathOverflow)? as u16;

        // -----------------------------------------------------------------------------------------------------
        // 2) Recalculate Rates
        // -----------------------------------------------------------------------------------------------------

        // Calculate the elapsed ratio: (slot - last_update.slot) / SLOTS_PER_YEAR
        let slot_diff = slot.checked_sub(self.last_update.slot).ok_or(BankErrorCode::MathOverflow)?;
        let elapsed_ratio = (slot_diff as u128)
        .checked_mul(RATE as u128)
        .and_then(|v| v.checked_div(SLOTS_PER_YEAR as u128))
        .ok_or(BankErrorCode::MathOverflow)?;

        // Scaling factor for the percents to convert into rates
        let scaling_factor = 10u128.checked_pow(11).ok_or(BankErrorCode::MathOverflow)?;

        // Calculate the deposit rate increment
        let deposit_rate_increment = (self.deposit_apr as u128)
        .checked_mul(scaling_factor)
        .and_then(|v| v.checked_mul(elapsed_ratio))
        .and_then(|v| v.checked_add(HALF_RATE as u128))
        .and_then(|v| v.checked_div(RATE as u128))
        .ok_or(BankErrorCode::MathOverflow)?;

        // Calculate the borrow rate increment
        let borrow_rate_increment =  (self.borrow_apr as u128)
        .checked_mul(scaling_factor)
        .and_then(|v| v.checked_mul(elapsed_ratio))
        .and_then(|v| v.checked_add(HALF_RATE as u128))
        .and_then(|v| v.checked_div(RATE as u128))
        .ok_or(BankErrorCode::MathOverflow)?;

        // -----------------------------------------------------------------------------------------------------
        // 3) Updates Asset Account
        // -----------------------------------------------------------------------------------------------------

        // Update the rates
        self.deposit_global_rate = self.deposit_global_rate
        .checked_add(deposit_rate_increment as u64)
        .ok_or(BankErrorCode::MathOverflow)?;
        
        self.borrow_global_rate = self.borrow_global_rate
        .checked_add(borrow_rate_increment as u64)
        .ok_or(BankErrorCode::MathOverflow)?;

        Ok(())

    }

    /******************************************************************
     *                      ENTRY POINTS                              *      
    ******************************************************************/

    pub fn create_sol_asset(ctx: Context<CreateSolAsset>, config: AssetConfig) -> Result<()> {

        // -----------------------------------------------------------------------------------------------------
        // @ Variables
        // -----------------------------------------------------------------------------------------------------
        
        // States
        let bank = &ctx.accounts.bank;
        let asset = &mut ctx.accounts.asset;
        
        // System
        let representative_mint = &ctx.accounts.representative_mint;

        // -----------------------------------------------------------------------------------------------------
        // 1) Validations
        // -----------------------------------------------------------------------------------------------------
        
        // Only Admin Wallet is allowed to create assets
        require!(bank.admin.key() == ctx.accounts.admin_wallet.key(), BankErrorCode::Unauthorized);

        // Asset config
        // ----- Utilization -----
        require!(config.optimal_utilization_rate <= BPS, BankErrorCode::InvalidPercent);
        // ----- Deposits -----
        require!(config.deposit_limit <= BPS, BankErrorCode::InvalidPercent);
        require!(config.min_deposit_apr <= BPS, BankErrorCode::InvalidPercent);
        require!(config.max_deposit_apr <= BPS, BankErrorCode::InvalidPercent);
        // ----- Borrow -----
        require!(config.min_borrow_apr <= BPS, BankErrorCode::InvalidPercent);
        require!(config.max_borrow_apr <= BPS, BankErrorCode::InvalidPercent);
        require!(config.r_slope_1 <= BPS, BankErrorCode::InvalidPercent);
        require!(config.r_slope_2 <= BPS, BankErrorCode::InvalidPercent);
        require!(config.borrow_weight <= BPS, BankErrorCode::InvalidPercent);
        require!(config.borrow_fee <= BPS, BankErrorCode::InvalidPercent);
        // ----- Risk Management -----
        require!(config.open_ltv <= BPS, BankErrorCode::InvalidPercent);
        require!(config.close_ltv <= BPS, BankErrorCode::InvalidPercent);
        require!(config.max_close_ltv <= BPS, BankErrorCode::InvalidPercent);
        require!(config.liquidation_fee <= BPS, BankErrorCode::InvalidPercent);
        // ----- Administrative -----
        require!(config.oracle_id != Pubkey::default(), BankErrorCode::InvalidFeeVaultPubkey);

        msg!("Validations passed");
        sol_log_compute_units();

        // -----------------------------------------------------------------------------------------------------
        // 2) Initialize the asset account
        // -----------------------------------------------------------------------------------------------------

        asset.version = PROGRAM_VERSION;
        asset.last_update = LastUpdate::new(ctx.accounts.clock.slot);
        asset.bank = bank.key();
        asset.mint_decimals = 9; // SOL has 9 decimals
        asset.mint_pubkey = Pubkey::default(); // Special case for SOL
        asset.representative_mint_pubkey = representative_mint.key();
        asset.deposit_amount = 0;
        asset.borrow_amount = 0;
        asset.deposit_global_rate = RATE;
        asset.borrow_global_rate = RATE;
        asset.deposit_apr = config.min_deposit_apr;
        asset.borrow_apr = config.min_borrow_apr;
        asset.config.optimal_utilization_rate = config.optimal_utilization_rate;
        asset.config.deposit_limit = config.deposit_limit;
        asset.config.max_deposit_apr = config.max_deposit_apr;
        asset.config.min_deposit_apr = config.min_deposit_apr;
        asset.config.borrow_limit = config.borrow_limit;
        asset.config.max_borrow_apr = config.max_borrow_apr;
        asset.config.min_borrow_apr = config.min_borrow_apr;
        asset.config.r_slope_1 = config.r_slope_1;
        asset.config.r_slope_2 = config.r_slope_2;
        asset.config.borrow_weight = config.borrow_weight;
        asset.config.borrow_fee = config.borrow_fee;
        asset.config.open_ltv = config.open_ltv;
        asset.config.close_ltv = config.close_ltv;
        asset.config.max_close_ltv = config.max_close_ltv;
        asset.config.liquidation_fee = config.liquidation_fee;
        asset.config.oracle_id = config.oracle_id;

        msg!("Created SOL asset account");
        sol_log_compute_units();

        Ok(())

    }

    pub fn create_token_asset_vaults(ctx: Context<CreateTokenAssetVaults>) -> Result<()> {
        
        // -----------------------------------------------------------------------------------------------------
        // @ Variables
        // -----------------------------------------------------------------------------------------------------

        // States
        let bank = &ctx.accounts.bank;

        // -----------------------------------------------------------------------------------------------------
        // 1) Validations
        // -----------------------------------------------------------------------------------------------------

        require!(bank.admin.key() == ctx.accounts.admin_wallet.key(), BankErrorCode::Unauthorized);

        msg!("Created Token asset vaults");
        sol_log_compute_units();

        Ok(())

    }

    pub fn create_token_asset(ctx: Context<CreateTokenAsset>, config: AssetConfig) -> Result<()> {

        // -----------------------------------------------------------------------------------------------------
        // @ Variables
        // -----------------------------------------------------------------------------------------------------
        
        // States
        let bank = &ctx.accounts.bank;
        let asset = &mut ctx.accounts.asset;
        
        // System
        let mint = &ctx.accounts.mint;
        let representative_mint = &ctx.accounts.representative_mint;

        // -----------------------------------------------------------------------------------------------------
        // 1) Validations
        // -----------------------------------------------------------------------------------------------------

        require!(bank.admin.key() == ctx.accounts.admin_wallet.key(), BankErrorCode::Unauthorized);

        // Asset config
        // ----- Utilization -----
        require!(config.optimal_utilization_rate <= BPS, BankErrorCode::InvalidPercent);
        // ----- Deposits -----
        require!(config.deposit_limit <= BPS, BankErrorCode::InvalidPercent);
        require!(config.min_deposit_apr <= BPS, BankErrorCode::InvalidPercent);
        require!(config.max_deposit_apr <= BPS, BankErrorCode::InvalidPercent);
        // ----- Borrow -----
        require!(config.borrow_limit <= BPS, BankErrorCode::InvalidPercent);
        require!(config.min_borrow_apr <= BPS, BankErrorCode::InvalidPercent);
        require!(config.max_borrow_apr <= BPS, BankErrorCode::InvalidPercent);
        require!(config.r_slope_1 <= BPS, BankErrorCode::InvalidPercent);
        require!(config.r_slope_2 <= BPS, BankErrorCode::InvalidPercent);
        require!(config.borrow_weight <= BPS, BankErrorCode::InvalidPercent);
        require!(config.borrow_fee <= BPS, BankErrorCode::InvalidPercent);
        // ----- Risk Management -----
        require!(config.open_ltv <= BPS, BankErrorCode::InvalidPercent);
        require!(config.close_ltv <= BPS, BankErrorCode::InvalidPercent);
        require!(config.max_close_ltv <= BPS, BankErrorCode::InvalidPercent);
        require!(config.liquidation_fee <= BPS, BankErrorCode::InvalidPercent);
        // ----- Administrative -----
        require!(config.oracle_id != Pubkey::default(), BankErrorCode::InvalidFeeVaultPubkey);

        msg!("Validations passed");
        sol_log_compute_units();

        // -----------------------------------------------------------------------------------------------------
        // 2) Initialize the asset account
        // -----------------------------------------------------------------------------------------------------

        asset.version = PROGRAM_VERSION;
        asset.last_update = LastUpdate::new(ctx.accounts.clock.slot);
        asset.bank = bank.key();
        asset.mint_decimals = mint.decimals;
        asset.mint_pubkey = mint.key();
        asset.representative_mint_pubkey = representative_mint.key();
        asset.deposit_amount = 0;
        asset.borrow_amount = 0;
        asset.deposit_global_rate = RATE;
        asset.borrow_global_rate = RATE;
        asset.deposit_apr = config.min_deposit_apr;
        asset.borrow_apr = config.min_borrow_apr;
        asset.config.optimal_utilization_rate = config.optimal_utilization_rate;
        asset.config.deposit_limit = config.deposit_limit;
        asset.config.max_deposit_apr = config.max_deposit_apr;
        asset.config.min_deposit_apr = config.min_deposit_apr;
        asset.config.borrow_limit = config.borrow_limit;
        asset.config.max_borrow_apr = config.max_borrow_apr;
        asset.config.min_borrow_apr = config.min_borrow_apr;
        asset.config.r_slope_1 = config.r_slope_1;
        asset.config.r_slope_2 = config.r_slope_2;
        asset.config.borrow_weight = config.borrow_weight;
        asset.config.borrow_fee = config.borrow_fee;
        asset.config.open_ltv = config.open_ltv;
        asset.config.close_ltv = config.close_ltv;
        asset.config.max_close_ltv = config.max_close_ltv;
        asset.config.liquidation_fee = config.liquidation_fee;
        asset.config.oracle_id = config.oracle_id;

        msg!("Created Token asset account");
        sol_log_compute_units();

        Ok(())

    }

    pub fn update_asset(
        ctx: Context<UpdateAsset>,
        // ----- Utilization -----
        optimal_utilization_rate: Option<u16>,

        // ----- Deposits -----
        deposit_limit: Option<u16>,
        max_deposit_apr: Option<u16>,
        min_deposit_apr: Option<u16>,

        // ----- Borrows -----
        borrow_limit: Option<u16>,
        max_borrow_apr: Option<u16>,
        min_borrow_apr: Option<u16>,
        r_slope_1: Option<u16>,
        r_slope_2: Option<u16>,
        borrow_weight: Option<u16>,
        borrow_fee: Option<u16>,

        // ----- Risk Management -----
        open_ltv: Option<u16>,
        close_ltv: Option<u16>,
        max_close_ltv: Option<u16>,
        liquidation_fee: Option<u16>,

        // ----- Administrative -----
        oracle_id: Option<Pubkey>
    ) -> Result<()> {

        // -----------------------------------------------------------------------------------------------------
        // @ Variables
        // -----------------------------------------------------------------------------------------------------
        
        // Accounts
        let bank = &ctx.accounts.bank;
        let asset = &mut ctx.accounts.asset;

        // -----------------------------------------------------------------------------------------------------
        // 1) Validations
        // -----------------------------------------------------------------------------------------------------

        // Check if the admin wallet is the bank admin
        require!(ctx.accounts.admin_wallet.key() == bank.admin, BankErrorCode::Unauthorized);

        // Check if the asset account belongs to the bank
        require!(asset.bank == bank.key(), BankErrorCode::NotOwnedByBank);

        // -----------------------------------------------------------------------------------------------------
        // 2) Update the asset account
        // -----------------------------------------------------------------------------------------------------

        // ----- Utilization -----
        if let Some(rate) = optimal_utilization_rate {
            require!(rate <= BPS, BankErrorCode::InvalidPercent);
            asset.config.optimal_utilization_rate = rate;
        }

        // ----- Deposits -----
        if let Some(limit) = deposit_limit {
            require!(limit <= BPS, BankErrorCode::InvalidPercent);
            asset.config.deposit_limit = limit;
        }
        if let Some(apr) = max_deposit_apr {
            require!(apr <= BPS, BankErrorCode::InvalidPercent);
            asset.config.max_deposit_apr = apr;
        }
        if let Some(apr) = min_deposit_apr {
            require!(apr <= BPS, BankErrorCode::InvalidPercent);
            require!(apr <= asset.config.max_deposit_apr, BankErrorCode::InvalidPercent);
            asset.config.min_deposit_apr = apr;
        }

        // ----- Borrows -----
        if let Some(limit) = borrow_limit {
            require!(limit <= BPS, BankErrorCode::InvalidPercent);
            asset.config.borrow_limit = limit;
        }
        if let Some(apr) = max_borrow_apr {
            require!(apr <= BPS, BankErrorCode::InvalidPercent);
            asset.config.max_borrow_apr = apr;
        }
        if let Some(apr) = min_borrow_apr {
            require!(apr <= BPS, BankErrorCode::InvalidPercent);
            require!(apr <= asset.config.max_borrow_apr, BankErrorCode::InvalidPercent);
            asset.config.min_borrow_apr = apr;
        }
        if let Some(r_slope) = r_slope_1 {
            require!(r_slope <= BPS, BankErrorCode::InvalidPercent);
            asset.config.r_slope_1 = r_slope;
        }
        if let Some(r_slope) = r_slope_2 {
            require!(r_slope <= BPS, BankErrorCode::InvalidPercent);
            asset.config.r_slope_2 = r_slope;
        }
        if let Some(weight) = borrow_weight {
            require!(weight <= BPS, BankErrorCode::InvalidPercent);
            asset.config.borrow_weight = weight;
        }
        if let Some(fee) = borrow_fee {
            require!(fee <= BPS, BankErrorCode::InvalidPercent);
            asset.config.borrow_fee = fee;
        }

        // ----- Risk Management -----
        if let Some(ltv) = open_ltv {
            require!(ltv <= BPS, BankErrorCode::InvalidPercent);
            asset.config.open_ltv = ltv;
        }
        if let Some(ltv) = close_ltv {
            require!(ltv <= BPS, BankErrorCode::InvalidPercent);
            asset.config.close_ltv = ltv;
        }
        if let Some(ltv) = max_close_ltv {
            require!(ltv <= BPS, BankErrorCode::InvalidPercent);
            asset.config.max_close_ltv = ltv;
        }
        if let Some(fee) = liquidation_fee {
            asset.config.liquidation_fee = fee;
        }

        // ----- Administrative -----
        if let Some(oracle_id) = oracle_id {
            require!(oracle_id != Pubkey::default(), BankErrorCode::InvalidOracleIdPubkey);
            asset.config.oracle_id = oracle_id;
        }

        // Update the last update slot
        asset.last_update.update_slot(ctx.accounts.clock.slot);

        msg!("Upadted asset account");
        sol_log_compute_units();

        Ok(())

    }

}

#[derive(Clone, Debug, Default, PartialEq, AnchorDeserialize, AnchorSerialize)]
pub struct AssetConfig {
    
    // ----- Utilization ----- LEN: 2
    /// Optimal utilization rate for the reserve
    pub optimal_utilization_rate: u16,

    // ----- Deposits ----- LEN: 2 * 3 = 6
    /// Deposit limit percent per user
    pub deposit_limit: u16,
    /// Maximum APR for deposits
    pub max_deposit_apr: u16,
    /// Minimum APR for deposits
    pub min_deposit_apr: u16,

    // ----- Borrows ----- LEN: 2 * 7 = 14
    /// Borrow limit percent per user
    pub borrow_limit: u16,
    /// Maximum APR for borrows
    pub max_borrow_apr: u16,
    /// Minimum APR for borrows
    pub min_borrow_apr: u16,
    /// Gradual interest rate increase when Utilization Rate is optimal
    pub r_slope_1: u16,
    /// Gradual interest rate increase when Utilization Rate is above optimal
    pub r_slope_2: u16,
    /// Weight applied to this asset for borrowing calculations
    pub borrow_weight: u16,
    /// Fee charged to borrowers as a percentage
    pub borrow_fee: u16,

    // ----- Risk Management ----- LEN: 2 * 4 = 8
    /// Loan-to-value ratio for initiating a borrow
    pub open_ltv: u16,
    /// Loan-to-value ratio for warning (close to liquidation), used in Health Factor calculation
    pub close_ltv: u16,
    /// Maximum loan-to-value ratio before liquidation
    pub max_close_ltv: u16,
    /// Penalty applied during liquidation
    pub liquidation_fee: u16,

    // ----- Administrative ----- LEN: 32 = 32
    /// Oracle ID for the asset
    pub oracle_id: Pubkey

}

impl AssetConfig {

    pub const LEN: usize = 8 + 2 + 6 + 14 + 8 + 32;

}

#[derive(Accounts)]
pub struct CreateSolAsset<'info> {
    #[account(mut)]
    pub admin_wallet: Signer<'info>,
    pub representative_mint: Account<'info, Mint>,
    #[account(seeds = [b"bank", admin_wallet.key().as_ref()], bump)]
    pub bank: Account<'info, Bank>,
    #[account(
        init,
        payer = admin_wallet,
        space = Asset::LEN,
        seeds = [b"asset", bank.key().as_ref(), Pubkey::default().as_ref()],
        bump
    )]
    pub asset: Account<'info, Asset>,
    /// CHECK: The `reserve_vault` is a `SystemAccount` that is the reserve vault of the SOL asset.
    #[account(
        init,
        payer = admin_wallet,
        space = 0,
        seeds = [b"reserve", bank.key().as_ref()],
        bump
    )]
    pub reserve_vault: AccountInfo<'info>,
    #[account(
        init,
        payer = admin_wallet,
        associated_token::mint = representative_mint,
        associated_token::authority = bank,
    )]
    pub collateral_vault: Account<'info, TokenAccount>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub clock: Sysvar<'info, Clock>
}

#[derive(Accounts)]
pub struct CreateTokenAssetVaults<'info> {
    #[account(mut)]
    pub admin_wallet: Signer<'info>,
    pub mint: Account<'info, Mint>,
    pub representative_mint: Account<'info, Mint>,
    #[account(seeds = [b"bank", admin_wallet.key().as_ref()], bump)]
    pub bank: Account<'info, Bank>,
    #[account(
        init,
        payer = admin_wallet,
        associated_token::mint = mint,
        associated_token::authority = bank,
    )]
    pub reserve_vault: Account<'info, TokenAccount>,
    #[account(
        init,
        payer = admin_wallet,
        associated_token::mint = representative_mint,
        associated_token::authority = bank,
    )]
    pub collateral_vault: Account<'info, TokenAccount>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>
}


#[derive(Accounts)]
pub struct CreateTokenAsset<'info> {
    #[account(mut)]
    pub admin_wallet: Signer<'info>,
    pub mint: Account<'info, Mint>,
    pub representative_mint: Account<'info, Mint>,
    #[account(seeds = [b"bank", admin_wallet.key().as_ref()], bump)]
    pub bank: Account<'info, Bank>,
    #[account(
        init,
        payer = admin_wallet,
        space = Asset::LEN,
        seeds = [b"asset", bank.key().as_ref(), mint.key().as_ref()],
        bump
    )]
    pub asset: Account<'info, Asset>,
    #[account(
        associated_token::mint = mint,
        associated_token::authority = bank,
    )]
    pub reserve_vault: Account<'info, TokenAccount>,
    #[account(
        associated_token::mint = representative_mint,
        associated_token::authority = bank,
    )]
    pub collateral_vault: Account<'info, TokenAccount>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub clock: Sysvar<'info, Clock>
}

#[derive(Accounts)]
pub struct UpdateAsset<'info> {
    #[account()]
    pub admin_wallet: Signer<'info>,
    #[account()]
    pub bank: Account<'info, Bank>,
    #[account(mut)]
    pub asset: Account<'info, Asset>,
    pub clock: Sysvar<'info, Clock>
}

#[cfg(test)]
mod test {

    use anchor_lang::{prelude::msg, solana_program::pubkey::Pubkey};

    use super::{Asset, AssetConfig, LastUpdate};

    #[test]
    fn test_update_aprs_and_rates() {

        // Arrange
        let mut asset = Asset {
            version: 1,
            bank: Pubkey::new_unique(),
            last_update: LastUpdate {
                slot: 78_840_00u64,
                stale: false
            },
            mint_pubkey: Pubkey::new_unique(),
            representative_mint_pubkey: Pubkey::new_unique(),
            mint_decimals: 9,
            deposit_amount: 34674407370955161u64,
            borrow_amount: 4467440937095516u64,
            deposit_global_rate: 0u64,
            borrow_global_rate: 0u64,
            deposit_apr: 845,
            borrow_apr: 1148,
            config: AssetConfig {
                optimal_utilization_rate: 8_000u16,
                deposit_limit: 10_000,
                max_deposit_apr: 10_000,
                min_deposit_apr: 10_000,
                borrow_limit: 10_000,
                max_borrow_apr: 10_000,
                min_borrow_apr: 7u16,
                r_slope_1: 500u16,
                r_slope_2: 4400u16,
                borrow_weight: 10_000,
                borrow_fee: 2_400u16,
                open_ltv: 10_000,
                close_ltv: 10_000,
                max_close_ltv: 10_000,
                liquidation_fee: 10_000,
                oracle_id: Pubkey::new_unique()
            }
        };
        let slot = 71_840_000u64;

        // Act
        asset.update_aprs_and_rates(slot).unwrap();

        msg!("Borrow Apr: {:?}", asset.borrow_apr);
        msg!("Deposit Apr: {:?}", asset.deposit_apr);
        msg!("Deposit Global Rate: {:?}", asset.deposit_global_rate);
        msg!("Borrow Global Rate: {:?}", asset.borrow_global_rate);

        // Assert
        //assert_eq!(asset.deposit_apr, 84);
        //assert_eq!(asset.borrow_apr, 167);
        //assert_eq!(asset.deposit_global_rate, 1_000_703_703_703_704);
        //assert_eq!(asset.borrow_global_rate, 1_001_388_888_888_889);
        
    }

}
