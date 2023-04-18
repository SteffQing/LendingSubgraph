import { BigInt } from "@graphprotocol/graph-ts";
import {
  Deposit as DepositEvent,
  Withdraw as WithdrawEvent,
  ClaimTokens as ClaimTokensEvent,
  Liquidate as LiquidateEvent,
} from "../../generated/TokenLocker/TokenLocker";
import { lockId, lockedCollection } from "../../generated/schema";
import { constants } from "../graphprotcol-utls";

export function handleDeposit(event: DepositEvent): void {
  let entity = new lockId(event.params.lockId.toHexString());
  entity.depositor = event.params.user.toHexString();
  entity.protocol = event.params.protocol.toHexString();
  entity.timestamp = event.block.timestamp.toI32();
  entity.expires = event.params.lockPeriod.toI32();
  entity.status = "ACTIVE";
  if (event.params.protocol.toHexString() !== constants.ADDRESS_ZERO) {
    entity.contract = `${event.params.user.toHexString()}/${event.params.lockId.toHexString()}`;
  } else {
    entity.contract = constants.ADDRESS_ZERO;
  }
  let _lockedCollectionArray: string[] = [];
  for (let i = 0; i < event.params.collection.length; i++) {
    let _lockedCollection = loopCollections(
      event.params.collection.toHexString(),
      event.params.tokenId[i],
      event.params.lockId.toHexString()
    );
    _lockedCollectionArray.push(_lockedCollection.id);
  }
  entity.collections = _lockedCollectionArray;
  entity.save();
}

export function loopCollections(
  collection: string,
  tokens: BigInt[],
  lockId: string
): lockedCollection {
  let collectionEntity = new lockedCollection(`${lockId}/${collection}`);
  collectionEntity.collection = collection;
  let collectionTokens = tokens.length;
  for (let j = 0; j < collectionTokens; j++) {
    let token = tokens[j];
    let tokenEntityId = `eth/${collection}/${token}`;
    let tokensArray = collectionEntity.tokens;
    tokensArray.push(tokenEntityId);
    collectionEntity.tokens = tokensArray;
  }
  collectionEntity.save();
  return collectionEntity as lockedCollection;
}

export function handleWithdrawal(event: WithdrawEvent): void {
  let entity = lockId.load(event.params.lockId.toHexString());
  if (entity) {
    entity.status = "UNLOCKED";
    entity.save();
  }
}

export function handleTokensClaim(event: ClaimTokensEvent): void {
  let entity = lockId.load(event.params.lockId.toHexString());
  if (entity) {
    entity.status = "LIQUIDATED";
    entity.save();
  }
}

export function handleLiquidation(event: LiquidateEvent): void {
  let entity = lockId.load(event.params.lockId.toHexString());
  if (entity) {
    entity.status = "LIQUIDATED";
    entity.save();
  }
}
