import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import {
  mainnet,
  polygon,
  base,
  sepolia,
  type AppKitNetwork
} from '@reown/appkit/networks'

// @ts-ignore
export const projectId = import.meta.env.DEV ? "b56e18d47c72ab683b10814fe9495694" : '567a51d4d524c2409c8b66ecd21c8431' // this is a public projectId only to use on localhost

if (!projectId) {
  throw new Error('VITE_PROJECT_ID is not set')
}

export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [
  mainnet,
  polygon,
  base,
  sepolia,
]

export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId
})