import { Address } from "@graphprotocol/graph-ts";
import { BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";

import { transaction } from "../generated/schema";

export namespace events {
  export function id(event: ethereum.Event): string {
    return event.block.number
      .toString()
      .concat("-")
      .concat(event.logIndex.toString());
  }
}

export namespace constants {
  export let BIGINT_ZERO = BigInt.fromI32(0);
  export let BIGINT_ONE = BigInt.fromI32(1);
  export let BIGDECIMAL_ZERO = new BigDecimal(constants.BIGINT_ZERO);
  export let BIGDECIMAL_ONE = new BigDecimal(constants.BIGINT_ONE);
  export const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";
  export const BYTES32_ZERO =
    "0x0000000000000000000000000000000000000000000000000000000000000000";
  export const WETH = "0x69567cffe9918dbef4cd24b30fddce4c13389dcf";
  export const Main = "0x9628c124241d55a27e0a6a29ddd7f42df629b6d9";
  export const TokenLocker = "0x7349153dff33f393b619236e1bf63edd5e22a553";
  export const P2P = "0xd5a4d38578bf1ac82535752028c20a985f206a6f";
}

export namespace transactions {
  export function log(event: ethereum.Event): transaction {
    let tx = transaction.load(event.transaction.hash.toHexString());
    if (!tx) {
      tx = new transaction(event.transaction.hash.toHexString());
      tx.timestamp = event.block.timestamp.toI32();
      tx.blockNumber = event.block.number.toI32();
      tx.gasPrice = event.transaction.gasPrice;
      tx.transactionFrom = event.transaction.from;
      tx.transfers = new Array<string>();
      tx.save();
    }

    return tx as transaction;
  }
  export type Tx = transaction;
}
