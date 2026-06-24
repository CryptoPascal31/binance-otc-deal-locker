import {hash} from '@kadena/cryptography-utils'

const BLACKLIST = ["-c0TGdp5FNrrb_v8Xqlz5k5S7IacdStPJIa446uJosA"]

export const is_blacklisted = (x:string) => BLACKLIST.includes(hash(x + "BL"))
