use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    metadata::{
        create_metadata_accounts_v3, create_master_edition_v3,
        CreateMetadataAccountsV3, CreateMasterEditionV3,
    },
    token::{self, Mint, Token, TokenAccount, Transfer},
};
use mpl_token_metadata::types::DataV2;
use mpl_token_metadata::ID as token_metadata_program_id; // This is a constant Pubkey
use std::str::FromStr;


declare_id!("BfEoJTm7VLRvynukHU2Jjf9gnqWPF7pz9R43MrFNn4cg");

// Constants
const USDC_MINT: &str = "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr";
const ADMIN_ADDRESS: &str = "74bwEVrLxoWtg8ya7gB1KKKuff9wnNADys1Ss1cxsEdd";


#[program]
pub mod grasschain_contract_spl {
    use super::*;

    /// (1) Admin creates a contract => status=Created => 1 month to fill
  /// (1) Admin creates a contract (status = Created) with an off–chain image URL.
  pub fn create_contract(
    ctx: Context<CreateContract>,
    total_investment_needed: u64,
    yield_percentage: i64,
    duration_in_seconds: i64,
    contract_id: u64,
    nft_mint: Pubkey,
    farm_name: String,
    farm_address: String,
    farm_image_url: String, // NEW field – a URL (from Blob)
) -> Result<()> {
    let contract = &mut ctx.accounts.contract;

    // Check USDC mint
    require!(
        ctx.accounts.token_mint.key() == Pubkey::from_str(USDC_MINT).unwrap(),
        ErrorCode::InvalidTokenMint
    );

    // Initialize the contract data
    contract.admin = ctx.accounts.admin.key();
    contract.token_mint = ctx.accounts.token_mint.key();
    contract.nft_mint = nft_mint;
    contract.escrow_token_account = ctx.accounts.escrow_vault.key();

    contract.total_investment_needed = total_investment_needed as i64;
    contract.amount_funded_so_far = 0;
    contract.yield_percentage = yield_percentage;
    contract.duration = duration_in_seconds;
    contract.contract_id = contract_id;
    contract.status = ContractStatus::Created;

    let clock = Clock::get()?;
    contract.upload_date = clock.unix_timestamp;
    // Funding window: 1 month from upload
    contract.funding_deadline = clock.unix_timestamp + 30 * 86400;

    contract.start_time = 0;
    contract.funded_time = 0;
    contract.verified = false;

    // Set farm details
    contract.farm_name = farm_name;
    contract.farm_address = farm_address;
    contract.farm_image_url = farm_image_url;

    Ok(())
}

/// (2) Investor invests a partial amount.
pub fn invest_contract(ctx: Context<InvestContract>, amount: u64) -> Result<()> {
    let contract = &mut ctx.accounts.contract;
    let clock = Clock::get()?;
    require!(
        contract.status == ContractStatus::Created || contract.status == ContractStatus::Funding,
        ErrorCode::InvalidContractStatus
    );
    require!(
        clock.unix_timestamp <= contract.funding_deadline,
        ErrorCode::FundingNotExpiredYet
    );
    let needed = contract.total_investment_needed as u64;
    require!(
        contract.amount_funded_so_far + amount <= needed,
        ErrorCode::ExceedsContractNeed
    );
    let cpi_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.investor_token_account.to_account_info(),
            to: ctx.accounts.escrow_vault.to_account_info(),
            authority: ctx.accounts.investor.to_account_info(),
        },
    );
    token::transfer(cpi_ctx, amount)?;
    contract.amount_funded_so_far += amount;
    let record = &mut ctx.accounts.investor_record;
    record.contract = contract.key();
    record.investor = ctx.accounts.investor.key();
    record.amount += amount;
    record.bump = ctx.bumps.investor_record;

    contract.status = ContractStatus::Funding;
        Ok(())
    }

    pub fn claim_nft(
        ctx: Context<ClaimNft>,
        name: String,
        symbol: String,
        uri: String,
    ) -> Result<()> {
        let investor_record = &mut ctx.accounts.investor_record;
        
        // 1) Check that the investor has not already claimed the NFT.
        if investor_record.nft_minted {
            return err!(ErrorCode::NftAlreadyClaimed);
        }
        
        // 2) Mint 1 token to the investor's associated token account.
        let mint_to_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::MintTo {
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.associated_token_account.to_account_info(),
                authority: ctx.accounts.investor.to_account_info(),
            },
        );
        token::mint_to(mint_to_ctx, 1)?;
        
        // 3) Create the metadata account via the Metaplex token metadata CPI.
        let metadata_ctx = CpiContext::new(
            ctx.accounts.token_metadata_program.to_account_info(),
            CreateMetadataAccountsV3 {
                metadata: ctx.accounts.metadata_account.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                mint_authority: ctx.accounts.investor.to_account_info(),
                update_authority: ctx.accounts.investor.to_account_info(),
                payer: ctx.accounts.investor.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
            },
        );
        let data_v2 = DataV2 {
            name,
            symbol,
            uri,
            seller_fee_basis_points: 0, // Set royalties as needed
            creators: None,
            collection: None,
            uses: None,
        };
        create_metadata_accounts_v3(metadata_ctx, data_v2, false, true, None)?;
        
        // 4) Create the master edition account (this disables print editions if max_supply is None)
        let master_edition_ctx = CpiContext::new(
            ctx.accounts.token_metadata_program.to_account_info(),
            CreateMasterEditionV3 {
                edition: ctx.accounts.master_edition_account.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                update_authority: ctx.accounts.investor.to_account_info(),
                mint_authority: ctx.accounts.investor.to_account_info(),
                payer: ctx.accounts.investor.to_account_info(),
                metadata: ctx.accounts.metadata_account.to_account_info(),
                token_program: ctx.accounts.token_program.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
            },
        );
        create_master_edition_v3(master_edition_ctx, None)?;
        
        // 5) Mark that the NFT has been claimed in the investor record.
        investor_record.nft_minted = true;
        investor_record.nft_mint = ctx.accounts.mint.key();
        
        Ok(())
    }
    
    pub fn verify_funding(ctx: Context<VerifyFunding>) -> Result<()> {
        let contract = &mut ctx.accounts.contract;
        // only allow if fully funded and still in Funding
            require!(
                contract.status == ContractStatus::Funding,
                ErrorCode::InvalidContractStatus
            );
        let clock = Clock::get()?;
        contract.status = ContractStatus::FundedPendingVerification;
        contract.funded_time = clock.unix_timestamp;
        Ok(())
    }


    /// (2b) Expire funding if not fully funded by the 1-month deadline => refunds each investor
    /// This is optional, only if you want to forcibly end the contract if not enough invests
    pub fn expire_funding(ctx: Context<ExpireFunding>) -> Result<()> {
        let contract = &mut ctx.accounts.contract;
        let clock = Clock::get()?;

        require!(
            contract.status == ContractStatus::Funding || contract.status == ContractStatus::Created,
            ErrorCode::InvalidContractStatus
        );
        require!(
            clock.unix_timestamp > contract.funding_deadline,
            ErrorCode::FundingNotExpiredYet
        );
        require!(
            contract.amount_funded_so_far < contract.total_investment_needed.try_into().unwrap(),
            ErrorCode::AlreadyFullyFunded
        );

        // Refund each investor. In this example, we assume each investor calls
        // a separate "refund_investor" instruction or we iterate over InvestorRecords.

        // We'll just set status => Cancelled here. Real code should do the actual refunds.
        contract.status = ContractStatus::Cancelled;
        Ok(())
    }

    /// (3) Admin withdraw => contract => Active
    /// Admin has 1 month from funded_time to do this
    pub fn admin_withdraw(ctx: Context<AdminWithdraw>) -> Result<()> {
        let admin_key = Pubkey::from_str(ADMIN_ADDRESS).unwrap();
        require!(ctx.accounts.admin.key() == admin_key, ErrorCode::Unauthorized);

        let contract = &mut ctx.accounts.contract;
        let clock = Clock::get()?;

        require!(
            contract.status == ContractStatus::FundedPendingVerification,
            ErrorCode::InvalidContractStatus
        );

        // 1-month window for admin verification
        require!(
            clock.unix_timestamp - contract.funded_time <= 30 * 86400,
            ErrorCode::AdminWindowExpired
        );

        // Transfer from escrow => admin's token account
        let seeds = &[
            b"contract",
            contract.admin.as_ref(),
            &contract.contract_id.to_le_bytes(),
            &[ctx.bumps.contract],
        ];
        let signer = &[&seeds[..]];

        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.escrow_vault.to_account_info(),
                to: ctx.accounts.admin_token_account.to_account_info(),
                authority: contract.to_account_info(),
            },
            signer,
        );
        token::transfer(cpi_ctx, contract.amount_funded_so_far)?;

        // Mark contract => Active
        contract.status = ContractStatus::Active;
        contract.start_time = clock.unix_timestamp;

        // Distribute NFTs to each investor (placeholder).
        // Real code would iterate over all InvestorRecords for this contract
        // and call a "mint_nft_to_investor" CPI to Metaplex or the token program.
        // e.g. distribute_nfts(ctx, contract.key())?

        Ok(())
    }

    /// (4) Admin cancels => refunds all invests
    pub fn admin_cancel(ctx: Context<AdminCancel>) -> Result<()> {
        let admin_key = Pubkey::from_str(ADMIN_ADDRESS).unwrap();
        require!(ctx.accounts.admin.key() == admin_key, ErrorCode::Unauthorized);

        let contract = &mut ctx.accounts.contract;
        let clock = Clock::get()?;

        require!(
            contract.status == ContractStatus::FundedPendingVerification,
            ErrorCode::InvalidContractStatus
        );

        // 1-month window
        require!(
            clock.unix_timestamp - contract.funded_time <= 30 * 86400,
            ErrorCode::AdminWindowExpired
        );

        // Refund invests. For simplicity, we just transfer the entire escrow => the
        // single "investor_token_account" if there's only one. For partial invests,
        // you'd iterate. We'll just do one investor for demonstration.
        let seeds = &[
            b"contract",
            contract.admin.as_ref(),
            &contract.contract_id.to_le_bytes(),
            &[ctx.bumps.contract],
        ];
        let signer = &[&seeds[..]];

        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.escrow_vault.to_account_info(),
                to: ctx.accounts.investor_token_account.to_account_info(),
                authority: contract.to_account_info(),
            },
            signer,
        );
        token::transfer(cpi_ctx, contract.amount_funded_so_far)?;

        contract.status = ContractStatus::Cancelled;
        Ok(())
    }

    /// (5) Once contract => Active, after start_time + duration, we go => PendingBuyback
    /// This can happen automatically or in a "check_update" instruction
    pub fn check_maturity(ctx: Context<CheckMaturity>) -> Result<()> {
        let contract = &mut ctx.accounts.contract;
        let clock = Clock::get()?;

        require!(
            contract.status == ContractStatus::Active,
            ErrorCode::InvalidContractStatus
        );

        let end_time = contract.start_time + contract.duration;

        if clock.unix_timestamp >= end_time {
            contract.status = ContractStatus::PendingBuyback;
            // buyback window = duration segundos
            contract.buyback_deadline = end_time + 30 * 86400;
         }

        Ok(())
    }

    pub fn settle_investor(ctx: Context<SettleInvestor>) -> Result<()> {
        let contract = &mut ctx.accounts.contract; 
        let record   = &mut ctx.accounts.investor_record;
        let clock    = Clock::get()?;
    
        // 1) Sólo PendingBuyback o Prolonged
        require!(
            matches!(contract.status, ContractStatus::PendingBuyback | ContractStatus::Prolonged),
            ErrorCode::InvalidContractStatus
        );
    
        // 2) Chequea que sea el admin correcto
        require!(
            ctx.accounts.admin.key() == Pubkey::from_str(ADMIN_ADDRESS).unwrap(),
            ErrorCode::Unauthorized
        );
    
        // 3) Ventana de buyback
        let deadline = if contract.status == ContractStatus::PendingBuyback {
            contract.buyback_deadline
        } else {
            contract.prolonged_deadline
        };
        require!(
            clock.unix_timestamp <= deadline,
            ErrorCode::SettlementWindowExpired
        );
    
        // 4) Calcula cuánto devolver
        let principal = record.amount;
        let yield_amt = (principal as i128 * contract.yield_percentage as i128 / 100) as u64;
        let total     = principal.checked_add(yield_amt).ok_or(ErrorCode::InsufficientBuyback)?;
    
        // 5) Haz el transfer SPL
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.admin_token_account.to_account_info(),
                to:   ctx.accounts.investor_token_account.to_account_info(),
                authority: ctx.accounts.admin.to_account_info(),
            },
        );
        token::transfer(cpi_ctx, total)?;
    
        // 6) Marca el record como pagado
        record.amount = 0;

        Ok(())
    }
    
    // (9) Cerrar el contrato una vez se hayan liquidado todos los inversores
