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
  const {
    lockId: lockIdBytes,
    lockPeriod,
    collection,
    tokenId,
    user,
    protocol,
  } = event.params;
  let entity = new lockId(lockIdBytes.toHexString());
  entity.depositor = user.toHexString();
  entity.protocol = protocol.toHexString();
  entity.timestamp = event.block.timestamp.toI32();
  entity.expires = lockPeriod.toI32();
  entity.status = "ACTIVE";
  if (protocol.toHexString() !== constants.ADDRESS_ZERO) {
    entity.contract = `${user.toHexString()}/${lockIdBytes.toHexString()}`;
  } else {
    entity.contract = constants.ADDRESS_ZERO;
  }
  let _lockedCollectionArray = entity.collections;
  for (let i = 0; i < collection.length; i++) {
    let _lockedCollection = loopCollections(
      collection.toHexString(),
      tokenId[i],
      lockIdBytes.toHexString()
    );
    _lockedCollectionArray.push(_lockedCollection.id);
  }
  entity.collections = _lockedCollectionArray;
  entity.save();
}

export function loopCollections(
  collection: string,
  tokens: BigInt[],
  lockIdBytes: string
): lockedCollection {
  let collectionEntity = new lockedCollection(`${lockIdBytes}/${collection}`);
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
  const { lockId: lockIdBytes } = event.params;
  let entity = lockId.load(lockIdBytes.toHexString());
  if (entity) {
    entity.status = "UNLOCKED";
    entity.save();
  }
}

export function handleTokensClaim(event: ClaimTokensEvent): void {
  const { lockId: lockIdBytes } = event.params;
  let entity = lockId.load(lockIdBytes.toHexString());
  if (entity) {
    entity.status = "LIQUIDATED";
    entity.save();
  }
}

export function handleLiquidation(event: LiquidateEvent): void {
  const { lockId: lockIdBytes } = event.params;
  let entity = lockId.load(lockIdBytes.toHexString());
  if (entity) {
    entity.status = "LIQUIDATED";
    entity.save();
  }
}
