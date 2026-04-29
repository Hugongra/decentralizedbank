use {
    super::*,
    crate::{
        errors::BankErrorCode, 
        states::{
            asset::Asset, bank::Bank
        },
        math::Decimal, TryMul, TryAdd, TryDiv
    }, anchor_lang::{
        prelude::*, 
        solana_program::{
            log::sol_log_compute_units,
            pubkey::Pubkey,
            system_instruction
        }
    }, anchor_spl::{
        associated_token::AssociatedToken,
        token::{Mint, Token, TokenAccount}
    }
};


#[account]
#[derive(Debug, Default, PartialEq)]
/*
When a user makes a deposit, the Deposit state is initialized with the amount field set to the value of tokens deposited, 
representing the user's interest-bearing deposit amount. At the same time, an equivalent amount of tokens is minted into 
the deposit_vault, which serves as the representative token account for the user's deposit. Additionally, 
the deposit_rate_index is set to the current value of global_deposit_rate at the time of the deposit. During a withdrawal, 
the deposit_vault is burned, and the user receives an equivalent amount of tokens corresponding to their initial deposit. 
The deposit_rate_index is then updated to match the current global_deposit_rate. 

It is important to note that the amount field is used exclusively to record the value of the deposit for bookkeeping purposes,
while all operations (such as deposits, withdrawals, and interest calculations) rely on the actual deposit amount stored in 
the deposit_vault.
*/
pub struct Deposit {
    pub version: u8,
    pub last_update: LastUpdate,
    pub user: Pubkey,
    pub asset: Pubkey,
    /// Deposit amount
    pub amount: u64,
    /// Index of the deposit rate
    pub deposit_rate_index: u64
}

impl Deposit {
    pub const LEN: usize = 
    8 +
    1 +
    LastUpdate::LEN +
    32 +
    32 +
    32 +
    16 +
    8;
    
    /******************************************************************
     *                      UTILITY METHODS                           *      
    ******************************************************************/

    pub fn _calculate_withdraw_amount_to_burn(
        &self,
        whithdraw_amount: u64,
        deposit_vault_amount: u64,
        deposit_global_rate: u64,
        deposit_mint_decimals: u8) -> Result<u64> {
        
        require!(deposit_global_rate >= self.deposit_rate_index, BankErrorCode::InvalidRateIndex);
        
        // Calculate the deposit rate
        let deposit_rate = Decimal::from_rate(deposit_global_rate - self.deposit_rate_index).try_add(Decimal::one()).unwrap();

        // Calculate max withdraw amount
        let max_withdraw_amount = Decimal::from_token_amount(deposit_vault_amount, deposit_mint_decimals)
        .try_mul(deposit_rate).unwrap()
        .to_token_amount(deposit_mint_decimals).unwrap();

        require!(max_withdraw_amount >= whithdraw_amount, BankErrorCode::InsufficientUserDeposit);
        
        // Is the amount of tokens to withdraw in representative tokens
        let withdraw_amount_to_burn = Decimal::from_token_amount(whithdraw_amount, deposit_mint_decimals)
        .try_div(deposit_rate).unwrap()
        .to_token_amount(deposit_mint_decimals).unwrap();

        Ok(withdraw_amount_to_burn)
    }

    /******************************************************************
     *                      ENTRY POINTS                              *      
    ******************************************************************/

    pub fn create_deposit(ctx: Context<CreateDeposit>) -> Result<()> {

        // -----------------------------------------------------------------------------------------------------
        // @ Variables
        // -----------------------------------------------------------------------------------------------------

        let bank = &ctx.accounts.bank;
        let asset= &ctx.accounts.asset;
        let deposit = &mut ctx.accounts.deposit;
        let representative_mint = &ctx.accounts.representative_mint;

        // -----------------------------------------------------------------------------------------------------
        // @ Validations
        // ------------------------------------------------------------------------------------------------------

        require!(asset.bank == bank.key(), BankErrorCode::NotOwnedByBank);
        require!(asset.representative_mint_pubkey == representative_mint.key(), BankErrorCode::InvalidMintAddress);

        msg!("Validations completed");
        sol_log_compute_units();

        // -----------------------------------------------------------------------------------------------------
        // @ Algorithm
        // -----------------------------------------------------------------------------------------------------

        deposit.version = PROGRAM_VERSION;
        deposit.last_update = LastUpdate::new(ctx.accounts.clock.slot);
        deposit.user = ctx.accounts.user_wallet.key();
        deposit.asset = asset.key();
        deposit.amount = 0;
        deposit.deposit_rate_index = 0;

        msg!("Deposit account created");
        sol_log_compute_units();
        
        Ok(())

    }