pub fn close_contract(ctx: Context<CloseContract>) -> Result<()> {
    let contract = &mut ctx.accounts.contract;
    // 1) Solo el admin puede
    require!(
      ctx.accounts.admin.key() == Pubkey::from_str(ADMIN_ADDRESS).unwrap(),
      ErrorCode::Unauthorized
    );
    // 2) Debe estar todavía en PendingBuyback o Prolonged
    require!(
      matches!(contract.status, ContractStatus::PendingBuyback | ContractStatus::Prolonged),
      ErrorCode::InvalidContractStatus
    );
    // 3) Marcamos como Settled
    contract.status = ContractStatus::Settled;
    Ok(())
}




    /// (7) Admin can request a 2-week prolongation
    pub fn prolong_contract(ctx: Context<ProlongContract>) -> Result<()> {
        let contract = &mut ctx.accounts.contract;
        let _clock = Clock::get()?;

        require!(
            contract.status == ContractStatus::PendingBuyback,
            ErrorCode::InvalidContractStatus
        );

        let admin_key = Pubkey::from_str(ADMIN_ADDRESS).unwrap();
        require!(ctx.accounts.admin.key() == admin_key, ErrorCode::Unauthorized);

        // add 2 weeks to the buyback_deadline
        contract.prolonged_deadline = contract.buyback_deadline + 14 * 86400;
        contract.status = ContractStatus::Prolonged;
        Ok(())
    }

    /// (8) If admin/farmer fails to repay after prolongation => default
    pub fn default_contract(ctx: Context<DefaultContract>) -> Result<()> {
        let contract = &mut ctx.accounts.contract;
        let clock = Clock::get()?;

        require!(
            contract.status == ContractStatus::Prolonged,
            ErrorCode::InvalidContractStatus
        );
        require!(
            clock.unix_timestamp > contract.prolonged_deadline,
            ErrorCode::SettlementWindowExpired
        );

        contract.status = ContractStatus::Defaulted;
        Ok(())
    }
}

