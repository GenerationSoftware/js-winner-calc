import { Address, encodeAbiParameters, encodePacked, keccak256, maxUint256 } from "viem"

export const computeWinsForTier = async (
  params: {
    winningRandomNumber: bigint,
    lastAwardedDrawId: number,
    vaultAddress: Address,
    tier: number,
    tierIndices: number,
    tierOdds: bigint,
    vaultPortion: bigint,
    vaultTotalSupplyTwab: bigint
  },
  users: { address: Address, twab: bigint }[]
): Promise<{ user: Address, prizeIndex: number }[]> => {
  const wins: { user: Address, prizeIndex: number }[] = [];
  for (let i = 0; i < users.length; i++) {
    for (let prizeIndex = 0; prizeIndex < params.tierIndices; prizeIndex++) {
      const userSpecificRandomNumber = calculatePseudoRandomNumber(
        params.lastAwardedDrawId,
        params.vaultAddress,
        users[i].address,
        params.tier,
        prizeIndex,
        params.winningRandomNumber
      )
      if (isWinner(
        userSpecificRandomNumber,
        users[i].twab,
        params.vaultTotalSupplyTwab,
        params.vaultPortion,
        params.tierOdds
      )) {
        wins.push({ user: users[i].address, prizeIndex })
      }
    }
  }
  return wins;
}

const calculatePseudoRandomNumber = (
  lastAwardedDrawId: number,
  vaultAddress: Address,
  user: Address,
  tier: number,
  prizeIndex: number,
  winningRandomNumber: bigint
) => {
  return BigInt(keccak256(encodeAbiParameters(
    [
      { type: 'uint24' },
      { type: 'address' },
      { type: 'address' },
      { type: 'uint8' },
      { type: 'uint32' },
      { type: 'uint256' }
    ],
    [
      lastAwardedDrawId,
      vaultAddress,
      user,
      tier,
      prizeIndex,
      winningRandomNumber
    ]
  )))
}

const u18 = BigInt(1e18)
const calculateWinningZone = (
  userTwab: bigint,
  vaultContributionFraction: bigint,
  tierOdds: bigint
) => {
  return (((userTwab * vaultContributionFraction) / u18) * tierOdds) / u18
}

const uniform = (
  entropy: bigint,
  upperBound: bigint
) => {
  if (upperBound == 0n) throw new Error("UpperBoundGtZero")
  const min = (maxUint256 - upperBound + 1n) % upperBound
  let random = entropy
  while (random < min) {
    random = BigInt(keccak256(encodePacked(['uint256'], [random])))
  }
  return random % upperBound
}

const isWinner = (
  userSpecificRandomNumber: bigint,
  userTwab: bigint,
  vaultTwabTotalSupply: bigint,
  vaultContributionFraction: bigint,
  tierOdds: bigint
) => {
  if (vaultTwabTotalSupply == 0n) return false
  return uniform(userSpecificRandomNumber, vaultTwabTotalSupply) < calculateWinningZone(userTwab, vaultContributionFraction, tierOdds)
}