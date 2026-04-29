use {
    super::*, 
    crate::{
        errors::BankErrorCode,
        math::Decimal, 
        states::{
            asset::Asset,
            bank::Bank,
            deposit::Deposit
        },
        TryAdd, TryDiv, TryMul, TrySub, BPS
    }, 
    anchor_lang::{
        prelude::*, 
        solana_program::{
            log::sol_log_compute_units, 
            pubkey::Pubkey,
            system_instruction
        }
    }, 
    anchor_spl::{
        token::{Mint,Token,TokenAccount},
        associated_token::get_associated_token_address,
    }
};

#[account]
#[derive(Debug, Default, PartialEq)]
pub struct Borrow {
    /// Version of the struct
    pub version: u8,
    /// Last slot when supply and rates updated
    pub last_update: LastUpdate,
    /// User address
    pub user: Pubkey,
    /// Asset address
    pub asset: Pubkey,
    /// Borrowed amount
    pub amount: u64,
    /// Index of the borrow rate
    pub borrow_rate_index: u64,
    /// Deposit address used as collateral
    pub deposit: Pubkey,
    /// Collateral amount
    pub collateral_amount: u64,
    /// A flag indicating if the account is being liquidated
    pub liquidating: bool
}

pub struct RepaymentData {
    /*Note: This struct is used as DTO to store the repayment data.
    collateral_unlocked_amount: Is the amount of collateral unlocked by the repayment.
    repayment_reserve_amount: Is the amount of the repayment that goes to the reserve vault.
    repayment_fee_amount: Is the amount of the repayment that goes to the fee vault.
    debt_amount: Is the amount deducted from the borrow account.
    */
    collateral_unlocked_amount: u64,
    repayment_reserve_amount: u64,
    repayment_fee_amount: u64,
    debt_amount: u64
}

pub struct LiquidationData {
    /*Note: This struct is used as DTO to store the liquidation data.
    collateral_amount: Is the amount of collateral to liquidate.
    borrow_amount: Is the amount of borrow to pay.
    fee_amount: Is the amount of liquidation fee to pay.
    */
    borrow_amount: u64,
    collateral_amount: u64,
    fee_amount: u64
}

impl Borrow {
    pub const LEN: usize = 
    8 +
    1 +
    LastUpdate::LEN +
    32 +
    32 +
    8 +
    8 +
    32 +
    8 +
    1;

    /******************************************************************
     *                      UTILITY METHODS                           *      
    ******************************************************************/

    pub fn _is_liquidatable(
        &self,
        borrow_mint_decimals: u8,
        deposit_mint_decimals: u8,
        max_close_ltv: u16,
        borrow_weight: u16,
        borrow_price: Decimal,
        deposit_price: Decimal) -> Result<bool> {
        
        // Check if the borrow and deposit prices are valid
        require!(borrow_price > Decimal::zero(), BankErrorCode::InvalidPrice);
        require!(deposit_price > Decimal::zero(), BankErrorCode::InvalidPrice);

        let borrow_value = Decimal::from_token_amount(self.amount, borrow_mint_decimals)
        .try_mul(borrow_price)?;
        
        let collateral_value = Decimal::from_token_amount(self.collateral_amount, deposit_mint_decimals)
        .try_mul(deposit_price)?
        .try_mul(Decimal::from_percent(borrow_weight))?;

        let is_liquidable = borrow_value >= collateral_value.try_mul(Decimal::from_percent(max_close_ltv))?;

        Ok(is_liquidable)

    }

    pub fn _calculate_liquidation_data(
        &self,
        borrow_mint_decimals: u8,
        deposit_mint_decimals: u8,
        open_ltv: u16,
        borrow_weight: u16,
        liquidation_fee: u16,
        borrow_price: Decimal,
        deposit_price: Decimal) -> Result<LiquidationData> {
        
        // Check if the borrow and deposit prices are valid
        require!(borrow_price > Decimal::zero(), BankErrorCode::InvalidPrice);
        require!(deposit_price > Decimal::zero(), BankErrorCode::InvalidPrice);

        let borrow_amount = Decimal::from_token_amount(self.amount, borrow_mint_decimals);
        let collateral_amount = Decimal::from_token_amount(self.collateral_amount, deposit_mint_decimals);
        
        // Calculate the collateral amount to liquidate
        let collateral_amount = {
            let ltv_bw  = Decimal::from_percent(((borrow_weight as u32 * open_ltv as u32) / BPS as u32) as u16);
            let borrow_value = borrow_amount.try_mul(borrow_price)?;
            let collateral_value = collateral_amount.try_mul(deposit_price)?.try_mul(ltv_bw)?;
            let complement_liquidation_fee = Decimal::one().try_sub(Decimal::from_percent(liquidation_fee))?;
            let value_diff = borrow_value.try_sub(collateral_value)?;
            value_diff.try_div(
                deposit_price.try_mul(
                    complement_liquidation_fee.try_sub(ltv_bw)?
                )?
            )?
        };

        let price_ratio = borrow_price.try_div(deposit_price)?;
        
        // Calculate the borrow amount to paid
        let borrow_amount = {
            let complement_liquidation_fee = Decimal::one().try_sub(Decimal::from_percent(liquidation_fee))?;
            collateral_amount
            .try_mul(complement_liquidation_fee)?
            .try_mul(price_ratio)?
        };

        // Calculate the liquidation fee amount
        let liquidation_fee_amount = collateral_amount
        .try_mul(Decimal::from_percent(liquidation_fee))?
        .try_mul(price_ratio)?;

        Ok(LiquidationData {
            collateral_amount: collateral_amount.to_token_amount(deposit_mint_decimals)?,
            borrow_amount: borrow_amount.to_token_amount(borrow_mint_decimals)?,
            fee_amount: liquidation_fee_amount.to_token_amount(borrow_mint_decimals)?
        })

    }

    pub fn _calculate_collateral_amount(
        &self,
        borrow_amount: u64,
        deposit_vault_amount: u64,
        borrow_mint_decimals: u8,
        deposit_mint_decimals: u8,
        open_ltv: u16,
        borrow_weight: u16,
        borrow_price: Decimal,
        deposit_price: Decimal
    ) -> Result<u64> {

        // Calculate the total borrow amount
        let total_borrow_amount = borrow_amount.checked_add(self.amount).ok_or(BankErrorCode::MathOverflow)?;

        // Calculate the total borrow value
        let total_borrow_value = Decimal::from_token_amount(total_borrow_amount, borrow_mint_decimals)
        .try_mul(borrow_price)?;

        // Calculate the total collateral amount
        let total_collateral_amount = deposit_vault_amount.checked_add(self.collateral_amount).ok_or(BankErrorCode::MathOverflow)?;
        
        // Calculate the total collateral value
        let total_collateral_value: Decimal = Decimal::from_token_amount(total_collateral_amount, deposit_mint_decimals)
        .try_mul(deposit_price)?
        .try_mul(Decimal::from_percent(borrow_weight))?;
        
        // Calculate the max borrowable value
        let max_borrowable_value = total_collateral_value.try_mul(Decimal::from_percent(open_ltv))?;

        require!(max_borrowable_value >= total_borrow_value, BankErrorCode::InsufficientCollateral);

        // Calculate the borrow value
        let borrow_value = Decimal::from_token_amount(borrow_amount, borrow_mint_decimals).try_mul(borrow_price)?;

        let collateral_amount = borrow_value.try_div(
            deposit_price.try_mul(Decimal::from_percent(((borrow_weight as u32 * open_ltv as u32) / BPS as u32) as u16))?
        )?
        .to_token_amount(deposit_mint_decimals)?;

        require!(deposit_vault_amount >= collateral_amount, BankErrorCode::InsufficientCollateral);
        
        Ok(collateral_amount)
    }

    pub fn _calculate_repayment_data(
        &self,
        repayment_amount: u64,
        borrow_mint_decimals: u8,
        deposit_mint_decimals: u8,
        borrow_global_rate: u64,
        borrow_fee: u16,
    ) -> Result<RepaymentData>{

        require!(self.amount > 0, BankErrorCode::NotBorrowedAmount);
        
        let mut repayment_amount = Decimal::from_token_amount(repayment_amount, borrow_mint_decimals);

        require!(borrow_global_rate >= self.borrow_rate_index, BankErrorCode::InvalidRateIndex);
  
        let borrow_rate = Decimal::from_rate(borrow_global_rate - self.borrow_rate_index).try_add(Decimal::one())?;
        let borrow_amount = Decimal::from_token_amount(self.amount, borrow_mint_decimals);
        let owed_amount = borrow_amount.try_mul(borrow_rate)?;
        let repayment_fraction;
        
        if repayment_amount > owed_amount {
            // Note: This conditional is to handle the case where the user repays more than the owed amount due the TypeScript rounding errors.
            repayment_amount = owed_amount;
            repayment_fraction = Decimal::one();
        } else {
            repayment_fraction = repayment_amount.try_div(owed_amount)?;
        }

        // Collateral Unlocked Amount
        let collateral_unlocked_amount = Decimal::from_token_amount(self.collateral_amount, deposit_mint_decimals)
        .try_mul(repayment_fraction)?
        .to_token_amount(deposit_mint_decimals)?;

        // Debt Amount
        let debt_amount = repayment_fraction.try_mul(borrow_amount)?;
        let interest_amount = repayment_amount.try_sub(debt_amount)?;

        // Repayment Fee Amount
        let repayment_fee_amount = interest_amount.try_mul(
            Decimal::from_percent(borrow_fee)
        )?;

        // Repayment Reserve Amount
        let repayment_reserve_amount = repayment_amount.try_sub(repayment_fee_amount)?
        .to_token_amount(borrow_mint_decimals)?;

        Ok(RepaymentData {
            collateral_unlocked_amount,
            repayment_reserve_amount,
            repayment_fee_amount: repayment_fee_amount.to_token_amount(borrow_mint_decimals)?,
            debt_amount: debt_amount.to_token_amount(borrow_mint_decimals)?
        })
    }