    pub fn deposit_sol(ctx: Context<SolDepositAccounts>, amount: u64) -> Result<()> {

        // -----------------------------------------------------------------------------------------------------
        // @ Variables
        // -----------------------------------------------------------------------------------------------------
        
        // Accounts
        // -----------------------------------------------------------------------------------------------------

        let bank = &ctx.accounts.bank;
        let asset= &mut ctx.accounts.asset;
        let deposit = &mut ctx.accounts.deposit;
        let representative_mint = &mut ctx.accounts.representative_mint;
        
        // Vaults
        // -----------------------------------------------------------------------------------------------------

        let reserve_vault = &ctx.accounts.reserve_vault;
        let user_wallet = &ctx.accounts.user_wallet;
        let deposit_vault = &mut ctx.accounts.deposit_vault;
        
        // -----------------------------------------------------------------------------------------------------
        // @ Validations
        // -----------------------------------------------------------------------------------------------------

        // Arguments
        // -----------------------------------------------------------------------------------------------------
        
        require!(amount > 0, BankErrorCode::InvalidAmount);

        // Accounts
        // -----------------------------------------------------------------------------------------------------  
        
        require!(bank.available, BankErrorCode::BankUnavailable);
        
        require!(asset.bank == bank.key(), BankErrorCode::NotOwnedByBank);
        
        require!(reserve_vault.owner == ctx.program_id, BankErrorCode::NotOwnedByProgram);
        
        require!(deposit.user == user_wallet.key(), BankErrorCode::Unauthorized);
        require!(deposit.asset == asset.key(), BankErrorCode::WrongAssetAddress);

        // Vaults
        // -----------------------------------------------------------------------------------------------------

        require!(**user_wallet.to_account_info().lamports.borrow() >= amount, BankErrorCode::InsufficientUserReserve);

        msg!("Validations completed");
        sol_log_compute_units();

        // -----------------------------------------------------------------------------------------------------
        // @ Algorithm
        // -----------------------------------------------------------------------------------------------------

        // 1) Transfer SOL from user wallet to reserve vault
        // -----------------------------------------------------------------------------------------------------

        let transfer_instruction = system_instruction::transfer(
            &user_wallet.key(),
            &reserve_vault.key(),
            amount
        );

        anchor_lang::solana_program::program::invoke(
            &transfer_instruction,
            &[
                user_wallet.to_account_info(),
                reserve_vault.to_account_info(),
                ctx.accounts.system_program.to_account_info()
            ],
        )?;

        msg!("Trasfered {} tokens from user to reserve vault", amount);
        sol_log_compute_units();

        // 2) Mint tokens to user deposit vault
        // -----------------------------------------------------------------------------------------------------
        
        Bank::mint_tokens(
            &bank,
            &representative_mint,
            &deposit_vault,
            &ctx.accounts.token_program,
            amount,
        )?;
        
        msg!("Minted {} tokens to user deposit vault", amount);
        sol_log_compute_units();

        // 3) Update Accounts
        // -----------------------------------------------------------------------------------------------------

        asset.deposit_amount += amount;
        asset.update_aprs_and_rates(ctx.accounts.clock.slot);
        asset.last_update.update_slot(ctx.accounts.clock.slot);

        deposit.deposit_rate_index = calculate_weighted_average_rate_index(
            deposit.amount,
            amount,
            asset.deposit_global_rate,
            deposit.deposit_rate_index
        )?;
        deposit.amount += amount;
        deposit.last_update.update_slot(ctx.accounts.clock.slot);

        msg!("Deposit SOL completed");
        sol_log_compute_units();

        Ok(())

    }

