import { createBaseClient, createMemoryClient, decodeEventLog, http, } from "tevm";
import { WinnerCalculator } from "../contracts/WinnerCalculator.s.sol";
import { tevmDefault, optimism } from 'tevm/common'
import { hexToBytes } from "viem";
import { Block } from '@tevm/block'
import { EMPTY_STATE_ROOT } from '@tevm/trie';
import { getBlock } from '@tevm/blockchain/dist/index.cjs';

/**
   * Keccak-256 hash of the RLP of null
   */
const KECCAK256_RLP_S = '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421'
/**
 * Keccak-256 hash of the RLP of null
 */
const KECCAK256_RLP = hexToBytes(KECCAK256_RLP_S)

export const test = async () => {
  // const customCommon = {
  //   ...tevmDefault.copy(),
  //   id: 1337
  // };
	// const genesisBlock = Block.fromBlockData(
	// 	{
  //     header: {
  //       ...customCommon.ethjsCommon.genesis(),
  //       number: 0,
  //       stateRoot: EMPTY_STATE_ROOT,
  //       gasLimit: 30_000_000_000_000n,
  //       ...(customCommon.ethjsCommon.isActivatedEIP(4895) ? { withdrawalsRoot: KECCAK256_RLP } : {}),
  //     }, ...(customCommon.ethjsCommon.isActivatedEIP(4895) ? { withdrawals: [] } : {})
  //   },
  //   {
  //     common: customCommon
  //   }
	// );
  const memoryClient = createMemoryClient();
  const vm = await memoryClient.tevm.getVm();
  const NEW_GAS_LIMIT = 2n**64n-1n;
  const latest = await vm.blockchain.getCanonicalHeadBlock();
  const newBlock = Block.fromBlockData(
    {
      ...latest,
      header: {
        ...latest.header,
        gasLimit: NEW_GAS_LIMIT,
      },
    },
    {
      common: vm.common,
      freeze: false,
      setHardfork: false,
    },
  );
  await vm.blockchain.putBlock(newBlock)

  const winnerCalc = WinnerCalculator.script().read;
  let start = performance.now();
  const scriptResult = await memoryClient.tevmContract(
    {
      ...winnerCalc.computeWins({
        winningRandomNumber: 26530114669438130968955460922440721463514287408443924397818115294892275447627n,
        lastAwardedDrawId: 19,
        vault: "0x7b0949204e7Da1B0beD6d4CCb68497F51621b574",
        tier: 9,
        numberOfTiers: 10,
        grandPrizePeriod: 91,
        vaultPortion: 83831009539233030n,
        vaultTotalSupplyTwab: 11734719059822959415n,
        user: ["0xF80A7327CED2d6Aba7246E0DE1383DDb57fd4475"],
        userTwab: [14999999999999998n]
      }),
      gas: 2n**64n-1n,
    }
  );
  console.log(scriptResult, (scriptResult.logs ?? []).map(log => decodeEventLog({
    data: log.data,
    topics: log.topics as any,
    eventName: "WinnerFound",
    abi: WinnerCalculator.abi,
    strict: true
  })));
  console.log(performance.now() - start, "ms");
}