    /******************************************************************
     *                      ENTRY POINTS                              *      
    ******************************************************************/

    pub fn borrow_sol(
        ctx: Context<BorrowSol>,
        amount: u64,
        borrow_price: u64,
        deposit_price: u64) -> Result<()> {

        // ----------------------------------------------------------------------
        // @ Variables
        // ----------------------------------------------------------------------
        
        // Accounts
        // -----------------------------------------------------------------------------------------------------

        let bank = &ctx.accounts.bank;
        let borrow_asset= &mut ctx.accounts.borrow_asset;
        let deposit_asset = &ctx.accounts.deposit_asset;
        let borrow = &mut ctx.accounts.borrow;
        let deposit = &ctx.accounts.deposit;
        
        // Vaults
        // -----------------------------------------------------------------------------------------------------

        let user_wallet = &ctx.accounts.user_wallet;
        let reserve_vault = &mut ctx.accounts.reserve_vault;
        let collateral_vault = &mut ctx.accounts.collateral_vault;
        let deposit_vault = &mut ctx.accounts.deposit_vault;

        // -----------------------------------------------------------------------------------------------------
        // 0) Init account
        // -----------------------------------------------------------------------------------------------------

        if borrow.version != PROGRAM_VERSION {
            borrow.version = PROGRAM_VERSION;
            borrow.last_update = LastUpdate::new(ctx.accounts.clock.slot);
            borrow.user = ctx.accounts.user_wallet.key();
            borrow.asset = borrow_asset.key();
            borrow.amount = 0;
            borrow.borrow_rate_index = 0;
            borrow.deposit = deposit.key();
            borrow.collateral_amount = 0;
            borrow.liquidating = false;
        }

        // -----------------------------------------------------------------------------------------------------
        // 1) Validations
        // -----------------------------------------------------------------------------------------------------

        // Accounts
        // -----------------------------------------------------------------------------------------------------
        
        require!(bank.available, BankErrorCode::BankUnavailable);
        
        require!(borrow_asset.bank == bank.key(), BankErrorCode::NotOwnedByBank);
        require!(deposit_asset.bank == bank.key(), BankErrorCode::NotOwnedByBank);

        require!(borrow.user == user_wallet.key(), BankErrorCode::Unauthorized);
        require!(borrow.liquidating == false, BankErrorCode::LiquidationInProgress);
        require!(borrow.asset == borrow_asset.key(), BankErrorCode::WrongAssetAddress);

        require!(deposit.user == user_wallet.key(), BankErrorCode::Unauthorized);
        require!(deposit.asset == deposit_asset.key(), BankErrorCode::WrongAssetAddress);

        // Vaults
        // -----------------------------------------------------------------------------------------------------

        require!(**reserve_vault.lamports.borrow() >= amount, BankErrorCode::InsufficientReserve);
        require!(reserve_vault.owner == ctx.program_id, BankErrorCode::NotOwnedByProgram);
        require!(collateral_vault.mint == deposit_asset.representative_mint_pubkey && collateral_vault.owner == bank.key(), BankErrorCode::WrongCollateralVaultAddress);
        require!(deposit_vault.mint == deposit_asset.representative_mint_pubkey && deposit_vault.owner == user_wallet.key(), BankErrorCode::WrongDepositVaultAddress);

        msg!("Validations completed");
        sol_log_compute_units();

        // -----------------------------------------------------------------------------------------------------
        // @ Algorithm
        // -----------------------------------------------------------------------------------------------------

        // 1) Calculate the collateral amount
        // -----------------------------------------------------------------------------------------------------

        let collateral_amount = borrow._calculate_collateral_amount(
            amount, 
            deposit_vault.amount, 
            borrow_asset.mint_decimals, deposit_asset.mint_decimals, 
            borrow_asset.config.open_ltv, deposit_asset.config.borrow_weight, 
            Decimal::from(borrow_price), Decimal::from(deposit_price)
        )?;

        // 2) Transfer Represenative Tokens from deposit vault to collateral vault to block the collateral
        // -----------------------------------------------------------------------------------------------------

        anchor_spl::token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                anchor_spl::token::Transfer {
                    from: deposit_vault.to_account_info(),
                    to: collateral_vault.to_account_info(),
                    authority: user_wallet.to_account_info(),
                },
            ),
            collateral_amount,
        )?;

        msg!("Transferred {} representative tokens from deposit vault to collateral vault", collateral_amount);
        sol_log_compute_units();

        // 3) Transfer SOL from reserve to user wallet
        // -----------------------------------------------------------------------------------------------------

        **reserve_vault.to_account_info().try_borrow_mut_lamports()? -= amount;
        **user_wallet.to_account_info().try_borrow_mut_lamports()? += amount;

        msg!("Transferred {} tokens from reserve vault to user wallet", amount);
        sol_log_compute_units();

        // 4) Update Accounts
        // -----------------------------------------------------------------------------------------------------

        borrow_asset.borrow_amount += amount;
        borrow_asset.update_aprs_and_rates(ctx.accounts.clock.slot);
        borrow_asset.last_update.update_slot(ctx.accounts.clock.slot);

        borrow.borrow_rate_index = calculate_weighted_average_rate_index(borrow.amount, amount, borrow_asset.borrow_global_rate, borrow.borrow_rate_index)?;
        borrow.amount += amount;
        borrow.collateral_amount += collateral_amount;
        borrow.last_update.update_slot(ctx.accounts.clock.slot);
        
        Ok(())

    }

    pub fn repay_sol(ctx: Context<RepaySol>, amount: u64) -> Result<()> {

        // ----------------------------------------------------------------------
        // @ Variables
        // ----------------------------------------------------------------------

        // Accounts
        // -----------------------------------------------------------------------------------------------------

        let bank = &ctx.accounts.bank;
        let borrow_asset= &mut ctx.accounts.borrow_asset;
        let borrow = &mut ctx.accounts.borrow;
        let deposit_asset = &mut ctx.accounts.deposit_asset;
        let deposit = &ctx.accounts.deposit;
        
       	// Vaults
        // -----------------------------------------------------------------------------------------------------

        let user_wallet = &ctx.accounts.user_wallet;
        let reserve_vault = &mut ctx.accounts.reserve_vault;
        let deposit_vault = &mut ctx.accounts.deposit_vault;
        let collateral_vault = &mut ctx.accounts.collateral_vault;
        let fee_vault = &mut ctx.accounts.fee_vault;

        // -----------------------------------------------------------------------------------------------------
        // @ Validations
        // -----------------------------------------------------------------------------------------------------

        // Accounts
        // -----------------------------------------------------------------------------------------------------

        require!(bank.available, BankErrorCode::BankUnavailable);
        
        require!(borrow_asset.bank == bank.key(), BankErrorCode::NotOwnedByBank);
        require!(reserve_vault.owner == ctx.program_id, BankErrorCode::NotOwnedByProgram);
        require!(deposit_asset.bank == bank.key(), BankErrorCode::NotOwnedByBank);

        require!(borrow.user == user_wallet.key(), BankErrorCode::Unauthorized);
        require!(borrow.liquidating == false, BankErrorCode::LiquidationInProgress);
        require!(borrow.asset == borrow_asset.key(), BankErrorCode::WrongAssetAddress);
        
        require!(deposit.user == user_wallet.key(), BankErrorCode::Unauthorized);
        require!(deposit.asset == deposit_asset.key(), BankErrorCode::WrongAssetAddress);

        // Vaults
        // -----------------------------------------------------------------------------------------------------

        require!(fee_vault.key() == bank.fee_vault, BankErrorCode::WrongFeeVaultAddress);

        require!(**user_wallet.lamports.borrow() >= amount, BankErrorCode::InsufficientReserve);

        require!(collateral_vault.mint == deposit_asset.representative_mint_pubkey && collateral_vault.owner == bank.key(), BankErrorCode::WrongCollateralVaultAddress);

        require!(deposit_vault.mint == deposit_asset.representative_mint_pubkey && deposit_vault.owner == user_wallet.key(), BankErrorCode::WrongDepositVaultAddress);

        msg!("Validations completed");
        sol_log_compute_units();

        // -----------------------------------------------------------------------------------------------------
        // @ Algorithm
        // -----------------------------------------------------------------------------------------------------

        // 1) Calculate the repayment data
        // -----------------------------------------------------------------------------------------------------

        let repayment_data = borrow._calculate_repayment_data(
            amount, 
            borrow_asset.mint_decimals, deposit_asset.mint_decimals, 
            borrow_asset.borrow_global_rate, borrow_asset.config.borrow_fee)?;

        // 2) Transfer Represenative Tokens from collateral_vault to deposit_vault
        // -----------------------------------------------------------------------------------------------------

        Bank::execute_transaction(bank, collateral_vault, deposit_vault, &ctx.accounts.token_program, repayment_data.collateral_unlocked_amount)?;

        msg!("Transferred {} representative sol tokens from collateral vault to deposit vault", repayment_data.collateral_unlocked_amount);
        sol_log_compute_units();

        // 3) Transfer SOL from user wallet to reserve wallet
        // -----------------------------------------------------------------------------------------------------

        let transfer_instruction = system_instruction::transfer(
            &user_wallet.key(),
            &reserve_vault.key(),
            repayment_data.repayment_reserve_amount,
        );

        anchor_lang::solana_program::program::invoke(
            &transfer_instruction,
            &[
                user_wallet.to_account_info(),
                reserve_vault.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        msg!("Transferred {} SOL from user wallet to reserve vault", repayment_data.repayment_reserve_amount);
        sol_log_compute_units();

        // -----------------------------------------------------------------------------------------------------
        // 4) Transfer SOL from user wallet to fee vault
        // -----------------------------------------------------------------------------------------------------

        let transfer_instruction = system_instruction::transfer(
            &user_wallet.key(),
            &fee_vault.key(),
            repayment_data.repayment_fee_amount,
        );

        anchor_lang::solana_program::program::invoke(
            &transfer_instruction,
            &[
                user_wallet.to_account_info(),
                fee_vault.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        msg!("Transferred {} SOL from user wallet to fee vault", repayment_data.repayment_fee_amount);
        sol_log_compute_units();

        // -----------------------------------------------------------------------------------------------------
        // 5) Update Accounts
        // -----------------------------------------------------------------------------------------------------

        borrow_asset.borrow_amount -= repayment_data.debt_amount;
        borrow_asset.update_aprs_and_rates(ctx.accounts.clock.slot);
        borrow_asset.last_update.update_slot(ctx.accounts.clock.slot);

        borrow.amount -= repayment_data.debt_amount;
        if borrow.amount == 0 {
            borrow.borrow_rate_index = 0;
        }
        borrow.collateral_amount -= repayment_data.collateral_unlocked_amount;
        borrow.last_update.update_slot(ctx.accounts.clock.slot);

        Ok(())

    }

    pub fn borrow_token(
        ctx: Context<BorrowToken>,
        amount: u64,
        borrow_price: u64,
        deposit_price: u64) -> Result<()> {

        // ----------------------------------------------------------------------
        // @ Variables
        // ----------------------------------------------------------------------
        
        // Accounts
        // -----------------------------------------------------------------------------------------------------

        let bank = &ctx.accounts.bank;
        let borrow_asset= &mut ctx.accounts.borrow_asset;
        let deposit_asset = &ctx.accounts.deposit_asset;
        let borrow = &mut ctx.accounts.borrow;
        let deposit = &ctx.accounts.deposit;
        
       	// Vaults
        // -----------------------------------------------------------------------------------------------------

        let user_wallet = &ctx.accounts.user_wallet;
        let reserve_vault = &mut ctx.accounts.reserve_vault;
        let collateral_vault = &mut ctx.accounts.collateral_vault;
        let deposit_vault = &mut ctx.accounts.deposit_vault;
        let user_token_reserve = &mut ctx.accounts.user_token_reserve;

        // -----------------------------------------------------------------------------------------------------
        // 0) Init account
        // -----------------------------------------------------------------------------------------------------

        if borrow.version != PROGRAM_VERSION {
            borrow.version = PROGRAM_VERSION;
            borrow.last_update = LastUpdate::new(ctx.accounts.clock.slot);
            borrow.user = ctx.accounts.user_wallet.key();
            borrow.asset = borrow_asset.key();
            borrow.amount = 0;
            borrow.borrow_rate_index = 0;
            borrow.deposit = deposit.key();
            borrow.collateral_amount = 0;
            borrow.liquidating = false;
        }

        // -----------------------------------------------------------------------------------------------------
        // @ Validations
        // -----------------------------------------------------------------------------------------------------

        // Arguments
        // -----------------------------------------------------------------------------------------------------
        
        require!(amount > 0, BankErrorCode::InvalidAmount);

        // Accounts
        // -----------------------------------------------------------------------------------------------------

        require!(bank.available, BankErrorCode::BankUnavailable);

        require!(borrow_asset.bank == bank.key(), BankErrorCode::NotOwnedByBank);
        require!(reserve_vault.mint == borrow_asset.mint_pubkey && reserve_vault.owner == bank.key(), BankErrorCode::WrongReserveVaultAddress);
        require!(deposit_asset.bank == bank.key(), BankErrorCode::NotOwnedByBank);

        require!(borrow.user == user_wallet.key(), BankErrorCode::Unauthorized);
        require!(borrow.liquidating == false, BankErrorCode::LiquidationInProgress);
        require!(borrow.asset == borrow_asset.key(), BankErrorCode::WrongAssetAddress);

        require!(deposit.user == user_wallet.key(), BankErrorCode::Unauthorized);
        require!(deposit.asset == deposit_asset.key(), BankErrorCode::WrongAssetAddress);

        // Vaults
        // -----------------------------------------------------------------------------------------------------

        require!(reserve_vault.amount >= amount, BankErrorCode::InsufficientReserve);

        require!(collateral_vault.mint == deposit_asset.representative_mint_pubkey && collateral_vault.owner == bank.key(), BankErrorCode::WrongCollateralVaultAddress);

        require!(user_token_reserve.owner >= user_wallet.key(), BankErrorCode::Unauthorized);

        require!(deposit_vault.mint == deposit_asset.representative_mint_pubkey && deposit_vault.owner == user_wallet.key(), BankErrorCode::WrongDepositVaultAddress);

        msg!("Validations completed");
        sol_log_compute_units();

        // -----------------------------------------------------------------------------------------------------
        // @ Algorithm
        // -----------------------------------------------------------------------------------------------------

        // 1) Calculate the collateral amount
        // -----------------------------------------------------------------------------------------------------

        let collateral_amount = borrow._calculate_collateral_amount(
            amount, 
            deposit_vault.amount, 
            borrow_asset.mint_decimals, deposit_asset.mint_decimals, 
            borrow_asset.config.open_ltv, deposit_asset.config.borrow_weight, 
            Decimal::from(borrow_price), Decimal::from(deposit_price)
        )?;

        // 2) Transfer Represenative Tokens from deposit vault to collateral vault
        // -----------------------------------------------------------------------------------------------------

        anchor_spl::token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                anchor_spl::token::Transfer {
                    from: deposit_vault.to_account_info(),
                    to: collateral_vault.to_account_info(),
                    authority: user_wallet.to_account_info(),
                },
            ),
            collateral_amount,
        )?;

        msg!("Transferred {} representative tokens from deposit vault to collateral vault", collateral_amount);
        sol_log_compute_units();

        // -----------------------------------------------------------------------------------------------------
        // 3) Transfer Token from reserve to user wallet
        // -----------------------------------------------------------------------------------------------------

        Bank::execute_transaction(
            bank,
            reserve_vault,
            user_token_reserve,
            &ctx.accounts.token_program,
            amount
        )?;

        msg!("Transferred {} tokens from reserve vault to user wallet", amount);
        sol_log_compute_units();

        // -----------------------------------------------------------------------------------------------------
        // 4) Update Accounts
        // -----------------------------------------------------------------------------------------------------

        borrow_asset.borrow_amount += amount;
        borrow_asset.update_aprs_and_rates(ctx.accounts.clock.slot);
        borrow_asset.last_update.update_slot(ctx.accounts.clock.slot);

        borrow.borrow_rate_index = calculate_weighted_average_rate_index(borrow.amount, amount, borrow_asset.borrow_global_rate, borrow.borrow_rate_index)?;
        borrow.amount += amount;
        borrow.collateral_amount += collateral_amount;
        borrow.last_update.update_slot(ctx.accounts.clock.slot);
        
        Ok(())

    }

    pub fn repay_token(ctx: Context<RepayToken>, amount: u64) -> Result<()> {

        // ----------------------------------------------------------------------
        // @ Variables
        // ----------------------------------------------------------------------
        
        // Accounts
        // -----------------------------------------------------------------------------------------------------

        let bank = &ctx.accounts.bank;
        let borrow_asset= &mut ctx.accounts.borrow_asset;
        let borrow = &mut ctx.accounts.borrow;
        let deposit_asset = &mut ctx.accounts.deposit_asset;
        let deposit = &ctx.accounts.deposit;
        
	    // Vaults
        // -----------------------------------------------------------------------------------------------------
        
        let user_wallet = &ctx.accounts.user_wallet;
        let reserve_vault = &mut ctx.accounts.reserve_vault;
        let deposit_vault = &mut ctx.accounts.deposit_vault;
        let collateral_vault = &mut ctx.accounts.collateral_vault;
        let fee_vault = &mut ctx.accounts.fee_vault;
        let user_token_reserve = &mut ctx.accounts.user_token_reserve;

        // -----------------------------------------------------------------------------------------------------
        // @ Validations
        // -----------------------------------------------------------------------------------------------------

        // Arguments
        // -----------------------------------------------------------------------------------------------------

        require!(amount > 0, BankErrorCode::InvalidAmount);

        // Accounts
        // -----------------------------------------------------------------------------------------------------

        require!(bank.available, BankErrorCode::BankUnavailable);
        
        require!(borrow_asset.bank == bank.key(), BankErrorCode::NotOwnedByBank);
        require!(reserve_vault.mint == borrow_asset.mint_pubkey && reserve_vault.owner == bank.key(), BankErrorCode::WrongReserveVaultAddress);
        require!(deposit_asset.bank == bank.key(), BankErrorCode::NotOwnedByBank);

        require!(borrow.user == user_wallet.key(), BankErrorCode::Unauthorized);
        require!(borrow.liquidating == false, BankErrorCode::LiquidationInProgress);
        require!(borrow.asset == borrow_asset.key(), BankErrorCode::WrongAssetAddress);
        
        require!(deposit.user == user_wallet.key(), BankErrorCode::Unauthorized);
        require!(deposit.asset == deposit_asset.key(), BankErrorCode::WrongAssetAddress);

        // Vaults
        // -----------------------------------------------------------------------------------------------------

        require!(fee_vault.mint == borrow_asset.mint_pubkey && fee_vault.owner == bank.fee_vault.key(), BankErrorCode::WrongFeeVaultAddress);

        require!(collateral_vault.mint == deposit_asset.representative_mint_pubkey && collateral_vault.owner == bank.key(), BankErrorCode::WrongCollateralVaultAddress);

        require!(deposit_vault.mint == deposit_asset.representative_mint_pubkey && deposit_vault.owner == user_wallet.key(), BankErrorCode::WrongDepositVaultAddress);

        require!(user_token_reserve.amount >= amount, BankErrorCode::InsufficientUserReserve);

        msg!("Validations completed");
        sol_log_compute_units();
        
        // -----------------------------------------------------------------------------------------------------
        // @ Algorithm
        // -----------------------------------------------------------------------------------------------------

        // 1) Calculate the repayment data
        // -----------------------------------------------------------------------------------------------------

        let repayment_data = borrow._calculate_repayment_data(
            amount, 
            borrow_asset.mint_decimals, deposit_asset.mint_decimals, 
            borrow_asset.borrow_global_rate, borrow_asset.config.borrow_fee)?;
        
        
        // 2) Transfer Token from collateral vault to deposit vault
        // -----------------------------------------------------------------------------------------------------

        Bank::execute_transaction(bank, collateral_vault, deposit_vault, &ctx.accounts.token_program, repayment_data.collateral_unlocked_amount)?;

        msg!("Transferred {} representative tokens from collateral vault to deposit vault", repayment_data.collateral_unlocked_amount);
        sol_log_compute_units();

        // 3) Transfer Token from user wallet to reserve wallet
        // -----------------------------------------------------------------------------------------------------

        anchor_spl::token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                anchor_spl::token::Transfer {
                    from: user_token_reserve.to_account_info(),
                    to: reserve_vault.to_account_info(),
                    authority: user_wallet.to_account_info(),
                },
            ),
            repayment_data.repayment_reserve_amount,
        )?;

        msg!("Transferred {} tokens from user wallet to reserve vault", repayment_data.repayment_reserve_amount);
        sol_log_compute_units();

        // -----------------------------------------------------------------------------------------------------
        // 4) Transfer Token from user wallet to fee wallet
        // -----------------------------------------------------------------------------------------------------

        anchor_spl::token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                anchor_spl::token::Transfer {
                    from: user_token_reserve.to_account_info(),
                    to: fee_vault.to_account_info(),
                    authority: user_wallet.to_account_info(),
                },
            ),
            repayment_data.repayment_fee_amount,
        )?;

        msg!("Transferred {} tokens from user wallet to fee vault", repayment_data.repayment_fee_amount);
        sol_log_compute_units();

        // 5) Update Accounts
        // -----------------------------------------------------------------------------------------------------
        
        borrow_asset.borrow_amount -= repayment_data.debt_amount;
        borrow_asset.update_aprs_and_rates(ctx.accounts.clock.slot);
        borrow_asset.last_update.update_slot(ctx.accounts.clock.slot);

        borrow.amount -= repayment_data.debt_amount;
        if borrow.amount == 0 {
            borrow.borrow_rate_index = 0;
        }
        borrow.collateral_amount -= repayment_data.collateral_unlocked_amount;
        borrow.last_update.update_slot(ctx.accounts.clock.slot);

        Ok(())

    }

    pub fn mark_to_liquidate(ctx: Context<MarkToLiquidate>, borrow_price: u64, deposit_price: u64) -> Result<()> {

        // ----------------------------------------------------------------------
        // @ Variables
        // ----------------------------------------------------------------------
        
        // Accounts
        // -----------------------------------------------------------------------------------------------------

        let bank = &ctx.accounts.bank;
        let borrow_asset= &ctx.accounts.borrow_asset;
        let deposit_asset = &ctx.accounts.deposit_asset;
        let borrow = &mut ctx.accounts.borrow;
        let deposit = &ctx.accounts.deposit;
        
        // Vaults
        // -----------------------------------------------------------------------------------------------------

        let liquidator_wallet = &ctx.accounts.liquidator_wallet;

        // -----------------------------------------------------------------------------------------------------
        // @ Validations
        // -----------------------------------------------------------------------------------------------------

        // Accounts
        // -----------------------------------------------------------------------------------------------------
        
        require!(bank.available, BankErrorCode::BankUnavailable);
        require!(bank.liquidator == liquidator_wallet.key(), BankErrorCode::Unauthorized);
        
        require!(borrow_asset.bank == bank.key(), BankErrorCode::NotOwnedByBank);
        require!(deposit_asset.bank == bank.key(), BankErrorCode::NotOwnedByBank);
        
        require!(borrow.liquidating == false, BankErrorCode::LiquidationInProgress);
        require!(borrow.asset == borrow_asset.key(), BankErrorCode::WrongAssetAddress);
        require!(borrow.deposit == deposit.key(), BankErrorCode::WrongDepositAddress);
        
        require!(deposit.asset == deposit_asset.key(), BankErrorCode::WrongAssetAddress);

        // Vaults
        // -----------------------------------------------------------------------------------------------------
        
        require!(bank.liquidator == liquidator_wallet.key(), BankErrorCode::Unauthorized);

        msg!("Validations completed");
        sol_log_compute_units();

        // -----------------------------------------------------------------------------------------------------
        // @ Algorithm
        // -----------------------------------------------------------------------------------------------------

        let is_liquidatable = borrow._is_liquidatable(
            borrow_asset.mint_decimals, deposit_asset.mint_decimals, 
            borrow_asset.config.max_close_ltv, deposit_asset.config.borrow_weight, 
            Decimal::from(borrow_price), Decimal::from(deposit_price)
        )?;

        require!(is_liquidatable, BankErrorCode::NotLiquidatable);

        // 1) Update borrow account
        // -----------------------------------------------------------------------------------------------------

        borrow.liquidating = true;

        msg!("Mark to Liquidate completed");
        sol_log_compute_units();
        
        Ok(())

    }

    pub fn liquidate_sol_auto(ctx: Context<LiquidateSolAuto>, price: u64) -> Result<()> {

        // ----------------------------------------------------------------------
        // @ Variables
        // ----------------------------------------------------------------------

        // Accounts
        // -----------------------------------------------------------------------------------------------------
        let bank = &ctx.accounts.bank;
        let asset= &mut ctx.accounts.asset;
        let borrow = &mut ctx.accounts.borrow;
        let deposit = &mut ctx.accounts.deposit;
        let representative_mint = &ctx.accounts.representative_mint;

        // Vaults
        // -----------------------------------------------------------------------------------------------------
        let liquidator_wallet = &mut ctx.accounts.liquidator_wallet;
        let reserve_vault = &mut ctx.accounts.reserve_vault;
        let collateral_vault =  &mut ctx.accounts.collateral_vault;
        let fee_vault =  &mut ctx.accounts.fee_vault;

        // -----------------------------------------------------------------------------------------------------
        // 1) Validations
        // -----------------------------------------------------------------------------------------------------

        // Accounts
        // -----------------------------------------------------------------------------------------------------
        require!(asset.bank == bank.key(), BankErrorCode::NotOwnedByBank);

        require!(borrow.asset == asset.key(), BankErrorCode::WrongAssetAddress);

        require!(deposit.asset == asset.key(), BankErrorCode::WrongAssetAddress);

        require!(representative_mint.key() == asset.representative_mint_pubkey, BankErrorCode::InvalidMintAddress);

        // Vaults
        // -----------------------------------------------------------------------------------------------------
        require!(liquidator_wallet.key() != bank.liquidator, BankErrorCode::Unauthorized);
        require!(reserve_vault.owner == ctx.program_id, BankErrorCode::NotOwnedByProgram);
        require!(collateral_vault.mint == asset.representative_mint_pubkey && collateral_vault.owner == bank.key(), BankErrorCode::WrongCollateralVaultAddress);
        require!(fee_vault.owner == ctx.program_id, BankErrorCode::NotOwnedByProgram);
        require!(fee_vault.key() == bank.fee_vault, BankErrorCode::WrongFeeVaultAddress);

        msg!("Validations completed");
        sol_log_compute_units();

        // -----------------------------------------------------------------------------------------------------
        // @ Algorithm
        // -----------------------------------------------------------------------------------------------------

        let price = Decimal::from(price);

        // 1) Check if the borrow is liquidatable
        // -----------------------------------------------------------------------------------------------------

        let is_liquidatable = borrow._is_liquidatable(
            asset.mint_decimals, asset.mint_decimals, 
            asset.config.max_close_ltv, asset.config.borrow_weight, 
            price, price
        )?;

        require!(is_liquidatable, BankErrorCode::NotLiquidatable);

        // 2) Calculate the liquidation data
        // -----------------------------------------------------------------------------------------------------

        let liquidation_data = borrow._calculate_liquidation_data(
            asset.mint_decimals,
            asset.mint_decimals,
            asset.config.open_ltv,
            asset.config.borrow_weight,
            asset.config.liquidation_fee,
            price,
            price)?;

        // 3) Burn Collateral Tokens liquidated
        // -----------------------------------------------------------------------------------------------------

        Bank::burn_bank_tokens(bank, collateral_vault, representative_mint, &ctx.accounts.token_program, liquidation_data.collateral_amount)?;

        msg!("Burned {} representative tokens from collateral vault", liquidation_data.collateral_amount);
        sol_log_compute_units();

        // -----------------------------------------------------------------------------------------------------
        // 4) Transfer SOL from reserve vault to fee vault
        // -----------------------------------------------------------------------------------------------------

        **reserve_vault.to_account_info().try_borrow_mut_lamports()? -= liquidation_data.fee_amount;
        **fee_vault.to_account_info().try_borrow_mut_lamports()? += liquidation_data.fee_amount;

        msg!("Transferred {} SOL from reserve vault to fee vault", liquidation_data.fee_amount);
        sol_log_compute_units();

        // -----------------------------------------------------------------------------------------------------
        // 5) Update accounts
        // -----------------------------------------------------------------------------------------------------

        borrow.amount -= liquidation_data.borrow_amount;
        if borrow.amount == 0 {
            borrow.borrow_rate_index = 0;
        }
        borrow.collateral_amount -= liquidation_data.collateral_amount;

        asset.borrow_amount -= liquidation_data.borrow_amount;
        asset.deposit_amount -= liquidation_data.collateral_amount;
        asset.update_aprs_and_rates(ctx.accounts.clock.slot);

        deposit.amount -= liquidation_data.collateral_amount;
        if deposit.amount == 0 {
            deposit.deposit_rate_index = 0;
        }

        msg!("Liquidate SOL auto completed");
        sol_log_compute_units();
        
        Ok(())

    }

    pub fn liquidate_token_auto(ctx: Context<LiquidateTokenAuto>, price: u64) -> Result<()> {

        // ----------------------------------------------------------------------
        // @ Variables
        // ----------------------------------------------------------------------

        // Accounts
        // -----------------------------------------------------------------------------------------------------
        let bank = &ctx.accounts.bank;
        let asset= &mut ctx.accounts.asset;
        let borrow = &mut ctx.accounts.borrow;
        let deposit = &mut ctx.accounts.deposit;
        let representative_mint = &ctx.accounts.representative_mint;

        // Vaults
        // -----------------------------------------------------------------------------------------------------
        let liquidator_wallet = &mut ctx.accounts.liquidator_wallet;
        let reserve_vault = &mut ctx.accounts.reserve_vault;
        let collateral_vault =  &mut ctx.accounts.collateral_vault;
        let fee_vault =  &ctx.accounts.fee_vault;
        let fee_token_reserve_vault = &mut ctx.accounts.fee_token_reserve_vault;

        // -----------------------------------------------------------------------------------------------------
        // 1) Validations
        // -----------------------------------------------------------------------------------------------------

        // Accounts
        // -----------------------------------------------------------------------------------------------------
        require!(asset.bank == bank.key(), BankErrorCode::NotOwnedByBank);

        require!(borrow.asset == asset.key(), BankErrorCode::WrongAssetAddress);

        require!(deposit.asset == asset.key(), BankErrorCode::WrongAssetAddress);

        require!(representative_mint.key() == asset.representative_mint_pubkey, BankErrorCode::InvalidMintAddress);

        // Vaults
        // -----------------------------------------------------------------------------------------------------
        require!(liquidator_wallet.key() != bank.liquidator, BankErrorCode::Unauthorized);
        require!(reserve_vault.mint == asset.mint_pubkey && reserve_vault.owner == bank.key(), BankErrorCode::WrongReserveVaultAddress);
        require!(collateral_vault.mint == asset.representative_mint_pubkey && collateral_vault.owner == bank.key(), BankErrorCode::WrongCollateralVaultAddress);
        require!(fee_vault.owner == ctx.program_id, BankErrorCode::NotOwnedByProgram);
        require!(fee_vault.key() == bank.fee_vault, BankErrorCode::WrongFeeVaultAddress);
        require!(fee_token_reserve_vault.mint == asset.mint_pubkey && fee_token_reserve_vault.owner == fee_vault.key(), BankErrorCode::WrongFeeVaultAddress);

        msg!("Validations completed");
        sol_log_compute_units();

        // -----------------------------------------------------------------------------------------------------
        // @ Algorithm
        // -----------------------------------------------------------------------------------------------------

        let price = Decimal::from(price);

        // 1) Check if the borrow is liquidatable
        // -----------------------------------------------------------------------------------------------------

        let is_liquidatable = borrow._is_liquidatable(
            asset.mint_decimals, asset.mint_decimals, 
            asset.config.max_close_ltv, asset.config.borrow_weight, 
            price, price
        )?;

        require!(is_liquidatable, BankErrorCode::NotLiquidatable);

        // 2) Calculate the liquidation data
        // -----------------------------------------------------------------------------------------------------

        let liquidation_data = borrow._calculate_liquidation_data(
            asset.mint_decimals,
            asset.mint_decimals,
            asset.config.open_ltv,
            asset.config.borrow_weight,
            asset.config.liquidation_fee,
            price,
            price)?;

        // 3) Burn Collateral Tokens liquidated
        // -----------------------------------------------------------------------------------------------------

        Bank::burn_bank_tokens(bank, collateral_vault, representative_mint, &ctx.accounts.token_program, liquidation_data.collateral_amount)?;

        msg!("Burned {} representative tokens from collateral vault", liquidation_data.collateral_amount);
        sol_log_compute_units();

        // -----------------------------------------------------------------------------------------------------
        // 4) Transfer SOL from reserve vault to fee vault
        // -----------------------------------------------------------------------------------------------------

        Bank::execute_transaction(
            bank,
            reserve_vault,
            fee_token_reserve_vault,
            &ctx.accounts.token_program,
            liquidation_data.fee_amount
        )?;

        msg!("Transferred {} token from reserve vault to fee vault", liquidation_data.fee_amount);
        sol_log_compute_units();

        // -----------------------------------------------------------------------------------------------------
        // 5) Update accounts
        // -----------------------------------------------------------------------------------------------------

        borrow.amount -= liquidation_data.borrow_amount;
        if borrow.amount == 0 {
            borrow.borrow_rate_index = 0;
        }
        borrow.collateral_amount -= liquidation_data.collateral_amount;

        asset.borrow_amount -= liquidation_data.borrow_amount;
        asset.deposit_amount -= liquidation_data.collateral_amount;
        asset.update_aprs_and_rates(ctx.accounts.clock.slot);

        deposit.amount -= liquidation_data.collateral_amount;
        if deposit.amount == 0 {
            deposit.deposit_rate_index = 0;
        }

        msg!("Liquidate Token auto completed");
        sol_log_compute_units();

        Ok(())

    }

    pub fn liquidate_sol_token(ctx: Context<LiquidateSolToken>, borrow_price: u64, deposit_price: u64) -> Result<()> {

        // ----------------------------------------------------------------------
        // @ Variables
        // ----------------------------------------------------------------------
        
        // Accounts
        // -----------------------------------------------------------------------------------------------------
        let bank = &ctx.accounts.bank;
        let borrow_asset= &mut ctx.accounts.borrow_asset;
        let deposit_asset = &mut ctx.accounts.deposit_asset;
        let borrow = &mut ctx.accounts.borrow;
        let deposit = &mut ctx.accounts.deposit;
        let representative_mint = &ctx.accounts.representative_mint;
        
        // Vaults
        // -----------------------------------------------------------------------------------------------------
        let user_wallet = &mut ctx.accounts.user_wallet;
        let borrow_reserve_vault = &mut ctx.accounts.borrow_reserve_vault;
        let deposit_reserve_vault = &mut ctx.accounts.deposit_reserve_vault;
        let collateral_vault =  &mut ctx.accounts.collateral_vault;
        let user_token_reserve_vault = &mut ctx.accounts.user_token_reserve_vault;

        // -----------------------------------------------------------------------------------------------------
        // 1) Validations
        // -----------------------------------------------------------------------------------------------------

        // Accounts
        // -----------------------------------------------------------------------------------------------------

        require!(borrow_asset.bank == bank.key(), BankErrorCode::NotOwnedByBank);
        require!(deposit_asset.bank == bank.key(), BankErrorCode::NotOwnedByBank);

        require!(borrow.liquidating, BankErrorCode::NotLiquidatable);
        require!(borrow.asset == borrow_asset.key(), BankErrorCode::WrongAssetAddress);
        require!(borrow.deposit == deposit.key(), BankErrorCode::WrongDepositAddress);
        
        require!(deposit.asset == deposit_asset.key(), BankErrorCode::WrongAssetAddress);

        require!(representative_mint.key() == borrow_asset.representative_mint_pubkey, BankErrorCode::InvalidMintAddress);

        // Vaults
        // -----------------------------------------------------------------------------------------------------
        require!(user_wallet.key() != borrow.user, BankErrorCode::Unauthorized);
        require!(borrow_reserve_vault.owner == ctx.program_id, BankErrorCode::NotOwnedByProgram);
        require!(deposit_reserve_vault.mint == deposit_asset.mint_pubkey && deposit_reserve_vault.owner == bank.key(), BankErrorCode::WrongReserveVaultAddress);
        require!(collateral_vault.mint == deposit_asset.representative_mint_pubkey && collateral_vault.owner == bank.key(), BankErrorCode::WrongCollateralVaultAddress);
        require!(user_token_reserve_vault.mint == deposit_asset.mint_pubkey && user_token_reserve_vault.owner == user_wallet.key(), BankErrorCode::WrongUserTokenReserveVaultAddress);

        msg!("Validations completed");
        sol_log_compute_units();

        // -----------------------------------------------------------------------------------------------------
        // @ Algorithm
        // -----------------------------------------------------------------------------------------------------

        let borrow_price = Decimal::from(borrow_price);
        let deposit_price = Decimal::from(deposit_price);

        // 1) Calculate the liquidation data
        // -----------------------------------------------------------------------------------------------------

        let liquidation_data = borrow._calculate_liquidation_data(
            borrow_asset.mint_decimals,
            deposit_asset.mint_decimals,
            borrow_asset.config.open_ltv,
            deposit_asset.config.borrow_weight,
            borrow_asset.config.liquidation_fee,
            borrow_price,
            deposit_price)?;

        // 2) Burn Collateral Tokens liquidated
        // -----------------------------------------------------------------------------------------------------

        Bank::burn_bank_tokens(bank, collateral_vault, representative_mint, &ctx.accounts.token_program, liquidation_data.collateral_amount)?;

        msg!("Burned {} representative tokens from collateral vault", liquidation_data.collateral_amount);
        sol_log_compute_units();

        // 3) Transfer SOL from user wallet to borrow reserve vault to paid the debt
        // -----------------------------------------------------------------------------------------------------

        let transfer_instruction = system_instruction::transfer(
            &user_wallet.key(),
            &borrow_reserve_vault.key(),
            liquidation_data.borrow_amount,
        );

        anchor_lang::solana_program::program::invoke(
            &transfer_instruction,
            &[
                user_wallet.to_account_info(),
                borrow_reserve_vault.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        msg!("Transferred {} SOL from user wallet to borrow reserve vault", liquidation_data.borrow_amount);
        sol_log_compute_units();

        // 4) Transfer Token from deposit reserve vault to user token reserve vault to pay the swap
        // -----------------------------------------------------------------------------------------------------

        Bank::execute_transaction(
            bank,
            deposit_reserve_vault,
            user_token_reserve_vault,
            &ctx.accounts.token_program,
            liquidation_data.collateral_amount
        )?;

        msg!("Transferred {} token from deposit reserve vault to user token reserve vault", liquidation_data.collateral_amount);
        sol_log_compute_units();

        // -----------------------------------------------------------------------------------------------------
        // 5) Update accounts
        // -----------------------------------------------------------------------------------------------------

        borrow.liquidating = false;
        borrow.amount -= liquidation_data.borrow_amount;
        if borrow.amount == 0 {
            borrow.borrow_rate_index = 0;
        }
        borrow.collateral_amount -= liquidation_data.collateral_amount;

        borrow_asset.borrow_amount -= liquidation_data.borrow_amount;
        borrow_asset.deposit_amount -= liquidation_data.collateral_amount;
        borrow_asset.update_aprs_and_rates(ctx.accounts.clock.slot);

        deposit.amount -= liquidation_data.collateral_amount;
        if deposit.amount == 0 {
            deposit.deposit_rate_index = 0;
        }

        msg!("Liquidate SOL token completed");
        sol_log_compute_units();
        
        Ok(())

    }

    pub fn liquidate_token_sol(ctx: Context<LiquidateTokenSol>, borrow_price: u64, deposit_price: u64) -> Result<()> {

        // ----------------------------------------------------------------------
        // @ Variables
        // ----------------------------------------------------------------------
        
        // Accounts
        // -----------------------------------------------------------------------------------------------------
        let bank = &ctx.accounts.bank;
        let borrow_asset= &mut ctx.accounts.borrow_asset;
        let deposit_asset = &mut ctx.accounts.deposit_asset;
        let borrow = &mut ctx.accounts.borrow;
        let deposit = &mut ctx.accounts.deposit;
        let representative_mint = &ctx.accounts.representative_mint;
        
        // Vaults
        // -----------------------------------------------------------------------------------------------------
        let user_wallet = &mut ctx.accounts.user_wallet;
        let borrow_reserve_vault = &mut ctx.accounts.borrow_reserve_vault;
        let deposit_reserve_vault = &mut ctx.accounts.deposit_reserve_vault;
        let collateral_vault =  &mut ctx.accounts.collateral_vault;
        let user_token_reserve_vault = &mut ctx.accounts.user_token_reserve_vault;

        // -----------------------------------------------------------------------------------------------------
        // 1) Validations
        // -----------------------------------------------------------------------------------------------------

        // Accounts
        // -----------------------------------------------------------------------------------------------------

        require!(borrow_asset.bank == bank.key(), BankErrorCode::NotOwnedByBank);
        require!(deposit_asset.bank == bank.key(), BankErrorCode::NotOwnedByBank);

        require!(borrow.liquidating, BankErrorCode::NotLiquidatable);
        require!(borrow.asset == borrow_asset.key(), BankErrorCode::WrongAssetAddress);
        require!(borrow.deposit == deposit.key(), BankErrorCode::WrongDepositAddress);
        
        require!(deposit.asset == deposit_asset.key(), BankErrorCode::WrongAssetAddress);

        require!(representative_mint.key() == borrow_asset.representative_mint_pubkey, BankErrorCode::InvalidMintAddress);

        // Vaults
        // -----------------------------------------------------------------------------------------------------
        require!(user_wallet.key() != borrow.user, BankErrorCode::Unauthorized);
        require!(borrow_reserve_vault.mint == borrow_asset.mint_pubkey && borrow_reserve_vault.owner == bank.key(), BankErrorCode::WrongReserveVaultAddress);
        require!(deposit_reserve_vault.owner == ctx.program_id, BankErrorCode::NotOwnedByProgram);
        require!(collateral_vault.mint == deposit_asset.representative_mint_pubkey && collateral_vault.owner == bank.key(), BankErrorCode::WrongCollateralVaultAddress);
        require!(user_token_reserve_vault.mint == deposit_asset.mint_pubkey && user_token_reserve_vault.owner == user_wallet.key(), BankErrorCode::WrongUserTokenReserveVaultAddress);

        msg!("Validations completed");
        sol_log_compute_units();

        // -----------------------------------------------------------------------------------------------------
        // @ Algorithm
        // -----------------------------------------------------------------------------------------------------

        let borrow_price = Decimal::from(borrow_price);
        let deposit_price = Decimal::from(deposit_price);

        // 1) Calculate the liquidation data
        // -----------------------------------------------------------------------------------------------------

        let liquidation_data = borrow._calculate_liquidation_data(
            borrow_asset.mint_decimals,
            deposit_asset.mint_decimals,
            borrow_asset.config.open_ltv,
            deposit_asset.config.borrow_weight,
            borrow_asset.config.liquidation_fee,
            borrow_price,
            deposit_price)?;

        // 2) Burn Collateral Tokens liquidated
        // -----------------------------------------------------------------------------------------------------

        Bank::burn_bank_tokens(bank, collateral_vault, representative_mint, &ctx.accounts.token_program, liquidation_data.collateral_amount)?;

        msg!("Burned {} representative tokens from collateral vault", liquidation_data.collateral_amount);
        sol_log_compute_units();

        // 3) Transfer Token from user token reserve to borrow reserve vault to paid the debt
        // -----------------------------------------------------------------------------------------------------

        anchor_spl::token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                anchor_spl::token::Transfer {
                    from: user_token_reserve_vault.to_account_info(),
                    to: borrow_reserve_vault.to_account_info(),
                    authority: user_wallet.to_account_info(),
                },
            ),
            liquidation_data.borrow_amount,
        )?;

        msg!("Transferred {} token from user token reserve vault to borrow reserve vault", liquidation_data.borrow_amount);
        sol_log_compute_units();

        // 4) Transfer SOL from deposit reserve vault to user wallet to pay the swap
        // -----------------------------------------------------------------------------------------------------
        
        **deposit_reserve_vault.to_account_info().try_borrow_mut_lamports()? -= liquidation_data.collateral_amount;
        **user_wallet.to_account_info().try_borrow_mut_lamports()? += liquidation_data.collateral_amount;

        msg!("Transferred {} SOL from deposit reserve vault to user wallet", liquidation_data.collateral_amount);
        sol_log_compute_units();

        // -----------------------------------------------------------------------------------------------------
        // 5) Update accounts
        // -----------------------------------------------------------------------------------------------------

        borrow.liquidating = false;
        borrow.amount -= liquidation_data.borrow_amount;
        if borrow.amount == 0 {
            borrow.borrow_rate_index = 0;
        }
        borrow.collateral_amount -= liquidation_data.collateral_amount;

        borrow_asset.borrow_amount -= liquidation_data.borrow_amount;
        borrow_asset.deposit_amount -= liquidation_data.collateral_amount;
        borrow_asset.update_aprs_and_rates(ctx.accounts.clock.slot);

        deposit.amount -= liquidation_data.collateral_amount;
        if deposit.amount == 0 {
            deposit.deposit_rate_index = 0;
        }

        msg!("Liquidate SOL token completed");
        sol_log_compute_units();
        
        Ok(())

    }

    pub fn liquidate_token_token(ctx: Context<LiquidateTokenToken>, borrow_price: u64, deposit_price: u64) -> Result<()> {

        // ----------------------------------------------------------------------
        // @ Variables
        // ----------------------------------------------------------------------
        
        // Accounts
        // -----------------------------------------------------------------------------------------------------
        let bank = &ctx.accounts.bank;
        let borrow_asset= &mut ctx.accounts.borrow_asset;
        let deposit_asset = &mut ctx.accounts.deposit_asset;
        let borrow = &mut ctx.accounts.borrow;
        let deposit = &mut ctx.accounts.deposit;
        let representative_mint = &ctx.accounts.representative_mint;
        
        // Vaults
        // -----------------------------------------------------------------------------------------------------
        let user_wallet = &mut ctx.accounts.user_wallet;
        let borrow_reserve_vault = &mut ctx.accounts.borrow_reserve_vault;
        let deposit_reserve_vault = &mut ctx.accounts.deposit_reserve_vault;
        let collateral_vault =  &mut ctx.accounts.collateral_vault;
        let user_token_reserve_vault = &mut ctx.accounts.user_token_reserve_vault;

        // -----------------------------------------------------------------------------------------------------
        // 1) Validations
        // -----------------------------------------------------------------------------------------------------

        // Accounts
        // -----------------------------------------------------------------------------------------------------

        require!(borrow_asset.bank == bank.key(), BankErrorCode::NotOwnedByBank);
        require!(deposit_asset.bank == bank.key(), BankErrorCode::NotOwnedByBank);

        require!(borrow.liquidating, BankErrorCode::NotLiquidatable);
        require!(borrow.asset == borrow_asset.key(), BankErrorCode::WrongAssetAddress);
        require!(borrow.deposit == deposit.key(), BankErrorCode::WrongDepositAddress);
        
        require!(deposit.asset == deposit_asset.key(), BankErrorCode::WrongAssetAddress);

        require!(representative_mint.key() == borrow_asset.representative_mint_pubkey, BankErrorCode::InvalidMintAddress);

        // Vaults
        // -----------------------------------------------------------------------------------------------------
        require!(user_wallet.key() != borrow.user, BankErrorCode::Unauthorized);
        require!(borrow_reserve_vault.mint == borrow_asset.mint_pubkey && borrow_reserve_vault.owner == bank.key(), BankErrorCode::WrongReserveVaultAddress);
        require!(deposit_reserve_vault.mint == deposit_asset.mint_pubkey && deposit_reserve_vault.owner == bank.key(), BankErrorCode::WrongReserveVaultAddress);
        require!(collateral_vault.mint == deposit_asset.representative_mint_pubkey && collateral_vault.owner == bank.key(), BankErrorCode::WrongCollateralVaultAddress);
        require!(user_token_reserve_vault.mint == deposit_asset.mint_pubkey && user_token_reserve_vault.owner == user_wallet.key(), BankErrorCode::WrongUserTokenReserveVaultAddress);

        msg!("Validations completed");
        sol_log_compute_units();

        // -----------------------------------------------------------------------------------------------------
        // @ Algorithm
        // -----------------------------------------------------------------------------------------------------

        let borrow_price = Decimal::from(borrow_price);
        let deposit_price = Decimal::from(deposit_price);

        // 1) Calculate the liquidation data
        // -----------------------------------------------------------------------------------------------------

        let liquidation_data = borrow._calculate_liquidation_data(
            borrow_asset.mint_decimals,
            deposit_asset.mint_decimals,
            borrow_asset.config.open_ltv,
            deposit_asset.config.borrow_weight,
            borrow_asset.config.liquidation_fee,
            borrow_price,
            deposit_price)?;

        // 2) Burn Collateral Tokens liquidated
        // -----------------------------------------------------------------------------------------------------

        Bank::burn_bank_tokens(bank, collateral_vault, representative_mint, &ctx.accounts.token_program, liquidation_data.collateral_amount)?;

        msg!("Burned {} representative tokens from collateral vault", liquidation_data.collateral_amount);
        sol_log_compute_units();

        // 3) Transfer Token from user token reserve to borrow reserve vault to paid the debt
        // -----------------------------------------------------------------------------------------------------

        anchor_spl::token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                anchor_spl::token::Transfer {
                    from: user_token_reserve_vault.to_account_info(),
                    to: borrow_reserve_vault.to_account_info(),
                    authority: user_wallet.to_account_info(),
                },
            ),
            liquidation_data.borrow_amount,
        )?;

        msg!("Transferred {} token from user token reserve vault to borrow reserve vault", liquidation_data.borrow_amount);
        sol_log_compute_units();

        // 4) Transfer SOL from deposit reserve vault to user wallet to pay the swap
        // -----------------------------------------------------------------------------------------------------
        
        Bank::execute_transaction(
            bank,
            deposit_reserve_vault,
            user_token_reserve_vault,
            &ctx.accounts.token_program,
            liquidation_data.collateral_amount
        )?;

        msg!("Transferred {} SOL from deposit reserve vault to user wallet", liquidation_data.collateral_amount);
        sol_log_compute_units();

        // -----------------------------------------------------------------------------------------------------
        // 5) Update accounts
        // -----------------------------------------------------------------------------------------------------

        borrow.liquidating = false;
        borrow.amount -= liquidation_data.borrow_amount;
        if borrow.amount == 0 {
            borrow.borrow_rate_index = 0;
        }
        borrow.collateral_amount -= liquidation_data.collateral_amount;

        borrow_asset.borrow_amount -= liquidation_data.borrow_amount;
        borrow_asset.deposit_amount -= liquidation_data.collateral_amount;
        borrow_asset.update_aprs_and_rates(ctx.accounts.clock.slot);

        deposit.amount -= liquidation_data.collateral_amount;
        if deposit.amount == 0 {
            deposit.deposit_rate_index = 0;
        }

        msg!("Liquidate SOL token completed");
        sol_log_compute_units();
        
        Ok(())

    }

}

