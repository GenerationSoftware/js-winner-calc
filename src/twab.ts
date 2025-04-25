import { twabControllerABI } from "./abi/twabController.js"
import { decodeFunctionResult, encodeFunctionData, parseAbi, type Address, type PublicClient } from "viem"

const twabFetcherBytecode = '0x60806040526004361015610011575f80fd5b5f3560e01c63be366f4614610024575f80fd5b346101c25760a03660031901126101c2576004356001600160a01b03811681036101c2576024356001600160a01b03811691908290036101c257604435916001600160401b0383116101c257366023840112156101c2576004830135916001600160401b0383116101c2573660248460051b860101116101c257606435608435916100ae85610249565b936100bc6040519586610226565b8585526100c886610249565b6020860190601f19013682375f5b878110156101e257600581901b9060248a830101356001600160a01b038116908190036101c2575f80916040516020810191635d9abccd60e11b835288602483015260448201528960648201528a60848201526084815261013860a482610226565b5190885afa3d156101da573d906001600160401b0382116101c6576040519161016b601f8201601f191660200184610226565b82523d5f602084013e5b610185575b5060019150016100d6565b6020818051810103126101c2576020015188518210156101ae5760206001938a0101525f61017a565b634e487b7160e01b5f52603260045260245ffd5b5f80fd5b634e487b7160e01b5f52604160045260245ffd5b606090610175565b8187604051918291602083019060208452518091526040830191905f5b81811061020d575050500390f35b82518452859450602093840193909201916001016101ff565b601f909101601f19168101906001600160401b038211908210176101c657604052565b6001600160401b0381116101c65760051b6020019056fea264697066735822122080fc564340b12e73f3588bb25bb584d2060779d270344f84bf4ffce0b9358bc664736f6c634300081c0033'
const twabFetcherAbi = parseAbi([
  "function getAccountTwabs(address twabController, address vault, address[] calldata accounts, uint256 startTime, uint256 endTime) external view returns (uint256[] memory twabs)"
])
const twabFetcherOverrideAddress = '0x1000000000000000000000000000000000000000'

export const getTwabs = async (
  client: PublicClient,
  twabControllerAddress: Address,
  vaultAddress: Address,
  userAddresses: Address[],
  timestamps: { start: number, end: number },
  options?: { blockNumber?: bigint, accountTwabBatchSize?: number, debug?: boolean }
) => {
  const batchSize = options?.accountTwabBatchSize ?? 1024
  const userTwabs: { address: Address, twab: bigint }[] = []

  const vaultTotalSupplyTwab = await client.readContract({
    address: twabControllerAddress,
    abi: twabControllerABI,
    functionName: 'getTotalSupplyTwabBetween',
    args: [vaultAddress, BigInt(timestamps.start), BigInt(timestamps.end)]
  })

  for (let i = 0; i < userAddresses.length; i+= batchSize) {
    const accounts = userAddresses.slice(i, i + batchSize)
    if (accounts.length > 0) {
      if (options?.debug) {
        console.log(`Fetching TWAB info for: ${JSON.stringify({
          twabControllerAddress, 
          vaultAddress,
          startTime: timestamps.start,
          endTime: timestamps.end,
          numAccounts: accounts.length,
          blockNumber: options?.blockNumber
        })}`)
      }
      const res = await client.call({
        to: twabFetcherOverrideAddress,
        data: encodeFunctionData({
          abi: twabFetcherAbi,
          functionName: "getAccountTwabs",
          args: [twabControllerAddress, vaultAddress, accounts, BigInt(timestamps.start), BigInt(timestamps.end)]
        }),
        stateOverride: [{
          address: twabFetcherOverrideAddress,
          code: twabFetcherBytecode
        }],
        blockNumber: options?.blockNumber
      })
      if (res.data) {
        const twabs = decodeFunctionResult({
          abi: twabFetcherAbi,
          data: res.data
        })
        userTwabs.push(...twabs.map((twab, i) => ({
          address: accounts[i],
          twab
        })))
      } else {
        if (options?.debug) {
          console.error(res)
        }
        throw new Error(`Failed to fetch twab history...`)
      }
    }
  }

  return { vaultTotalSupplyTwab, userTwabs }
}