    pub fn withdraw_sol(ctx: Context<SolDepositAccounts>, amount: u64) -> Result<()> {

        // -----------------------------------------------------------------------------------------------------
        // @ Variables
        // -----------------------------------------------------------------------------------------------------

        // Accounts
        // -----------------------------------------------------------------------------------------------------
        
        let bank = &ctx.accounts.bank;
        let asset= &mut ctx.accounts.asset;
        let deposit = &mut ctx.accounts.deposit;
        let representative_mint = &mut ctx.accounts.representative_mint;

        // Vaults
        // -----------------------------------------------------------------------------------------------------

        let reserve_vault = &mut ctx.accounts.reserve_vault;
        let user_wallet = &mut ctx.accounts.user_wallet;
        let deposit_vault = &mut ctx.accounts.deposit_vault;
        
        // -----------------------------------------------------------------------------------------------------
        // 1) Validations
        // -----------------------------------------------------------------------------------------------------

        // Arguments
        // -----------------------------------------------------------------------------------------------------

        require!(amount > 0, BankErrorCode::InvalidAmount);

        // Accounts
        // -----------------------------------------------------------------------------------------------------

        require!(bank.available, BankErrorCode::BankUnavailable);

        require!(asset.bank == bank.key(), BankErrorCode::NotOwnedByBank);
                
        require!(reserve_vault.owner == ctx.program_id, BankErrorCode::NotOwnedByProgram);

        require!(deposit.user == user_wallet.key(), BankErrorCode::Unauthorized);
        require!(deposit.asset == asset.key(), BankErrorCode::WrongAssetAddress);

        // Vaults
        // -----------------------------------------------------------------------------------------------------

        require!(**reserve_vault.lamports.borrow() >= amount, BankErrorCode::InsufficientReserve);

        msg!("Validations completed");
        sol_log_compute_units();

        // -----------------------------------------------------------------------------------------------------
        // @ Algorithm
        // -----------------------------------------------------------------------------------------------------

        // 1) Calculate the amount of tokens to burn
        // -----------------------------------------------------------------------------------------------------

        let withdraw_amount_to_burned = deposit._calculate_withdraw_amount_to_burn(
            amount,
            deposit_vault.amount,
            asset.deposit_global_rate,
            asset.mint_decimals)?;

        // 2) Burn tokens from user deposit vault
        // -----------------------------------------------------------------------------------------------------
        
        Bank::burn_user_tokens(
            user_wallet,
            deposit_vault,
            representative_mint,
            &ctx.accounts.token_program,
            withdraw_amount_to_burned,
        )?;

        msg!("Burned {} tokens from user deposit vault", withdraw_amount_to_burned);
        sol_log_compute_units();

        // 3) Transfer SOL from reserve to user wallet
        // -----------------------------------------------------------------------------------------------------

        **reserve_vault.to_account_info().try_borrow_mut_lamports()? -= amount;
        **user_wallet.to_account_info().try_borrow_mut_lamports()? += amount;

        msg!("Transferred {} tokens from reserve vault to user wallet", amount);
        sol_log_compute_units();

        // 4) Update deposit account
        // -----------------------------------------------------------------------------------------------------

        asset.deposit_amount -= withdraw_amount_to_burned;
        asset.update_aprs_and_rates(ctx.accounts.clock.slot);
        asset.last_update.update_slot(ctx.accounts.clock.slot);

        deposit.amount -= withdraw_amount_to_burned;
        if deposit.amount == 0 {
            deposit.deposit_rate_index = asset.deposit_global_rate;
        }
        deposit.last_update.update_slot(ctx.accounts.clock.slot);

        msg!("Withdraw SOL completed");
        sol_log_compute_units();

        Ok(())

    }

