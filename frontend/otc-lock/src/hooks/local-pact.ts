import {createClient, getHostUrl,Pact, type ChainId, type ICommand, type ICommandResult, type ITransactionDescriptor, type IUnsignedCommand} from '@kadena/client'
import useSWR from 'swr';
import useSWRImmutable from 'swr/immutable'

const LOCAL_GAS_LIMIT = 150000

const client = createClient(getHostUrl(import.meta.env.VITE_DEFAULT_NODE_ENDPOINT))

function local_check(cmd:any, options:object)
{
  return client.local(cmd, options)
        .then((resp) => { if(resp?.result?.status !== 'success')
                           {console.warn(resp); throw Error(`Error in local call:${resp?.result?.error?.message}`);}
                          else
                            return resp.result.data;});
}

export function check_res(resp:ICommandResult)
{
  if(resp?.result?.status !== 'success')
    {console.warn(resp); throw Error(`Tx error:${resp?.result?.error?.message}`);}
  else
    return resp
}

function local_pact(pact_code:string, network:string, chain:string)
{
  const cmd = Pact.builder
                  .execution(pact_code)
                  .setMeta({chainId:chain as ChainId, gasLimit:LOCAL_GAS_LIMIT})
                  .setNetworkId(network)
                  .createTransaction();
  return local_check(cmd, {signatureVerification:false, preflight:false});
}

function submit(cmd:ICommand)
{
  return client.submitOne(cmd)
}

function status(descriptor:ITransactionDescriptor)
{
  const txHash = descriptor.requestKey
  return client.pollStatus(descriptor, {timeout:300_000, interval:5_000})
               .then(x => x[txHash])
}

function spv(cmd:ICommandResult, network:string, chain:string, targetChain:string): Promise<string>
{
  return client.pollCreateSpv({requestKey:cmd.reqKey, chainId:chain as ChainId, networkId:network},
                              targetChain as ChainId,
                              {timeout:600_1000, interval:10_000})
}

export function statusChecked(cmd:any)
{
  return status(cmd).then(check_res)
}


function usePreflight(cmd:IUnsignedCommand)
{
  return useSWRImmutable(cmd?["/preflight", cmd.hash]:null,  () => local_check(cmd, {signatureVerification:false, preflight:true}), {shouldRetryOnError:false});
}

function useLocalPact(code:string|null, network:string, chain:string, options?:object)
{
  return useSWR((code && network && chain)?["/pact",code, network, chain]:null, x  => local_pact(x[1],x[2],x[3]), options );
}

function useLocalPactImmutable(code:string, network:string, chain:string)
{
  return useSWRImmutable((code && network && chain)?["/imm_pact",code, network, chain]:null, x  => local_pact(x[1],x[2],x[3]));
}

export {local_check, local_pact,  useLocalPact, useLocalPactImmutable, usePreflight, submit, status, spv}