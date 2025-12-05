import { BridgeKit, type BridgeResult } from "@circle-fin/bridge-kit";
import { Base, BaseSepolia, Polygon, PolygonAmoy } from "@circle-fin/bridge-kit/chains";
import { createAdapterFromPrivateKey } from "@circle-fin/adapter-viem-v2";
import { createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

type BridgeEnv = "testnet" | "mainnet";

const envName = (process.env.BRIDGEKIT_ENV || "testnet").toLowerCase();
const bridgeEnv: BridgeEnv = envName === "mainnet" ? "mainnet" : "testnet";

const chains =
    bridgeEnv === "mainnet"
        ? { from: Base, to: Polygon }
        : { from: BaseSepolia, to: PolygonAmoy };

const rpcByChain: Record<string, string | undefined> = {
    [Base.chain]: process.env.BASE_RPC_URL,
    [BaseSepolia.chain]: process.env.BASE_RPC_URL,
    [Polygon.chain]: process.env.POLYGON_RPC_URL,
    [PolygonAmoy.chain]: process.env.POLYGON_RPC_URL,
};

function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required env: ${name}`);
    }
    return value;
}

function resolveRpc(chain: any) {
    const rpc = rpcByChain[chain.chain];
    if (!rpc) {
        throw new Error(`Missing RPC URL for chain ${chain.name}`);
    }
    return rpc;
}

let account: ReturnType<typeof privateKeyToAccount> | null = null;
let sourceAdapter: any = null;
let destinationAdapter: any = null;

function ensureBridgeAdapters() {
    if (account && sourceAdapter && destinationAdapter) return;

    const privateKey = requireEnv("BRIDGEKIT_BASE_PRIVATE_KEY") as `0x${string}`;
    account = privateKeyToAccount(privateKey);

    const buildAdapter = () =>
        createAdapterFromPrivateKey({
            privateKey,
            capabilities: { addressContext: "developer-controlled" },
            getPublicClient: ({ chain }) =>
                createPublicClient({
                    chain,
                    transport: http(resolveRpc(chain)),
                }),
        });

    sourceAdapter = buildAdapter();
    destinationAdapter = buildAdapter();
}

const kit = new BridgeKit();

export type BridgeInitParams = {
    amount: string;
    destinationAddress: string;
    idempotencyKey?: string;
};

export async function bridgeUsdcFromBaseToPolygon(
    params: BridgeInitParams
): Promise<BridgeResult> {
    const { amount, destinationAddress } = params;

    ensureBridgeAdapters();

    if (!account || !sourceAdapter || !destinationAdapter) {
        throw new Error("Bridge adapters not initialized");
    }

    return kit.bridge({
        from: {
            adapter: sourceAdapter,
            chain: chains.from,
            address: account.address,
        },
        to: {
            adapter: destinationAdapter,
            chain: chains.to,
            address: account.address,
            recipientAddress: destinationAddress,
        },
        amount,
        token: "USDC",
    });
}

export const bridgeChains = chains;