#[derive(Accounts)]
pub struct BorrowSol<'info> {
    #[account(mut)]
    pub user_wallet: Signer<'info>,
    #[account()]
    pub bank: Account<'info, Bank>,
    #[account(mut)]
    pub borrow_asset: Account<'info, Asset>,
    #[account()]
    pub deposit_asset: Account<'info, Asset>,
    #[account(
        init_if_needed,
        payer = user_wallet,
        space = Borrow::LEN,
        seeds = [b"borrow", borrow_asset.key().as_ref(), deposit_asset.key().as_ref(), user_wallet.key.as_ref()],
        bump
    )]
    pub borrow: Account<'info, Borrow>,
    #[account()]
    pub deposit: Account<'info, Deposit>,
    /// CHECK: The `reserve_vault` is a `SystemAccount` that is the reserve wallet of the SOL asset.
    #[account(mut, seeds = [b"reserve", bank.key().as_ref()], bump)]
    pub reserve_vault: AccountInfo<'info>,
    #[account(mut)]
    pub collateral_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub deposit_vault: Account<'info, TokenAccount>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub clock: Sysvar<'info, Clock>
}

#[derive(Accounts)]
pub struct RepaySol<'info> {
    #[account(mut)]
    pub user_wallet: Signer<'info>,
    #[account()]
    pub bank: Account<'info, Bank>,
    #[account(mut)]
    pub borrow_asset: Account<'info, Asset>,
    #[account()]
    pub deposit_asset: Account<'info, Asset>,
    #[account(mut)]
    pub borrow: Account<'info, Borrow>,
    #[account()]
    pub deposit: Account<'info, Deposit>,
    /// CHECK: The `reserve_vault` is a `SystemAccount` that is the reserve wallet of the SOL asset.
    #[account(mut, seeds = [b"reserve", bank.key().as_ref()], bump)]
    pub reserve_vault: AccountInfo<'info>,
    #[account(mut)]
    pub collateral_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub deposit_vault: Account<'info, TokenAccount>,
    /// CHECK: The `fee_vault` is a `SystemAccount` that is the reserve wallet of the SOL asset.
    #[account(mut)]
    pub fee_vault: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub clock: Sysvar<'info, Clock>
}


