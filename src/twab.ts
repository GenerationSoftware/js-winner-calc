import { twabControllerABI } from "./abi/twabController.js"
import type { Address, PublicClient } from "viem"

export const getTwabs = async (
  client: PublicClient,
  twabControllerAddress: Address,
  vaultAddress: Address,
  userAddresses: Address[],
  timestamps: { start: number, end: number },
  options?: { blockNumber?: bigint, multicallAddress?: Address, debug?: boolean }
) => {
  const userTwabs: { address: Address, twab: bigint }[] = []

  const multicallResults = await client.multicall({
    contracts: [
      {
        address: twabControllerAddress,
        abi: twabControllerABI,
        functionName: 'getTotalSupplyTwabBetween',
        args: [vaultAddress, BigInt(timestamps.start), BigInt(timestamps.end)]
      },
      ...userAddresses.map(userAddress => ({
        address: twabControllerAddress,
        abi: twabControllerABI,
        functionName: 'getTwabBetween',
        args: [vaultAddress, userAddress, BigInt(timestamps.start), BigInt(timestamps.end)]
      }))
    ],
    blockNumber: options?.blockNumber,
    multicallAddress: options?.multicallAddress
  })

  if(multicallResults[0].status === 'failure') {
    if (options?.debug) {
      console.error(multicallResults[0].error);
    }
    throw new Error(`Could not query vault twab for ${vaultAddress}.`)
  }

  const vaultTotalSupplyTwab = multicallResults[0].result as bigint

  multicallResults.slice(1).forEach((result, i) => {
    if(result.status === 'success') {
      userTwabs.push({ address: userAddresses[i], twab: result.result as bigint })
    }
  })

  return { vaultTotalSupplyTwab, userTwabs }
}
