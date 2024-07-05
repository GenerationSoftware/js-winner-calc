import { Address } from "tevm";
export type Winner = {
    user: Address;
    prizes: {
        [tier: number]: number[];
    };
};
/**
 * @notice Computes the winning picks given the following prize pool, vault, and user information.
 * @param param0 The params to run for the computation.
 * @param param0.ignoreCanaries If true, the last two tiers (canary tiers) will be ignored. This speeds up the calculation significantly.
 * @param param0.multicallBatchSize The maximum size (in bytes) for each calldata chunk.
 * @param param0.blockNumber The block number to query at (requires an RPC node that supports historical queries)
 * @param param0.debug Enable debug logs
 * @dev Example:
 * ```
 * const wins = await computeWinners({
 *   chainId: 10,
 *   rpcUrl: "https://mainnet.optimism.io/",
 *   prizePoolAddress: "0xF35fE10ffd0a9672d0095c435fd8767A7fe29B55",
 *   vaultAddress: "0xa52e38a9147f5eA9E0c5547376c21c9E3F3e5e1f",
 *   userAddresses: ["0xe24bC6c67fEF2FFe40283c1359dCE44bd19c72C4"],
 * })
 * ```
 */
export declare const computeWinners: ({ chainId, rpcUrl, prizePoolAddress, vaultAddress, userAddresses, ignoreCanaries, multicallBatchSize, blockNumber, debug }: {
    chainId: number;
    rpcUrl: string;
    prizePoolAddress: Address;
    vaultAddress: Address;
    userAddresses: Address[];
    ignoreCanaries?: boolean;
    multicallBatchSize?: number;
    blockNumber?: bigint;
    debug?: boolean;
}) => Promise<Winner[]>;
