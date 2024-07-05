import {computeWinners} from "./dist/index.js";

const main = async () => {
  const winners = await computeWinners({
    chainId: 10,
    rpcUrl: "https://mainnet.optimism.io/",
    prizePoolAddress: "0xF35fE10ffd0a9672d0095c435fd8767A7fe29B55",
    vaultAddress: "0x03D3CE84279cB6F54f5e6074ff0F8319d830dafe",
    userAddresses: [
      "0xaD78662714CD0042B4c602a8e18d0e4a25cF79D7",
      "0xa7329fD51B2dC832f92A1Ec5e05CC35D4d1a095e",
      "0x1A2B50BB52B322b50d3266F4Be8e43944D967e94",
      "0xf756e4368a03627EAc9B0c474c8420794f429BA1",
      "0xfB424B3c08e5D1205C66d5140781BD718f7F9860"
    ],
    blockNumber: 121970626n,
    debug: true
  });
  console.log(JSON.stringify(winners, null, '  '));
}
main()