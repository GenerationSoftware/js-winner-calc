import { Address, decodeEventLog, MemoryClient } from "tevm"
import { WinCalculator } from "../contracts/WinCalculator.s.sol"

export const computeWinsForTier = async (
  tevmClient: MemoryClient,
  params: {
    winningRandomNumber: bigint,
    lastAwardedDrawId: number,
    vaultAddress: Address,
    tier: number,
    tierIndices: number,
    tierOdds: bigint,
    vaultPortion: bigint,
    vaultTotalSupplyTwab: bigint,
    users: Address[],
    userTwabs: bigint[]
  }
): Promise<{ user: Address, prizeIndex: number }[]> => {
  const winCalc = WinCalculator.script().read
  const scriptResult = await tevmClient.tevmContract(
    winCalc.computeWins(params)
  )
  return (scriptResult.logs ?? []).map(log => decodeEventLog({
    data: log.data,
    topics: log.topics as any,
    eventName: "WinFound",
    abi: WinCalculator.abi,
    strict: true
  })).map(log => log.args)
}