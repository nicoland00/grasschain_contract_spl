//! programs/grasschain_contract_spl/src/lib.rs
//! Example: "init_mint" style + "create_contract" style, 
//! mirroring how the "lending" code does `init_bank` + instructions.

#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Transfer, MintTo},
};

declare_id!("coUnmi3oBUtwtd9fjeAvSsJssXh5A5xyPbhpewyzRVF");

#[program]
pub mod grasschain_contract_spl {
    use super::*;

    /// (A) Initialize a new Mint + its "escrow vault" token account
    ///     on chain. Similar to "init_bank" in your lending code.
    pub fn init_mint(_ctx: Context<InitMint>, _decimals: u8) -> Result<()> {
        // We don't actually need to store `decimals` anywhere,
        // anchor-spl `#[account(init, token::mint=...)]` does it for us.
        msg!("init_mint => minted an SPL with seeds [b\"mint\", signer.key()]");
        Ok(())
    }

    pub fn mint_tokens_to_user(ctx: Context<MintTokensToUser>, amount: u64) -> Result<()> {
        // CPI call
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_accounts = MintTo {
            mint: ctx.accounts.mint_account.to_account_info(),
            to: ctx.accounts.recipient_ata.to_account_info(),
            authority: ctx.accounts.signer.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    
        token::mint_to(cpi_ctx, amount)?;
    
        msg!("Minted {} tokens to ATA of user {}", amount, ctx.accounts.recipient.key());
        Ok(())
    }
    /// (B) Create the contract => status = Created
    pub fn create_contract(
        ctx: Context<CreateContract>,
        investment_amount: u64,
        yield_percentage: i64,
    ) -> Result<()> {
        let contract = &mut ctx.accounts.contract;

        contract.farmer = ctx.accounts.farmer.key();
        contract.investor = None;

        // The "mint" might be the same one we created with `init_mint`.
        contract.token_mint = ctx.accounts.mint.key();

        // We reuse the "escrow" (the minted token account) as the program’s “vault”.
        contract.escrow_token_account = ctx.accounts.escrow_vault.key();

        contract.investment_amount = investment_amount as i64;
        contract.yield_percentage = yield_percentage;
        contract.status = ContractStatus::Created;

        msg!(
            "create_contract => farmer={}, investment={}, yield={}",
            contract.farmer,
            investment_amount,
            yield_percentage
        );
        Ok(())
    }

    /// (C) The investor funds => status = Funded
    pub fn fund_contract(ctx: Context<FundContract>, amount: u64) -> Result<()> {
        let contract = &mut ctx.accounts.contract;

        require!(
            contract.status == ContractStatus::Created,
            ErrorCode::InvalidContractStatus
        );
        require!(
            amount == contract.investment_amount as u64,
            ErrorCode::InsufficientFunds
        );

        // Transfer from investor => escrow
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.investor_token_account.to_account_info(),
                to: ctx.accounts.escrow_vault.to_account_info(),
                authority: ctx.accounts.investor.to_account_info(),
            },
        );
        token::transfer(cpi_ctx, amount)?;

        contract.investor = Some(ctx.accounts.investor.key());
        contract.status = ContractStatus::Funded;

        msg!("Funded => investor={}, amount={}", contract.investor.unwrap(), amount);
        Ok(())
    }

    /// (D) Farmer settles => status = Settled
    pub fn settle_contract(ctx: Context<SettleContract>, buyback_amount: u64) -> Result<()> {
        let contract = &mut ctx.accounts.contract;

        require!(
            contract.status == ContractStatus::Funded,
            ErrorCode::InvalidContractStatus
        );

        let required_buyback = contract.calculate_buyback();
        require!(
            buyback_amount >= required_buyback,
            ErrorCode::InsufficientBuyback
        );

        // Transfer from farmer => investor
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.farmer_token_account.to_account_info(),
                to: ctx.accounts.investor_token_account.to_account_info(),
                authority: ctx.accounts.farmer.to_account_info(),
            },
        );
        token::transfer(cpi_ctx, buyback_amount)?;

        contract.status = ContractStatus::Settled;
        msg!("Settled => buyback={} (required={})", buyback_amount, required_buyback);
        Ok(())
    }
}