// ---------------------------------------------------------------------
// Data Structures
// ---------------------------------------------------------------------

#[account]
pub struct Contract {
    // Admin / PDAs
    pub admin: Pubkey,
    pub token_mint: Pubkey,
    pub nft_mint: Pubkey,
    pub escrow_token_account: Pubkey,
    pub farm_image_url: String,  // NEW field

    // Funding
    pub total_investment_needed: i64,
    pub amount_funded_so_far: u64,
    pub yield_percentage: i64,
    pub duration: i64,
    pub contract_id: u64,
    pub status: ContractStatus,

    // Timestamps
    pub upload_date: i64,
    pub funding_deadline: i64,
    pub start_time: i64,
    pub funded_time: i64,
    pub verified: bool,

    // Optional buyback windows
    pub buyback_deadline: i64,
    pub prolonged_deadline: i64,

    // Farm details
    pub farm_name: String,
    pub farm_address: String,
}

impl Contract {
    pub fn calculate_buyback(&self) -> u64 {
        let principal = self.total_investment_needed;
        let yield_amt = (principal * self.yield_percentage) / 100;
        (principal + yield_amt).max(0) as u64
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Debug)]
pub enum ContractStatus {
    Created,
    Funding,
    FundedPendingVerification,
    Active,
    PendingBuyback,
    Prolonged,
    Settled,
    Defaulted,
    Cancelled,
}