    pub fn deposit_token(ctx: Context<TokenDepositAccounts>, amount: u64) -> Result<()> {

        // -----------------------------------------------------------------------------------------------------
        // @ Variables
        // -----------------------------------------------------------------------------------------------------

        // Accounts
        // -----------------------------------------------------------------------------------------------------

        let bank = &ctx.accounts.bank;
        let asset= &mut ctx.accounts.asset;
        let deposit = &mut ctx.accounts.deposit;
        let representative_mint = &mut ctx.accounts.representative_mint;

        // Vaults
        // -----------------------------------------------------------------------------------------------------

        let user_wallet = &ctx.accounts.user_wallet;
        let user_token_reserve = &mut ctx.accounts.user_token_reserve;
        let deposit_vault = &mut ctx.accounts.deposit_vault;
        let reserve_vault = &mut ctx.accounts.reserve_vault;

        // -----------------------------------------------------------------------------------------------------
        // @ Validations
        // -----------------------------------------------------------------------------------------------------

        // Arguments
        // -----------------------------------------------------------------------------------------------------

        require!(amount > 0, BankErrorCode::InvalidAmount);

        // Accounts
        // -----------------------------------------------------------------------------------------------------

        // Bank
        require!(bank.available, BankErrorCode::BankUnavailable);

        // Asset
        require!(asset.bank == bank.key(), BankErrorCode::NotOwnedByBank);
        
        // Deposit
        require!(deposit.user == user_wallet.key(), BankErrorCode::Unauthorized);
        require!(deposit.asset == asset.key(), BankErrorCode::WrongAssetAddress);

        // Vaults
        // -----------------------------------------------------------------------------------------------------

        require!(user_token_reserve.amount >= amount, BankErrorCode::InsufficientUserReserve);


        msg!("Validations completed");
        sol_log_compute_units();

        // -----------------------------------------------------------------------------------------------------
        // @ Algorithm
        // -----------------------------------------------------------------------------------------------------

        // 1) Transfer Token from user token reserve to reserve vault
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
            amount,
        )?;
        
        msg!("Transfered {} tokens from user to reserve", amount);
        sol_log_compute_units();

        // 2) Mint tokens to user deposit 
        // -----------------------------------------------------------------------------------------------------
        
        Bank::mint_tokens(
            bank,
            representative_mint,
            deposit_vault,
            &ctx.accounts.token_program,
            amount,
        )?;
        
        msg!("Minted {} tokens to user deposit vault", amount);
        sol_log_compute_units();

        // 3) Update Accounts
        // -----------------------------------------------------------------------------------------------------

        asset.deposit_amount += amount;
        asset.update_aprs_and_rates(ctx.accounts.clock.slot);
        asset.last_update.update_slot(ctx.accounts.clock.slot);

        deposit.deposit_rate_index = calculate_weighted_average_rate_index(
            deposit.amount,
            amount,
            asset.deposit_global_rate,
            deposit.deposit_rate_index
        )?;
        deposit.amount += amount;
        deposit.last_update.update_slot(ctx.accounts.clock.slot);

        msg!("Deposit Token completed");
        sol_log_compute_units();

        Ok(())

    }

    pub fn withdraw_token(ctx: Context<TokenDepositAccounts>, amount: u64) -> Result<()> {

        // -----------------------------------------------------------------------------------------------------
        // @ Variables
        // -----------------------------------------------------------------------------------------------------
        
       	// Accounts
        // -----------------------------------------------------------------------------------------------------
        
        let bank = &ctx.accounts.bank;
        let asset= &mut ctx.accounts.asset;
        let deposit = &mut ctx.accounts.deposit;
        let representative_mint = &mut ctx.accounts.representative_mint;

        // Vaults
        // -----------------------------------------------------------------------------------------------------

        let user_wallet = &mut ctx.accounts.user_wallet;
        let user_token_reserve = &mut ctx.accounts.user_token_reserve;
        let deposit_vault = &mut ctx.accounts.deposit_vault;
        let reserve_vault = &mut ctx.accounts.reserve_vault;

        // -----------------------------------------------------------------------------------------------------
        // @ Validations
        // -----------------------------------------------------------------------------------------------------

        // Arguments
        // -----------------------------------------------------------------------------------------------------

        require!(amount > 0, BankErrorCode::InvalidAmount);

        // Accounts
        // -----------------------------------------------------------------------------------------------------

        require!(bank.available, BankErrorCode::BankUnavailable);

        require!(asset.bank == bank.key(), BankErrorCode::NotOwnedByBank);

        require!(deposit.user == user_wallet.key(), BankErrorCode::Unauthorized);
        require!(deposit.asset == asset.key(), BankErrorCode::WrongAssetAddress);

        // Vaults
        // -----------------------------------------------------------------------------------------------------

        require!(reserve_vault.amount >= amount, BankErrorCode::InsufficientReserve);

        msg!("Validations completed");
        sol_log_compute_units();

        // -----------------------------------------------------------------------------------------------------
        // @ Algorithm
        // -----------------------------------------------------------------------------------------------------

        // 1) Calculate the amount of tokens to burn
        // -----------------------------------------------------------------------------------------------------

        let withdraw_amount_to_burned = deposit._calculate_withdraw_amount_to_burn(amount, deposit_vault.amount,
            asset.deposit_global_rate, asset.mint_decimals)?;

        // 2) Burn tokens from user deposit vault
        // -----------------------------------------------------------------------------------------------------
        
        Bank::burn_user_tokens(
            user_wallet,
            deposit_vault,
            representative_mint,
            &ctx.accounts.token_program,
            withdraw_amount_to_burned,
        )?;

        msg!("Burned {} tokens from user deposit vault", withdraw_amount_to_burned);
        sol_log_compute_units();

        // -----------------------------------------------------------------------------------------------------
        // 3) Transfer Token from reserve vault to user reserve vault 
        // -----------------------------------------------------------------------------------------------------

        Bank::execute_transaction(
            bank,
            reserve_vault,
            user_token_reserve,
            &ctx.accounts.token_program,
            amount
        )?;

        msg!("Transferred {} tokens from reserve to user reserve vault", amount);
        sol_log_compute_units();

        // 4) Update Accounts
        // -----------------------------------------------------------------------------------------------------
        
        asset.deposit_amount -= withdraw_amount_to_burned;
        asset.update_aprs_and_rates(ctx.accounts.clock.slot);
        asset.last_update.update_slot(ctx.accounts.clock.slot);
        
        deposit.amount -= withdraw_amount_to_burned;
        if deposit.amount == 0 {
            deposit.deposit_rate_index = asset.deposit_global_rate;
        }
        deposit.last_update.update_slot(ctx.accounts.clock.slot);

        msg!("Withdraw Token completed");
        sol_log_compute_units();

        Ok(())

    }

}

