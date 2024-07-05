// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { TierCalculationLib, SD59x18 } from "../lib/pt-v5-prize-pool/src/libraries/TierCalculationLib.sol";

struct Params {
    uint256 winningRandomNumber;
    uint24 lastAwardedDrawId;
    address vaultAddress;
    uint8 tier;
    uint32 tierIndices;
    SD59x18 tierOdds;
    SD59x18 vaultPortion;
    uint256 vaultTotalSupplyTwab;
    address[] users;
    uint256[] userTwabs;
}

contract WinCalculator {
    event WinFound(address user, uint32 prizeIndex);
    function computeWins(Params memory params) public {
        for (uint256 i = 0; i < params.users.length; i++) {
            for (uint32 prizeIndex = 0; prizeIndex < params.tierIndices; prizeIndex++) {
                uint256 userSpecificRandomNumber = TierCalculationLib.calculatePseudoRandomNumber(
                    params.lastAwardedDrawId,
                    params.vaultAddress,
                    params.users[i],
                    params.tier,
                    prizeIndex,
                    params.winningRandomNumber
                );
                if (
                    TierCalculationLib.isWinner(
                        userSpecificRandomNumber,
                        params.userTwabs[i],
                        params.vaultTotalSupplyTwab,
                        params.vaultPortion,
                        params.tierOdds
                    )
                ) {
                    emit WinFound(params.users[i], prizeIndex);
                }
            }
        }
    }
}