#[account]
pub struct InvestorRecord {
    pub contract: Pubkey,
    pub investor: Pubkey,
    pub amount: u64,
    pub bump: u8,
    pub nft_minted: bool,
    pub nft_mint: Pubkey,
}

// ---------------------------------------------------------------------
// Contexts (same as before, but update CreateContract to include farm_image_url)
// ---------------------------------------------------------------------
#[derive(Accounts)]
#[instruction(total_investment_needed: u64, yield_percentage: i64, duration_in_seconds: i64, contract_id: u64, nft_mint: Pubkey, farm_name: String, farm_address: String, farm_image_url: String)]
pub struct CreateContract<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    pub token_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = admin,
        space = 8 + 500,
        seeds = [b"contract", admin.key().as_ref(), &contract_id.to_le_bytes()],
        bump
    )]
    pub contract: Account<'info, Contract>,

    #[account(
        init,
        payer = admin,
        token::mint = token_mint,
        token::authority = contract,
        seeds = [b"escrow-vault", contract.key().as_ref()],
        bump
    )]
    pub escrow_vault: Account<'info, TokenAccount>,

    #[account(address = anchor_spl::token::ID)]
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

/// Investors can partially invest
#[derive(Accounts)]
pub struct InvestContract<'info> {
    #[account(
        mut,
        seeds = [b"contract", contract.admin.as_ref(), &contract.contract_id.to_le_bytes()],
        bump
    )]
    pub contract: Account<'info, Contract>,

    #[account(mut)]
    pub investor: Signer<'info>,
    pub token_mint: Account<'info, Mint>,

    #[account(
        mut,
        seeds = [b"escrow-vault", contract.key().as_ref()],
        bump
    )]
    pub escrow_vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub investor_token_account: Account<'info, TokenAccount>,

    // A new or existing InvestorRecord for this (contract, investor)
    #[account(
        init_if_needed,
        payer = investor,
        space = 8 + 200,
        seeds = [
            b"investor-record",
            contract.key().as_ref(),
            investor.key().as_ref()
        ],
        bump
    )]
    pub investor_record: Account<'info, InvestorRecord>,

    #[account(address = anchor_spl::token::ID)]
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimNft<'info> {
    #[account(mut)]
    pub investor: Signer<'info>,
    
    #[account(mut)]
    pub contract: Account<'info, Contract>,
    
    // Ensure the investor_record belongs to this investor.
    #[account(mut, has_one = investor)]
    pub investor_record: Account<'info, InvestorRecord>,
    
    // NEW: The NFT mint account is created on claim.
    #[account(
        init,
        payer = investor,
        mint::decimals = 0,
        mint::authority = investor,
        mint::freeze_authority = investor,
    )]
    pub mint: Account<'info, Mint>,
    
    // NEW: The investor's associated token account for that mint.
    #[account(
        init,
        payer = investor,
        associated_token::mint = mint,
        associated_token::authority = investor,
    )]
    pub associated_token_account: Account<'info, TokenAccount>,
    
    // NEW: Metadata account PDA – derived off-chain using the seeds:
    // ["metadata", token_metadata_program_id.as_ref(), mint.key().as_ref()]
    /// CHECK: This account is created by the token metadata CPI.
    #[account(mut)]
    pub metadata_account: AccountInfo<'info>,
    
    // NEW: Master edition account PDA – derived with an extra "edition" seed.
    /// CHECK: This account is created by the token metadata CPI.
    #[account(mut)]
    pub master_edition_account: AccountInfo<'info>,
    
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    
    /// CHECK: The token metadata program (must equal token_metadata_program_id)
    #[account(address = token_metadata_program_id)]
    pub token_metadata_program: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct VerifyFunding<'info> {
    #[account(
        mut,
        seeds = [
            b"contract",
            contract.admin.as_ref(),
            &contract.contract_id.to_le_bytes()
        ],
        bump
    )]
    pub contract: Account<'info, Contract>,

    /// CHECK: must match your ADMIN_ADDRESS constant
    #[account(signer, 
              address = Pubkey::from_str(ADMIN_ADDRESS).unwrap())]
    pub admin: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