#[derive(Accounts)]
pub struct CreateDeposit<'info> {
    #[account(mut)]
    pub user_wallet: Signer<'info>,
    pub representative_mint: Account<'info, Mint>,
    #[account()]
    pub bank: Account<'info, Bank>,
    #[account()]
    pub asset: Account<'info, Asset>,
    #[account(init, payer = user_wallet, space = Deposit::LEN, seeds = [b"deposit", asset.key().as_ref(), user_wallet.key.as_ref()], bump)]
    pub deposit: Account<'info, Deposit>,
    #[account(init, payer = user_wallet, associated_token::mint = representative_mint, associated_token::authority = user_wallet)]
    pub deposit_vault: Account<'info, TokenAccount>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub clock: Sysvar<'info, Clock>
}

#[derive(Accounts)]
pub struct SolDepositAccounts<'info> {
    #[account(mut)]
    pub user_wallet: Signer<'info>,
    #[account(mut)]
    pub representative_mint: Account<'info, Mint>,
    #[account()]
    pub bank: Account<'info, Bank>,
    #[account(mut)]
    pub asset: Account<'info, Asset>,
    #[account(mut)]
    pub deposit: Account<'info, Deposit>,
    /// CHECK: The `reserve_vault` is a `SystemAccount` that is the reserve wallet of the SOL asset.
    #[account(mut, seeds = [b"reserve", bank.key().as_ref()], bump)]
    pub reserve_vault: AccountInfo<'info>,
    #[account(mut, associated_token::mint = representative_mint, associated_token::authority = user_wallet)]
    pub deposit_vault: Account<'info, TokenAccount>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub clock: Sysvar<'info, Clock>
}

#[derive(Accounts)]
pub struct TokenDepositAccounts<'info> {
    #[account(mut)]
    pub user_wallet: Signer<'info>,
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub representative_mint: Account<'info, Mint>,
    #[account()]
    pub bank: Account<'info, Bank>,
    #[account(mut)]
    pub asset: Account<'info, Asset>,
    #[account(mut)]
    pub deposit: Account<'info, Deposit>,
    #[account(mut, associated_token::mint = mint, associated_token::authority = bank)]
    pub reserve_vault: Account<'info, TokenAccount>,
    #[account(mut, associated_token::mint = representative_mint, associated_token::authority = user_wallet)]
    pub deposit_vault: Account<'info, TokenAccount>,
    #[account(mut, associated_token::mint = mint, associated_token::authority = user_wallet)]
    pub user_token_reserve: Account<'info, TokenAccount>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub clock: Sysvar<'info, Clock>
}
