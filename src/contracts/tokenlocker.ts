import { BigInt, log } from "@graphprotocol/graph-ts";
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
  if (event.params.protocol.toHexString() == constants.ADDRESS_ZERO) {
    entity.contract = constants.ADDRESS_ZERO;
    log.warning("user contract: {}", [constants.ADDRESS_ZERO]);
  } else {
    let contractId = `${event.params.user.toHexString()}/${event.params.lockId.toHexString()}`;
    entity.contract = contractId;
    log.warning("protocol contract: {}", [contractId]);
  }
  let _lockedCollectionArray: string[] = [];
  log.warning("collection 1: {}", [event.params.collection.toHexString()]);
  for (let i = 0; i < event.params.collection.length; i++) {
    let _lockedCollection = loopCollections(
      event.params.collection.toHexString(),
      event.params.tokenId[i],
      event.params.lockId.toHexString()
    );
    _lockedCollectionArray.push(_lockedCollection.id);
  }
  log.warning("LockedCollections: {}", [_lockedCollectionArray.toString()]);
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
  log.warning("collection 2: {}", [collection]);
  let collectionTokens = tokens.length;
  log.warning("collectionTokens: {}", [collectionTokens.toString()]);
  for (let j = 0; j < collectionTokens; j++) {
    let token = tokens[j];
    log.warning("token: {}", [token.toString()]);
    let tokenEntityId = `eth/${collection}/${token}`;
    log.warning("tokenEntityId: {}", [tokenEntityId]);
    let tokensArray = collectionEntity.tokens;
    tokensArray.push(tokenEntityId);
    log.warning("tokensArray: {}", [tokensArray.toString()]);
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