/// Optionally expire the contract if not fully funded by the deadline
#[derive(Accounts)]
pub struct ExpireFunding<'info> {
    #[account(
        mut,
        seeds = [b"contract", contract.admin.as_ref(), &contract.contract_id.to_le_bytes()],
        bump
    )]
    pub contract: Account<'info, Contract>,
    pub system_program: Program<'info, System>,
}

/// Admin withdraw => Active
#[derive(Accounts)]
pub struct AdminWithdraw<'info> {
    #[account(
        mut,
        seeds = [b"contract", contract.admin.as_ref(), &contract.contract_id.to_le_bytes()],
        bump
    )]
    pub contract: Account<'info, Contract>,

    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds = [b"escrow-vault", contract.key().as_ref()],
        bump
    )]
    pub escrow_vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub admin_token_account: Account<'info, TokenAccount>,

    #[account(address = anchor_spl::token::ID)]
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

/// Admin cancels => refunds invests
#[derive(Accounts)]
pub struct AdminCancel<'info> {
    #[account(
        mut,
        seeds = [b"contract", contract.admin.as_ref(), &contract.contract_id.to_le_bytes()],
        bump
    )]
    pub contract: Account<'info, Contract>,
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds = [b"escrow-vault", contract.key().as_ref()],
        bump
    )]
    pub escrow_vault: Account<'info, TokenAccount>,

    // If single investor, or if you want to do partial refunds, you'd do more logic
    #[account(mut)]
    pub investor_token_account: Account<'info, TokenAccount>,

    #[account(address = anchor_spl::token::ID)]
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

