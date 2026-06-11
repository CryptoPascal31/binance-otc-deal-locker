import { createSignWithKeypair, type IUnsignedCommand } from "@kadena/client";
import { genKeyPair} from "@kadena/cryptography-utils";
import {ensureSignedCommand} from '@kadena/pactjs';

export const VIRTUAL_KEYPAIR = genKeyPair()

const _VIRTUAL_SIGNER = createSignWithKeypair(VIRTUAL_KEYPAIR);

export const VIRTUAL_SIGNER = (x:IUnsignedCommand) => _VIRTUAL_SIGNER(x)
                                                      .then(ensureSignedCommand)