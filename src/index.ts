import { Address} from "viem";
import { getClient } from "./client.js"
import { getPrizePoolInfo, getTierInfo, getVaultPortion } from "./prizePool.js"
import { getTwabs } from "./twab.js"
import { computeWinsForTier } from "./winCalculator.js";

export type Winner = { user: Address, prizes: { [tier: number]: number[] } };

const NUM_CANARY_TIERS = 2;

/**
 * @notice Computes the winning picks given the following prize pool, vault, and user information.
 * @param chainId The chain ID of the network
 * @param rpcUrl The RPC URL to use to query onchain information
 * @param prizePoolAddress The prize pool to compute winners for
 * @param vaultAddress The vault to compute winners for
 * @param userAddresses The users that may be eligible for prizes
 * @param ignoreCanaries If true, the last two tiers (canary tiers) will be ignored. This speeds up the calculation significantly.
 * @param multicallBatchSize The maximum size (in bytes) for each calldata chunk.
 * @param blockNumber The block number to query at (requires an RPC node that supports historical queries)
 * @param debug Enable debug logs
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
export const computeWinners = async ({
  chainId,
  rpcUrl,
  prizePoolAddress,
  vaultAddress,
  userAddresses,
  ignoreCanaries,
  multicallBatchSize,
  blockNumber,
  debug
}: {
  chainId: number,
  rpcUrl: string,
  prizePoolAddress: Address,
  vaultAddress: Address,
  userAddresses: Address[],
  ignoreCanaries?: boolean,
  multicallBatchSize?: number,
  blockNumber?: bigint,
  debug?: boolean
}): Promise<Winner[]> => {
  const cachedTwabs: { [startTimestamp: number]: ReturnType<typeof getTwabs> } = {}
  const client = getClient(chainId, rpcUrl, { multicallBatchSize })
  const prizePoolInfo = await getPrizePoolInfo(client, prizePoolAddress, { blockNumber })
  const tierInfo = await getTierInfo(client, prizePoolAddress, prizePoolInfo.numTiers, prizePoolInfo.lastAwardedDrawId, { blockNumber })
  const winnerMap = new Map<Address, Winner>()

  await Promise.all(Object.keys(tierInfo).map(async (_tier) => {
    const tier = parseInt(_tier)
    if (!ignoreCanaries || tier < prizePoolInfo.numTiers - NUM_CANARY_TIERS) {
      const vaultPortion = await getVaultPortion(client, prizePoolAddress, vaultAddress, { start: tierInfo[tier].startTwabDrawId, end: prizePoolInfo.lastAwardedDrawId })
      const startTwabTimestamp = tierInfo[tier].startTwabTimestamp
      if(cachedTwabs[startTwabTimestamp] === undefined) {
        cachedTwabs[startTwabTimestamp] = getTwabs(
          client,
          prizePoolInfo.twabControllerAddress,
          vaultAddress,
          userAddresses,
          { start: startTwabTimestamp, end: prizePoolInfo.lastAwardedDrawClosedAt },
          { blockNumber, debug }
        )
      }
      const { vaultTotalSupplyTwab, userTwabs } = await cachedTwabs[startTwabTimestamp]
      const debugInfo = JSON.stringify({ tier, numUsers: userTwabs.length, prizePoolAddress, vaultAddress, chainId })
      console.log(`Computing wins for: ${debugInfo}`)
      const startTime = Date.now();
      const chunkWins = await computeWinsForTier(
        {
          winningRandomNumber: prizePoolInfo.randomNumber,
          lastAwardedDrawId: prizePoolInfo.lastAwardedDrawId,
          vaultAddress,
          tier,
          tierIndices: tierInfo[tier].indices,
          tierOdds: tierInfo[tier].odds,
          vaultPortion,
          vaultTotalSupplyTwab
        },
        userTwabs
      )
      for (const win of chunkWins) {
        if(!winnerMap.has(win.user)) {
          winnerMap.set(win.user, { user: win.user, prizes: {} })
        }
        const userData = winnerMap.get(win.user) as Winner
        if(!userData.prizes[tier]) { userData.prizes[tier] = [] }
        userData.prizes[tier].push(win.prizeIndex)
      }
      console.log(`(${Date.now() - startTime} ms) Finished computing wins for: ${debugInfo}`)
    }
  }))

  return [...winnerMap.values()];
}