/// Move from Active => PendingBuyback if matured
#[derive(Accounts)]
pub struct CheckMaturity<'info> {
    #[account(
        mut,
        seeds = [b"contract", contract.admin.as_ref(), &contract.contract_id.to_le_bytes()],
        bump
    )]
    pub contract: Account<'info, Contract>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SettleInvestor<'info> {
    /// El contrato en sí (PDA)
    #[account(
        mut,
        seeds = [b"contract", contract.admin.as_ref(), &contract.contract_id.to_le_bytes()],
        bump
    )]
    pub contract: Account<'info, Contract>,

    /// El admin que firma (se comprueba en tiempo de ejecución)
    #[account(mut)]
    pub admin: Signer<'info>,

    /// El record del inversor a liquidar (PDA)
    #[account(
        mut,
        seeds = [
            b"investor-record",
            contract.key().as_ref(),
            investor.key().as_ref()
        ],
        bump
    )]
    pub investor_record: Account<'info, InvestorRecord>,

    /// CHECK: El inversor dueño del record
    pub investor: AccountInfo<'info>,

    /// La cuenta USDC del admin (source)
    #[account(mut)]
    pub admin_token_account: Account<'info, TokenAccount>,

    /// La cuenta USDC del inversor (destino)
    #[account(mut)]
    pub investor_token_account: Account<'info, TokenAccount>,

    /// El programa SPL Token
    #[account(address = anchor_spl::token::ID)]
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CloseContract<'info> {
    #[account(
        mut,
        seeds = [b"contract", contract.admin.as_ref(), &contract.contract_id.to_le_bytes()],
        bump
    )]
    pub contract: Account<'info, Contract>,
    pub admin: Signer<'info>,
}


/// Admin prolong => add 2 weeks
#[derive(Accounts)]
pub struct ProlongContract<'info> {
    #[account(
        mut,
        seeds = [b"contract", contract.admin.as_ref(), &contract.contract_id.to_le_bytes()],
        bump
    )]
    pub contract: Account<'info, Contract>,

    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

/// Default if not repaid after prolongation
#[derive(Accounts)]
pub struct DefaultContract<'info> {
    #[account(
        mut,
        seeds = [b"contract", contract.admin.as_ref(), &contract.contract_id.to_le_bytes()],
        bump
    )]
    pub contract: Account<'info, Contract>,
    pub system_program: Program<'info, System>,
}

// ---------------------------------------------------------------------
// Error codes
// ---------------------------------------------------------------------
#[error_code]
pub enum ErrorCode {
    #[msg("Invalid contract status")]
    InvalidContractStatus,
    #[msg("Invalid token mint")]
    InvalidTokenMint,
    #[msg("Insufficient funds")]
    InsufficientFunds,
    #[msg("Insufficient buyback")]
    InsufficientBuyback,
    #[msg("Contract not matured")]
    ContractNotMatured,
    #[msg("Unauthorized admin")]
    Unauthorized,
    #[msg("Admin window expired")]
    AdminWindowExpired,
    #[msg("Settlement window expired")]
    SettlementWindowExpired,

    // New:
    #[msg("Funding window expired")]
    FundingWindowExpired,
    #[msg("Exceeds total needed")]
    ExceedsContractNeed,
    #[msg("Funding not expired yet")]
    FundingNotExpiredYet,
    #[msg("Already fully funded")]
    AlreadyFullyFunded,
    #[msg("Cannot default or prolong in this state")]
    InvalidStateForProlongOrDefault,
    #[msg("NFT already claimed")]
    NftAlreadyClaimed,
}