// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface ITwabController {
  function getTwabBetween(
    address vault,
    address user,
    uint256 startTime,
    uint256 endTime
  ) external view returns (uint256);
}

contract TwabFetcher {
  function getAccountTwabs(address twabController, address vault, address[] calldata accounts, uint256 startTime, uint256 endTime) external view returns (uint256[] memory twabs) {
    twabs = new uint256[](accounts.length);
    bool success;
    bytes memory returnData;
    for (uint256 i = 0; i < accounts.length; i++) {
      (success, returnData) = twabController.staticcall(abi.encodeWithSelector(ITwabController.getTwabBetween.selector, vault, accounts[i], startTime, endTime));
      if (success) {
        (twabs[i]) = abi.decode(returnData, (uint256));
      }
    }
  }
}
