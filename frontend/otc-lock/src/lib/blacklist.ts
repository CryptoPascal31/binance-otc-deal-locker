import {hash} from '@kadena/cryptography-utils'

const BLACKLIST = ["PLACEHOLDER"]

export const is_blacklisted = (x:string) => BLACKLIST.includes(hash(x + "BL"))