#[derive(Accounts)]
pub struct BorrowToken<'info> {
    #[account(mut)]
    pub user_wallet: Signer<'info>,
    #[account()]
    pub bank: Account<'info, Bank>,
    #[account(mut)]
    pub borrow_asset: Account<'info, Asset>,
    #[account()]
    pub deposit_asset: Account<'info, Asset>,
    #[account(
        init_if_needed,
        payer = user_wallet,
        space = Borrow::LEN,
        seeds = [b"borrow", borrow_asset.key().as_ref(), deposit_asset.key().as_ref(), user_wallet.key.as_ref()],
        bump
    )]
    pub borrow: Account<'info, Borrow>,
    #[account()]
    pub deposit: Account<'info, Deposit>,
    #[account(mut)]
    pub reserve_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub collateral_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub deposit_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_token_reserve: Account<'info, TokenAccount>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub clock: Sysvar<'info, Clock>
}

#[derive(Accounts)]
pub struct RepayToken<'info> {
    #[account(mut)]
    pub user_wallet: Signer<'info>,
    #[account()]
    pub bank: Account<'info, Bank>,
    #[account(mut)]
    pub borrow_asset: Account<'info, Asset>,
    #[account()]
    pub deposit_asset: Account<'info, Asset>,
    #[account(mut)]
    pub borrow: Account<'info, Borrow>,
    #[account()]
    pub deposit: Account<'info, Deposit>,
    #[account(mut)]
    pub reserve_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub collateral_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub deposit_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_token_reserve: Account<'info, TokenAccount>,
    #[account(mut)]
    pub fee_vault: Account<'info, TokenAccount>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub clock: Sysvar<'info, Clock>
}

