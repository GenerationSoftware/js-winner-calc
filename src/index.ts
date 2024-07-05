import { Address} from "tevm";
import { createTevmClient } from "./tevmClient";
import { getClient } from "./client"
import { getPrizePoolInfo, getTierInfo, getVaultPortion } from "./prizePool"
import { getTwabs } from "./twab"
import { computeWinsForTier } from "./winCalculator";

export type Winner = { user: Address, prizes: { [tier: number]: number[] } };

/**
 * @notice Computes the winning picks given the following prize pool, vault, and user information.
 * @param param0 The params to run for the computation.
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
export const computeWinners = async ({
  chainId,
  rpcUrl,
  prizePoolAddress,
  vaultAddress,
  userAddresses,
  multicallBatchSize,
  blockNumber,
  debug
}: {
  chainId: number,
  rpcUrl: string,
  prizePoolAddress: Address,
  vaultAddress: Address,
  userAddresses: Address[],
  multicallBatchSize?: number,
  blockNumber?: bigint,
  debug?: boolean
}): Promise<Winner[]> => {
  if (debug) {
    process.env.TWC_DEBUG = "true";
  }

  const cachedTwabs: { [startTimestamp: number]: ReturnType<typeof getTwabs> } = {}
  const client = getClient(chainId, rpcUrl, { multicallBatchSize })
  const tevmClient = await createTevmClient()
  const prizePoolInfo = await getPrizePoolInfo(client, prizePoolAddress, { blockNumber })
  const tierInfo = await getTierInfo(client, prizePoolAddress, prizePoolInfo.numTiers, prizePoolInfo.lastAwardedDrawId, { blockNumber })
  const winnerMap = new Map<Address, Winner>()

  await Promise.all(Object.keys(tierInfo).map(async (_tier) => {
    const tier = parseInt(_tier)
    const vaultPortion = await getVaultPortion(client, prizePoolAddress, vaultAddress, { start: tierInfo[tier].startTwabDrawId, end: prizePoolInfo.lastAwardedDrawId })
    const startTwabTimestamp = tierInfo[tier].startTwabTimestamp
    if(cachedTwabs[startTwabTimestamp] === undefined) {
      cachedTwabs[startTwabTimestamp] = getTwabs(
        client,
        prizePoolInfo.twabControllerAddress,
        vaultAddress,
        userAddresses,
        { start: startTwabTimestamp, end: prizePoolInfo.lastAwardedDrawClosedAt },
        { blockNumber }
      )
    }
    const { vaultTotalSupplyTwab, userTwabs } = await cachedTwabs[startTwabTimestamp]
    const chunkSize = Math.min(10_000, Math.ceil(1_000_000 / tierInfo[tier].indices)) // varies between 1-10000 based on prize count
    const userChunks: (typeof userTwabs)[] = []
    for (let chunk = 0; userChunks.length < Math.ceil(userTwabs.length / chunkSize); chunk++) {
      userChunks.push(
        userTwabs.slice(
          chunk * chunkSize,
          Math.min((chunk + 1) * chunkSize, userTwabs.length)
        )
      )
    }
    for (const userChunk of userChunks) {
      const chunkWins = await computeWinsForTier(tevmClient, {
        winningRandomNumber: prizePoolInfo.randomNumber,
        lastAwardedDrawId: prizePoolInfo.lastAwardedDrawId,
        vaultAddress,
        tier,
        tierIndices: tierInfo[tier].indices,
        tierOdds: tierInfo[tier].odds,
        vaultPortion,
        vaultTotalSupplyTwab,
        users: userChunk.map(user => user.address),
        userTwabs: userChunk.map(user => user.twab)
      })
      for (const win of chunkWins) {
        if(!winnerMap.has(win.user)) {
          winnerMap.set(win.user, { user: win.user, prizes: {} })
        }
        const userData = winnerMap.get(win.user) as Winner
        if(!userData.prizes[tier]) { userData.prizes[tier] = [] }
        userData.prizes[tier].push(win.prizeIndex)
      }
    }
  }))

  return [...winnerMap.values()];
}
