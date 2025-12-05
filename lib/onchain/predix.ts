import { createPublicClient, createWalletClient, http, type Chain } from 'viem'
import { base, baseSepolia } from 'viem/chains'
import { privateKeyToAccount, type PrivateKeyAccount } from 'viem/accounts'

type PredixConfig = {
    managerAddress: `0x${string}`
    chainId: number
    rpcUrl: string
    chain: Chain
    account: PrivateKeyAccount
}

export function getPredixConfig(): PredixConfig {
    const managerAddress = process.env.PREDIX_MANAGER_ADDRESS as `0x${string}` | undefined
    const managerPk = process.env.PREDIX_MANAGER_PRIVATE_KEY as `0x${string}` | undefined
    const chainId = Number(process.env.PREDIX_CHAIN_ID ?? 84532)
    const rpcUrl =
        process.env.PREDIX_RPC_URL ||
        (chainId === base.id ? process.env.BASE_MAINNET_RPC_URL : process.env.BASE_SEPOLIA_RPC_URL)

    if (!managerAddress || !managerPk || !rpcUrl || Number.isNaN(chainId)) {
        const missing = []
        if (!managerAddress) missing.push('PREDIX_MANAGER_ADDRESS')
        if (!managerPk) missing.push('PREDIX_MANAGER_PRIVATE_KEY')
        if (!rpcUrl) missing.push('RPC URL (PREDIX_RPC_URL or BASE_*)')
        if (Number.isNaN(chainId)) missing.push('PREDIX_CHAIN_ID')
        const err = new Error(`Predix config missing: ${missing.join(', ')}`)
            ; (err as any).status = 500
        throw err
    }

    const baseChain = chainId === base.id ? base : chainId === baseSepolia.id ? baseSepolia : undefined
    const chain =
        baseChain ??
        ({
            id: chainId,
            name: 'custom',
            network: 'custom',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: { default: { http: [rpcUrl] }, public: { http: [rpcUrl] } },
        } as const)

    return {
        managerAddress,
        chainId,
        rpcUrl,
        chain,
        account: privateKeyToAccount(managerPk),
    }
}

export function getPredixClients() {
    const override = (globalThis as any).__predixClients
    if (override) return override

    const cfg = getPredixConfig()
    const transport = http(cfg.rpcUrl)
    const walletClient = createWalletClient({
        account: cfg.account,
        chain: cfg.chain,
        transport,
    })
    const publicClient = createPublicClient({
        chain: cfg.chain,
        transport,
    })
    return { cfg, walletClient, publicClient }
}


