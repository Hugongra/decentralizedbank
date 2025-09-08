use {
    super::*, 
    crate::errors::BankErrorCode, anchor_lang::{
        prelude::*, 
        solana_program::{
            log::sol_log_compute_units,
            pubkey::Pubkey
        }
    }, anchor_spl::token::{self, Burn, Mint, MintTo, TokenAccount}
};

#[account]
#[derive(Debug, PartialEq)]
pub struct Bank {
    pub version: u8,
    /// Bump seed for derived authority address
    pub bump_seed: u8,
    /// Owner of the bank
    pub admin: Pubkey,
    /// Liquidator of the bank
    pub liquidator: Pubkey,
    /// Fee vault for the bank
    pub fee_vault: Pubkey,
    /// Available status of the bank
    pub available: bool
}

impl Bank {

    const LEN : usize = 
    8 +
    1 +
    1 +
    32 +
    32 +
    32 +
    1;

    /******************************************************************
     *                      UTILITY METHODS                           *      
    ******************************************************************/

    pub fn execute_transaction<'info>(
        bank: &Account<'info, Bank>,
        bank_vault: &mut Account<'info, TokenAccount>, 
        destination_account: &mut Account<'info, TokenAccount>, 
        token_program: &AccountInfo<'info>, 
        amount: u64) -> Result<()> {
        // Seeds for the CPI call
        let bank_seeds: [&[u8]; 3] = [
            b"bank",                 // Seed prefix
            bank.admin.as_ref(), // Admin wallet key stored in the Bank account
            &[bank.bump_seed],       // Bump seed stored in the Bank account
        ];

        let signer_seeds: &[&[&[u8]]] = &[&bank_seeds];

        // CPI call
        let cpi_accounts = anchor_spl::token::Transfer {
            from: bank_vault.to_account_info(),
            to: destination_account.to_account_info(),
            authority: bank.to_account_info()
        };

        // Execute the CPI call
        let cpi_context = CpiContext::new_with_signer(token_program.to_account_info(), cpi_accounts, signer_seeds);
        anchor_spl::token::transfer(cpi_context, amount)?;

        Ok(())
    }

    pub fn mint_tokens<'info>(
        bank: &Account<'info, Bank>, 
        representative_mint: &Account<'info, Mint>, 
        deposit_vault: &Account<'info, TokenAccount>, 
        token_program: &AccountInfo<'info>, 
        amount: u64) -> Result<()> {

        // -----------------------------------------------------------------------------------------------------
        // 1) Validations
        // -----------------------------------------------------------------------------------------------------
        
        // Check if the deposit vault mint is the same as the representative mint
        require!(deposit_vault.mint == representative_mint.key(), BankErrorCode::InvalidMintAddress);

        // -----------------------------------------------------------------------------------------------------
        // 1) Mint tokens
        // -----------------------------------------------------------------------------------------------------
        
        // Bank PDA seeds
        let bank_seeds: [&[u8]; 3] = [
            b"bank",                 // Seed prefix
            bank.admin.as_ref(), // Admin wallet key stored in the Bank account
            &[bank.bump_seed],       // Bump seed stored in the Bank account
        ];

        let signer_seeds: &[&[&[u8]]] = &[&bank_seeds];
        
        // CPI accounts
        let cpi_accounts = MintTo {
            mint: representative_mint.to_account_info(),
            to: deposit_vault.to_account_info(),
            authority: bank.to_account_info(), // PDA acting as mint authority
        };

        // CPI context
        let cpi_ctx = CpiContext::new_with_signer(
            token_program.clone(),
            cpi_accounts,
            signer_seeds, // Signer seeds for PDA
        );
        
        // Execute CPI
        token::mint_to(cpi_ctx, amount)?;
    
        Ok(())

    }

    pub fn burn_user_tokens<'info>(
        user_wallet: &Signer<'info>, 
        deposit_vault: &Account<'info, TokenAccount>, 
        representative_mint: &Account<'info, Mint>, 
        token_program: &AccountInfo<'info>, 
        amount: u64) -> Result<()> {

        // -----------------------------------------------------------------------------------------------------
        // 1) Validations
        // -----------------------------------------------------------------------------------------------------

        // Check if the authority is the owner of the token vault
        require!(deposit_vault.owner == user_wallet.key(), BankErrorCode::Unauthorized);
        // Check if the vault mint is the same as the representative mint
        require!(deposit_vault.mint == representative_mint.key(), BankErrorCode::InvalidMintAddress);
        // Check if the vault has enough tokens to burn
        require!(deposit_vault.amount >= amount, BankErrorCode::InsufficientReserve);

        // -----------------------------------------------------------------------------------------------------
        // 2) Burn tokens
        // -----------------------------------------------------------------------------------------------------

        // CPI accounts
        let cpi_accounts = Burn {
            mint: representative_mint.to_account_info(), // Mint account
            from: deposit_vault.to_account_info(), // Token account (to burn tokens from)
            authority: user_wallet.to_account_info()
        };
        
        // CPI context
        let cpi_ctx = CpiContext::new(
            token_program.clone(),
            cpi_accounts,
        );
        
        // Execute CPI
        token::burn(cpi_ctx, amount)?;
    
        Ok(())

    }

    pub fn burn_bank_tokens<'info>(
        bank: &Account<'info, Bank>, 
        collateral_vault: &Account<'info, TokenAccount>, 
        representative_mint: &Account<'info, Mint>, 
        token_program: &AccountInfo<'info>, 
        amount: u64) -> Result<()> {

        // -----------------------------------------------------------------------------------------------------
        // 1) Validations
        // -----------------------------------------------------------------------------------------------------

        // Check if the authority is the owner of the token vault
        require!(collateral_vault.owner == bank.key(), BankErrorCode::Unauthorized);
        // Check if the vault mint is the same as the representative mint
        require!(collateral_vault.mint == representative_mint.key(), BankErrorCode::InvalidMintAddress);
        // Check if the vault has enough tokens to burn
        require!(collateral_vault.amount >= amount, BankErrorCode::InsufficientReserve);

        // -----------------------------------------------------------------------------------------------------
        // 2) Burn tokens
        // -----------------------------------------------------------------------------------------------------

        // Bank PDA seeds
        let bank_seeds: [&[u8]; 3] = [
            b"bank",                 // Seed prefix
            bank.admin.as_ref(), // Admin wallet key stored in the Bank account
            &[bank.bump_seed],       // Bump seed stored in the Bank account
        ];

        let signer_seeds: &[&[&[u8]]] = &[&bank_seeds];
        
        // CPI accounts
        let cpi_accounts = Burn {
            mint: representative_mint.to_account_info(),
            from: collateral_vault.to_account_info(),
            authority: bank.to_account_info(), // PDA acting as mint authority
        };

        // CPI context
        let cpi_ctx = CpiContext::new_with_signer(
            token_program.clone(),
            cpi_accounts,
            signer_seeds, // Signer seeds for PDA
        );
        
        // Execute CPI
        token::burn(cpi_ctx, amount)?;
    
        Ok(())

    }

    /******************************************************************
     *                      ENTRY POINTS                              *      
    ******************************************************************/

    pub fn create_bank(ctx: Context<CreateBank>) -> Result<()> {
        // -----------------------------------------------------------------------------------------------------
        // @ Variables
        // -----------------------------------------------------------------------------------------------------

        // States
        let bank = &mut ctx.accounts.bank;
        
        // -----------------------------------------------------------------------------------------------------
        // 1) Validations
        // -----------------------------------------------------------------------------------------------------

        require!(ctx.accounts.liquidator.key() != ctx.accounts.admin_wallet.key(), BankErrorCode::InvalidLiquidatorPubkey);
        require!(ctx.accounts.liquidator.key() != Pubkey::default(), BankErrorCode::InvalidLiquidatorPubkey);
        require!(ctx.accounts.fee_vault.key() != ctx.accounts.admin_wallet.key(), BankErrorCode::InvalidFeeVaultPubkey);
        require!(ctx.accounts.fee_vault.key() != Pubkey::default(), BankErrorCode::InvalidFeeVaultPubkey);

        msg!("Validations passed");
        sol_log_compute_units();

        // -----------------------------------------------------------------------------------------------------
        // 2) Create bank account
        // -----------------------------------------------------------------------------------------------------

        bank.version = PROGRAM_VERSION;
        bank.bump_seed = ctx.bumps.bank;
        bank.admin = ctx.accounts.admin_wallet.key();
        bank.liquidator = ctx.accounts.liquidator.key();
        bank.fee_vault = ctx.accounts.fee_vault.key();
        bank.available = false;

        msg!("Created Bank account");
        sol_log_compute_units();

        Ok(())

    }

    pub fn update_bank(ctx: Context<UpdateBank>, liquidator: Option<Pubkey>, fee_vault: Option<Pubkey>, available: Option<bool>) -> Result<()> {

        // -----------------------------------------------------------------------------------------------------
        // @ Variables
        // -----------------------------------------------------------------------------------------------------
        // States
        let bank = &mut ctx.accounts.bank;

        // Wallets
        let admin_wallet = &ctx.accounts.admin_wallet;
        
        // -----------------------------------------------------------------------------------------------------
        // 1) Validations
        // -----------------------------------------------------------------------------------------------------

        require!(admin_wallet.key() == bank.admin, BankErrorCode::Unauthorized);

        msg!("Validations passed");
        sol_log_compute_units();

        // -----------------------------------------------------------------------------------------------------
        // 2) Update bank account
        // -----------------------------------------------------------------------------------------------------

        if liquidator.is_some() {
            let liquidator = liquidator.unwrap();
            require!(bank.admin != liquidator.key(), BankErrorCode::InvalidLiquidatorPubkey);
            require!(Pubkey::default() != liquidator.key(), BankErrorCode::InvalidLiquidatorPubkey);
            bank.liquidator = liquidator;
        }

        if fee_vault.is_some() {
            let fee_vault = fee_vault.unwrap();
            require!(bank.admin != fee_vault.key(), BankErrorCode::InvalidFeeVaultPubkey);
            require!(Pubkey::default() != fee_vault.key(), BankErrorCode::InvalidFeeVaultPubkey);
            bank.fee_vault = fee_vault;
        }

        if available.is_some() {
            bank.available = available.unwrap();
        }

        msg!("Updated bank account");
        sol_log_compute_units();

        Ok(())

    }

}

#[derive(Accounts)]
pub struct CreateBank<'info> {
    #[account(mut)]
    pub admin_wallet: Signer<'info>,
    #[account(
        init,
        payer = admin_wallet,
        space = Bank::LEN,
        seeds = [b"bank", admin_wallet.key().as_ref()],
        bump
    )]
    pub bank: Account<'info, Bank>,
    /// CHECK: The `liquidator` is a `SystemAccount`.
    pub liquidator: AccountInfo<'info>,
    /// CHECK: The `fee_vault` is a `SystemAccount`.
    pub fee_vault: AccountInfo<'info>,
    pub system_program: Program<'info, System>
}

#[derive(Accounts)]
pub struct UpdateBank<'info> {
    #[account()]
    pub admin_wallet: Signer<'info>,
    #[account(mut)]
    pub bank: Account<'info, Bank>,
    pub system_program: Program<'info, System>
}