// ------------------------------------------

#[account]
pub struct Contract {
    pub farmer: Pubkey,
    pub investor: Option<Pubkey>,
    pub token_mint: Pubkey,
    pub escrow_token_account: Pubkey,
    pub investment_amount: i64,
    pub yield_percentage: i64,
    pub status: ContractStatus,
}

impl Contract {
    pub fn calculate_buyback(&self) -> u64 {
        let principal = self.investment_amount;
        let yield_amt = (principal * self.yield_percentage) / 100;
        let total = principal + yield_amt;
        total.max(0) as u64
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum ContractStatus {
    Created,
    Funded,
    Settled,
}

// ------------------------------------------

#[derive(Accounts)]
#[instruction(decimals: u8)]
pub struct InitMint<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        init,
        payer = signer,
        mint::decimals = decimals,
        mint::authority = signer,
        seeds = [b"mint", signer.key().as_ref()],
        bump,
    )]
    pub mint_account: Account<'info, Mint>,

    #[account(
        init,
        payer = signer,
        token::mint = mint_account,
        token::authority = escrow_vault,
        seeds = [
            b"escrow",
            mint_account.key().as_ref()
        ],
        bump
    )]
    pub escrow_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

/// Now we do the "CreateContract" instructions
#[derive(Accounts)]
#[instruction(investment_amount: u64, yield_percentage: i64)]
pub struct CreateContract<'info> {
    #[account(mut)]
    pub farmer: Signer<'info>,

    /// The Contract data
    #[account(
        init,
        payer = farmer,
        space = 8 + 200,
        seeds = [
            b"contract",
            farmer.key().as_ref()
        ],
        bump
    )]
    pub contract: Account<'info, Contract>,

    /// The Mint (already created by init_mint)
    pub mint: Account<'info, Mint>,

    /// The escrow vault (already created by init_mint)
    #[account(mut)]
    pub escrow_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}


#[derive(Accounts)]
pub struct FundContract<'info> {
    #[account(mut)]
    pub contract: Account<'info, Contract>,

    #[account(mut)]
    pub investor: Signer<'info>,

    pub mint: Account<'info, Mint>,

    /// The escrow from init_mint or from create_contract
    #[account(mut)]
    pub escrow_vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub investor_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}


#[derive(Accounts)]
pub struct SettleContract<'info> {
    #[account(mut)]
    pub contract: Account<'info, Contract>,
    #[account(mut)]
    pub farmer: Signer<'info>,

    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub investor_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub farmer_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

/// For demonstration, an instruction that creates a user’s ATA + mints them `amount`.
#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct MintTokensToUser<'info> {
    /// The authority that can mint new tokens. If that's the farmer, 
    /// this must match the authority in your initMint instruction.
    #[account(mut)]
    pub signer: Signer<'info>,

    /// The mint we created with initMint. Must have authority == `signer`.
    #[account(mut)]
    pub mint_account: Account<'info, Mint>,

    /// We will create an ATA for `recipient` if needed
    /// (just a SystemAccount or Signer if you prefer)
    pub recipient: SystemAccount<'info>,

    /// The ATA for `recipient`. We'll do `init_if_needed` so ephemeral ledger sees it.
    #[account(
        init_if_needed,
        payer = signer,
        associated_token::mint = mint_account,
        associated_token::authority = recipient,
    )]
    pub recipient_ata: Account<'info, TokenAccount>,

    #[account(address = anchor_spl::token::ID)]
    pub token_program: Program<'info, Token>,

    #[account(address = anchor_spl::associated_token::ID)]
    pub associated_token_program: Program<'info, AssociatedToken>,

    pub system_program: Program<'info, System>,
}





// ------------------------------------------

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid contract status for this operation.")]
    InvalidContractStatus,
    #[msg("Insufficient funds or mismatch with required investment.")]
    InsufficientFunds,
    #[msg("Insufficient buyback amount.")]
    InsufficientBuyback,
}

