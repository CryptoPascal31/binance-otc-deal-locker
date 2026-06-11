import {Decimal} from 'decimal.js';
import {base64UrlEncodeArr, hash} from '@kadena/cryptography-utils'


/* Generic types Adapters */
export const to_int = (x:any) =>Number(x.int)
export const to_decimal = (v:any) => v?(v.decimal?Decimal(v.decimal):Decimal(v)):Decimal(0)
export const to_date = (x:any) => x.time?new Date(x.time):new Date(x.timep)

export const to_pact_int = (x:Number) => ({int:x.toString()})
export const to_pact_decimal = (x:Decimal) => ({decimal:x.toFixed(12)})
export const to_pact_date = (x:Date) => ({"timep":x.toISOString()})
export const to_module = ({refName:{namespace, name}}:any) => namespace?[namespace,name].join("."):name

/* Nonce Generator */
export function gen_nonce():string
{
  const rnd = new Uint8Array(16);
  crypto.getRandomValues(rnd);
  return "otc-unlocker-frontend:"+base64UrlEncodeArr(rnd);
}

/* Principal generators */
export const _mkCapGuarPrincipal = (data: string[]) => "c:"+hash(data.join(""))
export const mkCap = (mod:string, cap:string) => [mod, cap].join(".")
export const _encodeStr = (x: string) => JSON.stringify(x)
export const mkCapGuarPrincipal = (mod:string, cap:string, args: string[]) => _mkCapGuarPrincipal(Array(mkCap(mod, cap)).concat(args.map(_encodeStr)))
