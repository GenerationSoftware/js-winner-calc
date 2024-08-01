# PoolTogether JS Winner Calculator

This library calculates PoolTogether V5 winners completely in JavaScript for use in NodeJS or in a browser.

## Installation

This library is installable as an NPM package using the following command:

```
npm i @generationsoftware/js-winner-calc
```

## How to Calculate Winners for a Vault

> [!Important]
> This script batches RPC queries for a given vault, so you'll need to run it for each vault that you want to check prizes for. If you are querying results for many users, it is recommended to use a private RPC endpoint to avoid public rate limits.

```js
import { computeWinners } from "@generationsoftware/js-winner-calc";

const winners = await computeWinners({
  chainId: 10,
  rpcUrl: "https://mainnet.optimism.io/",
  prizePoolAddress: "0xF35fE10ffd0a9672d0095c435fd8767A7fe29B55",
  vaultAddress: "0xa52e38a9147f5eA9E0c5547376c21c9E3F3e5e1f",
  userAddresses: ["0xe24bC6c67fEF2FFe40283c1359dCE44bd19c72C4"],
})
```

The results will look like the following, with an array of **winners** and a mapping of **prize tier** to **prize indices** for each winner:

```json
[
  {
    "user": "0xe24bC6c67fEF2FFe40283c1359dCE44bd19c72C4",
    "prizes": {
      "4": [
        11
      ],
      "5": [
        451,
        685,
        941
      ]
    }
  }
]
```

## Optional Arguments

### prizeTiers

Enables the calculation to be limited to only the listed prize tiers. Calculating wins for lower tiers only can significantly speed up the calculation. If this list is not passed to the function call, all active tiers will be computed.

> [!Note]
> There is no validation of the tier numbers provided.

#### Example:

```js
const winners = await computeWinners({
  ...,
  prizeTiers: [0,1,5]
})
```

--------------------------------------------------------------------------------

### multicallBatchSize

Set the `multicallBatchSize` argument in the input json file to limit multicall size (in bytes) for RPC calls. Different RPCs may have harsher limits than others.

#### Example:

```js
const winners = await computeWinners({
  ...,
  multicallBatchSize: 2048
})
```

--------------------------------------------------------------------------------

### blockNumber

The `blockNumber` argument can be set to run the script at a specific block number instead of the current block. Must be either a number or string that can be parsed into a `BigInt`.

#### Example:

```js
const winners = await computeWinners({
  ...,
  blockNumber: 121970626n
})
```

--------------------------------------------------------------------------------

### debug

The `debug` argument is an optional boolean. When set, some extra logs will be included to help debug issues.

#### Example:

```js
const winners = await computeWinners({
  ...,
  debug: true
})
```

## Local Development

1. clone this repo
3. run `npm i`
4. run `npm run dev`
