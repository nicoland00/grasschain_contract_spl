'use client'

import { getGrasschainContractSplProgram, getGrasschainContractSplProgramId } from '@project/anchor'
import { useConnection } from '@solana/wallet-adapter-react'
import { Cluster, Keypair, PublicKey } from '@solana/web3.js'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import toast from 'react-hot-toast'
import { useCluster } from '../cluster/cluster-data-access'
import { useAnchorProvider } from '../solana/solana-provider'
import { useTransactionToast } from '../ui/ui-layout'

export function useGrasschainContractSplProgram() {
  const { connection } = useConnection()
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const provider = useAnchorProvider()
  const programId = useMemo(() => getGrasschainContractSplProgramId(cluster.network as Cluster), [cluster])
  const program = useMemo(() => getGrasschainContractSplProgram(provider, programId), [provider, programId])

  const accounts = useQuery({
    queryKey: ['grasschain_contract_spl', 'all', { cluster }],
    queryFn: () => program.account.grasschain_contract_spl.all(),
  })

  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  })

  const initialize = useMutation({
    mutationKey: ['grasschain_contract_spl', 'initialize', { cluster }],
    mutationFn: (keypair: Keypair) =>
      program.methods.initialize().accounts({ grasschain_contract_spl: keypair.publicKey }).signers([keypair]).rpc(),
    onSuccess: (signature) => {
      transactionToast(signature)
      return accounts.refetch()
    },
    onError: () => toast.error('Failed to initialize account'),
  })

  return {
    program,
    programId,
    accounts,
    getProgramAccount,
    initialize,
  }
}

export function useGrasschainContractSplProgramAccount({ account }: { account: PublicKey }) {
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const { program, accounts } = useGrasschainContractSplProgram()

  const accountQuery = useQuery({
    queryKey: ['grasschain_contract_spl', 'fetch', { cluster, account }],
    queryFn: () => program.account.grasschain_contract_spl.fetch(account),
  })

  const closeMutation = useMutation({
    mutationKey: ['grasschain_contract_spl', 'close', { cluster, account }],
    mutationFn: () => program.methods.close().accounts({ grasschain_contract_spl: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accounts.refetch()
    },
  })

  const decrementMutation = useMutation({
    mutationKey: ['grasschain_contract_spl', 'decrement', { cluster, account }],
    mutationFn: () => program.methods.decrement().accounts({ grasschain_contract_spl: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
  })

  const incrementMutation = useMutation({
    mutationKey: ['grasschain_contract_spl', 'increment', { cluster, account }],
    mutationFn: () => program.methods.increment().accounts({ grasschain_contract_spl: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
  })

  const setMutation = useMutation({
    mutationKey: ['grasschain_contract_spl', 'set', { cluster, account }],
    mutationFn: (value: number) => program.methods.set(value).accounts({ grasschain_contract_spl: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
  })

  return {
    accountQuery,
    closeMutation,
    decrementMutation,
    incrementMutation,
    setMutation,
  }
}