#[derive(Accounts)]
pub struct MarkToLiquidate<'info> {
    #[account()]
    pub liquidator_wallet: Signer<'info>,
    #[account()]
    pub bank: Account<'info, Bank>,
    #[account()]
    pub borrow_asset: Account<'info, Asset>,
    #[account()]
    pub deposit_asset: Account<'info, Asset>,
    #[account(mut)]
    pub borrow: Account<'info, Borrow>,
    #[account()]
    pub deposit: Account<'info, Deposit>,
    pub system_program: Program<'info, System>
}

#[derive(Accounts)]
pub struct LiquidateSolAuto<'info> {
    #[account(mut)]
    pub liquidator_wallet: Signer<'info>,
    #[account()]
    pub representative_mint: Account<'info, Mint>,
    #[account()]
    pub bank: Account<'info, Bank>,
    #[account(mut)]
    pub asset: Account<'info, Asset>,
    #[account(mut)]
    pub borrow: Account<'info, Borrow>,
    #[account(mut)]
    pub deposit: Account<'info, Deposit>,
    /// CHECK: The `reserve_vault` is a `SystemAccount` that is the reserve wallet of SOL asset.
    #[account(mut, seeds = [b"reserve", bank.key().as_ref()], bump)]
    pub reserve_vault: AccountInfo<'info>,
    #[account(mut)]
    pub collateral_vault: Account<'info, TokenAccount>,
    /// CHECK: The `fee_vault` is a `SystemAccount` that is the fee wallet of the SOL asset.
    #[account(mut)]
    pub fee_vault: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub clock: Sysvar<'info, Clock>
}

