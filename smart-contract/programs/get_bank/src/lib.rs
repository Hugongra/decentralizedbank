pub mod math;
pub mod states;
pub mod errors;
pub mod oracles;

use anchor_lang::prelude::*;
use states::*;
use math::*;

declare_id!("Geh97tZGzncv1soduTSeFcLozkiSTUkbFdLN1gdiuKqJ");

#[program]
pub mod get_bank {

    use super::*;

    // -----------------------------------------------------------------------------------------------------
    // @ Bank
    // -----------------------------------------------------------------------------------------------------

    pub fn create_bank(ctx: Context<CreateBank>) -> Result<()> {
        return states::Bank::create_bank(ctx);
    }

    pub fn update_bank(ctx: Context<UpdateBank>, liquidator: Option<Pubkey>, fee_vault: Option<Pubkey>, available: Option<bool>) -> Result<()> {
        return states::Bank::update_bank(ctx, liquidator, fee_vault, available);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Asset
    // -----------------------------------------------------------------------------------------------------

    pub fn create_sol_asset(ctx: Context<CreateSolAsset>, config: AssetConfig) -> Result<()> {
        return states::Asset::create_sol_asset(ctx, config);
    }

    pub fn create_token_asset_vaults(ctx: Context<CreateTokenAssetVaults>) -> Result<()> {
        return states::Asset::create_token_asset_vaults(ctx);
    }

    pub fn create_token_asset(ctx: Context<CreateTokenAsset>, config: AssetConfig) -> Result<()> {
        return states::Asset::create_token_asset(ctx, config);
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
        oracle_id: Option<Pubkey>) -> Result<()> {
        return states::Asset::update_asset(
            ctx, 
            optimal_utilization_rate,
            deposit_limit, 
            max_deposit_apr, 
            min_deposit_apr,
            borrow_limit,
            max_borrow_apr,
            min_borrow_apr,
            r_slope_1,
            r_slope_2,
            borrow_weight,
            borrow_fee,
            open_ltv,
            close_ltv,
            max_close_ltv,
            liquidation_fee,
            oracle_id
        );
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Deposit
    // -----------------------------------------------------------------------------------------------------

    pub fn create_deposit(ctx: Context<CreateDeposit>) -> Result<()> {
        return states::Deposit::create_deposit(ctx);
    }

    pub fn deposit_sol(ctx: Context<SolDepositAccounts>, amount: u64) -> Result<()> {
        return states::Deposit::deposit_sol(ctx, amount);
    }

    pub fn withdraw_sol(ctx: Context<SolDepositAccounts>, amount: u64) -> Result<()> {
        return states::Deposit::withdraw_sol(ctx, amount);
    }

    pub fn deposit_token(ctx: Context<TokenDepositAccounts>, amount: u64) -> Result<()> {
        return states::Deposit::deposit_token(ctx, amount);
    }

    pub fn withdraw_token(ctx: Context<TokenDepositAccounts>, amount: u64) -> Result<()> {
        return states::Deposit::withdraw_token(ctx, amount);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Borrow
    // -----------------------------------------------------------------------------------------------------

    pub fn borrow_sol(ctx: Context<BorrowSol>, amount: u64, borrow_price: u64, deposit_price: u64) -> Result<()> {
        return states::Borrow::borrow_sol(ctx, amount, borrow_price, deposit_price);
    }

    pub fn repay_sol(ctx: Context<RepaySol>, amount: u64) -> Result<()> {
        return states::Borrow::repay_sol(ctx, amount);
    }

    pub fn borrow_token(ctx: Context<BorrowToken>, amount: u64, borrow_price: u64, deposit_price: u64) -> Result<()> {
        return states::Borrow::borrow_token(ctx, amount, borrow_price, deposit_price);
    }

    pub fn repay_token(ctx: Context<RepayToken>, amount: u64) -> Result<()> {
        return states::Borrow::repay_token(ctx, amount);
    }

    pub fn mark_to_liquidate(ctx: Context<MarkToLiquidate>, borrow_price: u64, deposit_price: u64) -> Result<()> {
        return states::Borrow::mark_to_liquidate(ctx, borrow_price, deposit_price);
    }

    pub fn liquidate_sol_auto(ctx: Context<LiquidateSolAuto>, price: u64) -> Result<()> {
        return states::Borrow::liquidate_sol_auto(ctx, price);
    }

    pub fn liquidate_token_auto(ctx: Context<LiquidateTokenAuto>, price: u64) -> Result<()> {
        return states::Borrow::liquidate_token_auto(ctx, price);
    }

}
