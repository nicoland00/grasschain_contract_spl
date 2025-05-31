// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { Cluster, PublicKey } from '@solana/web3.js'
import GrasschainContractSplIDL from '../target/idl/grasschain_contract_spl.json'
import type { GrasschainContractSpl } from '../target/types/grasschain_contract_spl'

// Re-export the generated IDL and type
export { GrasschainContractSpl, GrasschainContractSplIDL }

// The programId is imported from the program IDL.
export const GRASSCHAIN_CONTRACT_SPL_PROGRAM_ID = new PublicKey(GrasschainContractSplIDL.address)

// This is a helper function to get the GrasschainContractSpl Anchor program.
export function getGrasschainContractSplProgram(provider: AnchorProvider, address?: PublicKey) {
  return new Program({ ...GrasschainContractSplIDL, address: address ? address.toBase58() : GrasschainContractSplIDL.address } as GrasschainContractSpl, provider)
}

// This is a helper function to get the program ID for the GrasschainContractSpl program depending on the cluster.
export function getGrasschainContractSplProgramId(cluster: Cluster) {
  switch (cluster) {
    case 'devnet':
    case 'testnet':
      // This is the program ID for the GrasschainContractSpl program on devnet and testnet.
      return new PublicKey('BfEoJTm7VLRvynukHU2Jjf9gnqWPF7pz9R43MrFNn4cg')
    case 'mainnet-beta':
    default:
      return GRASSCHAIN_CONTRACT_SPL_PROGRAM_ID
  }
}
