import { usePrivy } from '@privy-io/react-auth';

export function useAuthIdentity() {
  const { user, authenticated, login } = usePrivy();
  const email = user?.email?.address ?? undefined;
  const address =
    user?.linkedAccounts?.find((a: any) => a.type === 'wallet')?.address ??
    user?.wallet?.address ??
    undefined;
  const privyUserId = user?.id ?? undefined;
  return { email, address, privyUserId, authenticated, login };
}