#[derive(Accounts)]
pub struct LiquidateTokenAuto<'info> {
    #[account(mut)]
    pub liquidator_wallet: Signer<'info>,
    #[account()]
    pub representative_mint: Account<'info, Mint>,
    #[account()]
    pub bank: Account<'info, Bank>,
    #[account(mut)]
    pub asset: Account<'info, Asset>,
    #[account(mut)]
    pub borrow: Account<'info, Borrow>,
    #[account(mut)]
    pub deposit: Account<'info, Deposit>,
    #[account(mut)]
    pub reserve_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub collateral_vault: Account<'info, TokenAccount>,
    /// CHECK: The `fee_vault` is a `SystemAccount` that is the fee wallet of the SOL asset.
    #[account()]
    pub fee_vault: AccountInfo<'info>,
    #[account(mut)]
    pub fee_token_reserve_vault: Account<'info, TokenAccount>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub clock: Sysvar<'info, Clock>
}

#[derive(Accounts)]
pub struct LiquidateSolToken<'info> {
    #[account(mut)]
    pub user_wallet: Signer<'info>,
    #[account()]
    pub representative_mint: Account<'info, Mint>,
    #[account()]
    pub bank: Account<'info, Bank>,
    #[account(mut)]
    pub borrow_asset: Account<'info, Asset>,
    #[account(mut)]
    pub deposit_asset: Account<'info, Asset>,
    #[account(mut)]
    pub borrow: Account<'info, Borrow>,
    #[account(mut)]
    pub deposit: Account<'info, Deposit>,
    /// CHECK: The `borrow_reserve_vault` is a `SystemAccount` that is the reserve wallet of the SOL asset borrowed and SOL asset deposited.
    #[account(mut, seeds = [b"reserve", bank.key().as_ref()], bump)]
    pub borrow_reserve_vault: AccountInfo<'info>,
    #[account(mut)]
    pub deposit_reserve_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub collateral_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_token_reserve_vault: Account<'info, TokenAccount>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub clock: Sysvar<'info, Clock>
}

