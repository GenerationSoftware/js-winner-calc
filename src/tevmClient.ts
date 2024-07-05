import { createMemoryClient } from "tevm"
import { Block } from '@tevm/block'

export const createTevmClient = async () => {
  const memoryClient = createMemoryClient()
  const vm = await memoryClient.tevm.getVm()
  const NEW_GAS_LIMIT = 2n**64n-1n
  const latest = await vm.blockchain.getCanonicalHeadBlock()
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
  )
  await vm.blockchain.putBlock(newBlock)
  return memoryClient
}