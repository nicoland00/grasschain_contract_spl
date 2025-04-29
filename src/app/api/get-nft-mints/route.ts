// app/api/get-nft-mints/route.ts
import { NextResponse } from 'next/server';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';

export async function POST(request: Request) {
  try {
    const { publicKey } = await request.json();
    if (!publicKey) {
      return NextResponse.json(
        { success: false, error: 'Missing publicKey' },
        { status: 400 }
      );
    }

    const walletPubKey = new PublicKey(publicKey);
    const network = process.env.SOLANA_NETWORK || 'devnet';
    const rpcUrl   = process.env.SOLANA_RPC_URL || clusterApiUrl(network as any);
    const connection = new Connection(rpcUrl, 'confirmed');

    // Extraemos solo tokens con amount > 0 y decimals === 0 (NFTs)
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      walletPubKey,
      { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
    );

    const nftMints = tokenAccounts.value
      .filter((acct) => {
        const info   = acct.account.data.parsed.info;
        const amount = info.tokenAmount.uiAmount;
        const dec    = info.tokenAmount.decimals;
        return amount && amount > 0 && dec === 0;
      })
      .map((acct) => acct.account.data.parsed.info.mint);

    return NextResponse.json({ success: true, nftMints });
  } catch (err: any) {
    console.error('Error in /api/get-nft-mints:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
