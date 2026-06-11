import type { ChainId } from "@kadena/client"

export const NETWORK=import.meta.env.VITE_NETWORK
export const EXPLORER=import.meta.env.VITE_EXPLORER
export const CHAIN=import.meta.env.VITE_CHAIN_ID as ChainId