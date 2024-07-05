// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { TierCalculationLib, SD59x18 } from "../lib/pt-v5-prize-pool/src/libraries/TierCalculationLib.sol";

struct Params {
    uint256 winningRandomNumber;
    uint24 lastAwardedDrawId;
    address vault;
    uint8 tier;
    uint8 numberOfTiers;
    uint24 grandPrizePeriod;
    SD59x18 vaultPortion;
    uint256 vaultTotalSupplyTwab;
    address[] user;
    uint256[] userTwab;
}

contract WinnerCalculator {
    event WinnerFound(address user, uint32 prizeIndex);
    function computeWins(Params memory params) public {
        uint32 numIndices = uint32(TierCalculationLib.prizeCount(params.tier));
        SD59x18 tierOdds = TierCalculationLib.getTierOdds(params.tier, params.numberOfTiers, params.grandPrizePeriod);
        for (uint256 i = 0; i < params.user.length; i++) {
            for (uint32 prizeIndex = 0; prizeIndex < numIndices; prizeIndex++) {
                uint256 userSpecificRandomNumber = TierCalculationLib.calculatePseudoRandomNumber(
                    params.lastAwardedDrawId,
                    params.vault,
                    params.user[i],
                    params.tier,
                    prizeIndex,
                    params.winningRandomNumber
                );
                if (
                    TierCalculationLib.isWinner(
                        userSpecificRandomNumber,
                        params.userTwab[i],
                        params.vaultTotalSupplyTwab,
                        params.vaultPortion,
                        tierOdds
                    )
                ) {
                    emit WinnerFound(params.user[i], prizeIndex);
                }
            }
        }
    }
}