#[derive(Accounts)]
pub struct LiquidateTokenSol<'info> {
    #[account(mut)]
    pub user_wallet: Signer<'info>,
    #[account()]
    pub representative_mint: Account<'info, Mint>,
    #[account()]
    pub bank: Account<'info, Bank>,
    #[account(mut)]
    pub borrow_asset: Account<'info, Asset>,
    #[account(mut)]
    pub deposit_asset: Account<'info, Asset>,
    #[account(mut)]
    pub borrow: Account<'info, Borrow>,
    #[account(mut)]
    pub deposit: Account<'info, Deposit>,
    #[account(mut)]
    pub borrow_reserve_vault: Account<'info, TokenAccount>,
    /// CHECK: The `deposit_reserve_vault` is a `SystemAccount` that is the reserve wallet of the SOL asset borrowed and SOL asset deposited.
    #[account(mut, seeds = [b"reserve", bank.key().as_ref()], bump)]
    pub deposit_reserve_vault: AccountInfo<'info>,
    #[account(mut)]
    pub collateral_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_token_reserve_vault: Account<'info, TokenAccount>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub clock: Sysvar<'info, Clock>
}

#[derive(Accounts)]
pub struct LiquidateTokenToken<'info> {
    #[account(mut)]
    pub user_wallet: Signer<'info>,
    #[account()]
    pub representative_mint: Account<'info, Mint>,
    #[account()]
    pub bank: Account<'info, Bank>,
    #[account(mut)]
    pub borrow_asset: Account<'info, Asset>,
    #[account(mut)]
    pub deposit_asset: Account<'info, Asset>,
    #[account(mut)]
    pub borrow: Account<'info, Borrow>,
    #[account(mut)]
    pub deposit: Account<'info, Deposit>,
    #[account(mut)]
    pub borrow_reserve_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub deposit_reserve_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub collateral_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_token_reserve_vault: Account<'info, TokenAccount>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub clock: Sysvar<'info, Clock>
}

