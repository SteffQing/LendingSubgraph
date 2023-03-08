import { Bytes } from "@graphprotocol/graph-ts";
import { Address } from "@graphprotocol/graph-ts";
import { BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";

import { ERC20Abi } from "../generated/WETH/ERC20Abi";

import { currency, transaction } from "../generated/schema";

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
}

export namespace transactions {
  export function log(event: ethereum.Event): transaction {
    let tx = transaction.load(event.transaction.hash.toHexString());
    if (!tx) {
      tx = new transaction(event.transaction.hash.toHexString());
      tx.timestamp = event.block.timestamp.toI32();
      tx.blockNumber = event.block.number.toI32();
      tx.unmatchedTransferCount = 0;
      tx.gasPrice = event.transaction.gasPrice;
      tx.transactionFrom = event.transaction.from;
      tx.transfers = new Array<string>();
      tx.save();
    }

    return tx as transaction;
  }
  export type Tx = transaction;
}

export namespace ERC20Contracts {
  export function getERC20(address: Address): void {
    let currencyEntity = currency.load(address.toHexString());

    //if currency does not exists attempt to load Abi (on failure assume ETH)
    if (
      !currencyEntity &&
      address == Address.fromString(constants.ADDRESS_ZERO)
    ) {
      let AbiVar = ERC20Abi.bind(address);
      let try_name = AbiVar.try_name();
      let try_symbol = AbiVar.try_symbol();
      let try_deicmals = AbiVar.try_decimals();

      currencyEntity = new currency(address.toHexString());
      currencyEntity.name = try_name.reverted
        ? "KuCoin Shares"
        : try_name.value;
      currencyEntity.symbol = try_symbol.reverted ? "MATIC" : try_symbol.value;
      currencyEntity.decimals = try_deicmals.reverted ? 18 : try_deicmals.value;
      currencyEntity.save();
    }

    if (
      !currencyEntity &&
      address != Address.fromString(constants.ADDRESS_ZERO)
    ) {
      let AbiVar = ERC20Abi.bind(address);
      let try_name = AbiVar.try_name();
      let try_symbol = AbiVar.try_symbol();
      let try_deicmals = AbiVar.try_decimals();

      currencyEntity = new currency(address.toHexString());
      currencyEntity.name = try_name.reverted ? "Wrapped KCS" : try_name.value;
      currencyEntity.symbol = try_symbol.reverted ? "WETH" : try_symbol.value;
      currencyEntity.decimals = try_deicmals.reverted ? 18 : try_deicmals.value;
      currencyEntity.save();
    }
  }
}