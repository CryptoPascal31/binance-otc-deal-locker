import Decimal from 'decimal.js';
import { useLocalPact, useLocalPactImmutable } from './local-pact';
import { Pact } from '@kadena/client';
import { gen_nonce, to_decimal, to_int, to_pact_decimal, to_pact_int } from '@/lib/pact_utils';
import { VIRTUAL_KEYPAIR } from '@/lib/virtual_signer';
import { CHAIN, NETWORK } from '@/lib/constants';

export type GasConfig = {
    payer: string;
    cap: string;
    limit: number;
    price: Decimal;
    code:string
};

export type LockState = {
    available: Decimal
    unlocked: Decimal
    total: Decimal
};


const to_state = (data: Record<string, any>): LockState => ({total: to_decimal(data.total),
                                                             unlocked: to_decimal(data.unlocked),
                                                             available: to_decimal(data.available)})



export function useGasConfig() : undefined | GasConfig
{
  const module = `${import.meta.env.VITE_NAMESPACE}.gas-station`
  const {data} = useLocalPactImmutable(`{"code":${module}.CODE, "payer":${module}.GAS_ACCOUNT, "price":${module}.GAS_PRICE, "limit":${module}.GAS_LIMIT}`,
                                         NETWORK, CHAIN)

  const gasData = data as Record<string, any> | undefined

  return gasData && {code:gasData.code, payer:gasData.payer, cap:`${module}.GAS_PAYER`, limit:to_int(gasData.limit), price:to_decimal(gasData.price)}
}

export function useGlobalState(): undefined | LockState
{
  const module = `${import.meta.env.VITE_NAMESPACE}.otc-deal-locker`
  const {data} = useLocalPact(`(${module}.global-state)`, NETWORK, CHAIN, {revalidateIfStale: false, refreshInterval:15_000})

  return data ? to_state(data as Record<string, any>) : undefined
}

export function useAccountState(account:string | undefined | null ): undefined | LockState
{
  const module = `${import.meta.env.VITE_NAMESPACE}.otc-deal-locker`
  const {data} = useLocalPact( account ? `(${module}.account-state "${account}")` : null, NETWORK, CHAIN, {revalidateIfStale: false, refreshInterval:15_000})

  return data ? to_state(data as Record<string, any>) : undefined
}


export function useUnlockTxBuilder()
{
  const gasConfig = useGasConfig()
  if(!gasConfig)
    return null;

  return (account:string) => Pact.builder.execution(gasConfig.code)
                                         .setMeta({chainId:CHAIN, gasLimit:gasConfig.limit, gasPrice:gasConfig.price.toNumber(), senderAccount:gasConfig.payer})
                                         .setNetworkId(NETWORK)
                                         .addData("account",account)
                                         .addSigner(VIRTUAL_KEYPAIR.publicKey, (signFor) => [signFor(gasConfig.cap, account, to_pact_int(gasConfig.limit), to_pact_decimal(gasConfig.price))])
                                         .setNonce(gen_nonce)
                                         .createTransaction();
}