#[cfg(test)]
mod test {

    use anchor_lang::{
        prelude::msg,
        solana_program::pubkey::Pubkey
    };

    use crate::{Decimal, TryAdd, TryDiv, TryMul, TrySub};

    use super::{Borrow, LastUpdate};

    #[test]
    fn calculate_collateral_amount_to_liquidate_test() {
        // Arrange
        let borrow_amount = 600_000_000u64; // 600 USDC
        let collateral_amount = 5_000_000_000u64; // 5 SOL
        let liquidation_fee = 500u16; // 5%
        let open_ltv = 7_500u16; // 75%
        let borrow_weight = 8_000u16; // 80%
        let borrow_asset_price_d = Decimal::from(1u64); // 1 USDC
        let collateral_asset_price_d = Decimal::from(180u64); // 180 USDC

        /*
               Ac*bw*ltv - (Ab*Pb/Pc)      A * B - C       x
        A'c = ------------------------- = ------------ = ------
                 bw*ltv - 1 + lf             B - D         y      
        */

        // Act
        let a = Decimal::from_token_amount(collateral_amount, 9u8);
        let b = Decimal::from_percent(open_ltv).try_mul(Decimal::from_percent(borrow_weight)).unwrap();
        let c = Decimal::from_token_amount(borrow_amount, 6u8).try_mul(borrow_asset_price_d).unwrap().try_div(collateral_asset_price_d).unwrap();
        let d = Decimal::one().try_add(Decimal::from_percent(liquidation_fee)).unwrap();

        let a_b = a.try_mul(b).unwrap();

        let x;
        if a_b >= c {
            x = a_b.try_sub(c).unwrap();
        } else {
            x = c.try_sub(a_b).unwrap();
        }

        let y;
        if b >= d {
            y = b.try_sub(d).unwrap();
        } else {
            y = d.try_sub(b).unwrap();
        }

        msg!("x: {:?}", x.try_div(y).unwrap().to_token_amount(9u8).unwrap());
    }

    #[test]
    fn calculate_collateral_amount_test() {

        // Arrange
        let borrow = Borrow {
            version: 1,
            last_update: LastUpdate {
                slot: 100, 
                stale: false
            },
            user: Pubkey::new_unique(),
            asset: Pubkey::new_unique(),
            amount: 257000000u64,
            borrow_rate_index: 1000001009904751u64,
            deposit: Pubkey::new_unique(),
            collateral_amount: 3416076828u64,
            liquidating: false,
        };
        let borrow_amount = 18000000u64;
        let unlocked_deposit_amount = 152583923172u64;
        let borrow_mint_decimals = 6u8;
        let deposit_mint_decimals = 9u8;
        let borrow_price = Decimal::from(1u64);
        let deposit_price = Decimal::from(179u64);
        let open_ltv = 7_500u16;
        let bw = 10_000u16;

        // Act
        let collateral_amount = borrow._calculate_collateral_amount(borrow_amount, unlocked_deposit_amount, 
            borrow_mint_decimals, deposit_mint_decimals, open_ltv, bw, 
            borrow_price, deposit_price).unwrap();
        
        // Assert
        assert_eq!(collateral_amount, 134078212u64);
    }
    
    #[test]
    fn calculate_repayment_data_test() {

        // Arrange
        let borrow = Borrow {
            version: 1,
            last_update: LastUpdate {
                slot: 100, 
                stale: false
            },
            user: Pubkey::new_unique(),
            asset: Pubkey::new_unique(),
            amount: 800_000_000u64,
            borrow_rate_index: 0,
            deposit: Pubkey::new_unique(),
            collateral_amount: 10_000_000_000u64,
            liquidating: false,
        };
        let repayment_amount = 1_000_000_000u64;
        let borrow_global_rate = 250_000_000_000_000u64;
        let borrow_mint_decimals = 6u8;
        let deposit_mint_decimals = 9u8;
        let borrow_fee = 500u16;

        // Act
        let repayment_data = borrow._calculate_repayment_data(repayment_amount, borrow_mint_decimals, deposit_mint_decimals, borrow_global_rate, borrow_fee).unwrap();
        
        // Assert
        assert_eq!(repayment_data.debt_amount, 800_000_000u64);
        assert_eq!(repayment_data.collateral_unlocked_amount, 10_000_000_000u64);
        assert_eq!(repayment_data.repayment_reserve_amount, 990_000_000u64);
        assert_eq!(repayment_data.repayment_fee_amount, 10_000_000u64);
    }

}