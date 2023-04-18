import { BigInt, store } from "@graphprotocol/graph-ts";
import {
  CollectionAdded as CollectionAddedEvent,
  CollectionRemoved as CollectionRemovedEvent,
  ProtocolCreated as ProtocolCreatedEvent,
} from "../../generated/MainContract/Main";
import { SupportedCollection, Protocol } from "../../generated/schema";
import { constants } from "../graphprotcol-utls";

export function handleCollectionAddition(event: CollectionAddedEvent): void {
  let collectionAddress = event.params._collection;
  let address = collectionAddress.toHexString();
  let entity = new SupportedCollection("nftLending/".concat(address));
  entity.collection = address;
  entity.save();
}
export function handleCollectionRemoval(event: CollectionRemovedEvent): void {
  let collectionAddress = event.params._collection;
  let address = collectionAddress.toHexString();
  let entity = SupportedCollection.load("nftLending/".concat(address));
  if (entity) {
    store.remove("SupportedCollection", entity.id);
  }
}
export function handleProtocolCreation(event: ProtocolCreatedEvent): void {
  const { name, protocol, securityFee, protocolFee } = event.params;
  let entity = new Protocol(protocol.toHexString());
  entity.name = name;
  entity.protocolFee = protocolFee;
  entity.securityFee = securityFee;
  entity.totalBorrows = constants.BIGINT_ZERO;
  entity.totalPaidInterest = constants.BIGINT_ZERO;
}

export function updateProtocol(
  protocol: string,
  borrow: BigInt,
  interest: BigInt
): void {
  let entity = Protocol.load(protocol);
  if (entity) {
    entity.totalBorrows = entity.totalBorrows.plus(borrow);
    entity.totalPaidInterest = entity.totalPaidInterest.plus(interest);
    entity.save();
  }
}

export function updateProtocolParameters(
  protocol: string,
  securityFee: number,
  protocolFee: number
): void {
  let entity = Protocol.load(protocol);
  if (entity) {
    entity.securityFee = securityFee;
    entity.protocolFee = protocolFee;
    entity.save();
  }
}
