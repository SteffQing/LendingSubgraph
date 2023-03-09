import {
  CollectionAdded as CollectionAddedEvent,
  CollectionRemoved as CollectionRemovedEvent,
  CollectionUnverify as CollectionUnverifyEvent,
  CollectionUpdated as CollectionUpdatedEvent,
  CollectionVerify as CollectionVerifyEvent,
  ItemDelisted as ItemDelistedEvent,
  ItemListed as ItemListedEvent,
  ItemSold as ItemSoldEvent,
  ItemUpdated as ItemUpdatedEvent,
} from "../../generated/Marketplace/Marketplace";
import {
  SupportedCollection,
  SaleInfo,
  collection,
  account,
  token,
} from "../../generated/schema";
import { store, BigInt } from "@graphprotocol/graph-ts";
import { fetchRegistry, fetchToken } from "../utils/erc721";
import { updateMarketplace } from "./contractUtils";

export function handleCollectionAdded(event: CollectionAddedEvent): void {
  let collectionEntity = collection.load(event.params._collection.toHex());
  if (collectionEntity == null) {
    collectionEntity = fetchRegistry(event.params._collection);
  }
  let entity = new SupportedCollection(
    "supportedcollection/".concat(collectionEntity.id)
  );
  entity.id = "supportedcollection/".concat(collectionEntity.id);
  entity.feeCollector = event.params.feeCollector;
  entity.royaltyFees = event.params.royaltyFees;
  entity.verificationStatus = event.params.verificationStatus;
  entity.collection = collectionEntity.id;
  entity.save();
}

export function handleCollectionRemoved(event: CollectionRemovedEvent): void {
  let entity = SupportedCollection.load(
    "supportedcollection/".concat(event.params._collection.toHex())
  );
  if (entity != null) {
    store.remove("SupportedCollection", entity.id);
  }
}

export function handleCollectionUnverify(event: CollectionUnverifyEvent): void {
  let entity = SupportedCollection.load(
    "supportedcollection/".concat(event.params._collection.toHex())
  );
  if (entity != null) {
    entity.verificationStatus = event.params.verificationStatus;
    entity.save();
  }
}

export function handleCollectionUpdated(event: CollectionUpdatedEvent): void {
  let entity = SupportedCollection.load(
    "supportedcollection/".concat(event.params._collection.toHex())
  );
  if (entity != null) {
    entity.feeCollector = event.params.feeCollector;
    entity.royaltyFees = event.params.royaltyFees;
    entity.verificationStatus = event.params.verificationStatus;

    entity.save();
  }
}

export function handleCollectionVerify(event: CollectionVerifyEvent): void {
  let entity = SupportedCollection.load(
    "supportedcollection/".concat(event.params._collection.toHex())
  );
  if (entity != null) {
    entity.verificationStatus = event.params.verificationStatus;

    entity.save();
  }
}

export function handleItemDelisted(event: ItemDelistedEvent): void {
  let collectionAddress = event.params.collection.toHex();
  let tokenId = event.params.tokenId;
  let tokenEntityId = "kcc/"
    .concat(collectionAddress)
    .concat("/")
    .concat(tokenId.toString());
  let entity = SaleInfo.load("saleinfo/".concat(tokenEntityId));
  if (entity != null) {
    store.remove("SaleInfo", entity.id);
  }
}

export function handleItemListed(event: ItemListedEvent): void {
  let collectionAddress = event.params.collection.toHex();
  let tokenId = event.params.tokenId;
  let tokenEntityId = "kcc/"
    .concat(collectionAddress)
    .concat("/")
    .concat(tokenId.toString());
  let TOKEN = token.load(tokenEntityId);
  let entityId = "saleinfo/".concat(tokenEntityId);
  let entity = SaleInfo.load(entityId);
  if (TOKEN == null) {
    let collectionEntity = fetchRegistry(event.params.collection);
    if (collectionEntity != null) {
      let timestampBigInt = BigInt.fromI32(event.block.timestamp.toI32());
      fetchToken(collectionEntity, event.params.tokenId, timestampBigInt);
    }
  }
  if (entity == null) {
    entity = new SaleInfo(entityId);
  }
  entity.id = entityId;
  entity.tokenId = tokenEntityId;
  entity.collection = collectionAddress;
  entity.seller = event.params.seller.toHex();
  entity.salePrice = event.params.price;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;
  entity.approved = true;
  entity.state = "fixedSale";
  entity.save();
}

export function handleItemSold(event: ItemSoldEvent): void {
  let collectionAddress = event.params.collection.toHex();
  let tokenId = event.params.tokenId;
  let tokenEntityId = "kcc/"
    .concat(collectionAddress)
    .concat("/")
    .concat(tokenId.toString());
  let entity = SaleInfo.load("saleinfo/".concat(tokenEntityId));
  updateMarketplace(event);
  let sellerEntity = account.load(event.params.seller.toHex());
  if (sellerEntity != null) {
    if (!sellerEntity.points) {
      sellerEntity.points = 0;
    }
    sellerEntity.points = sellerEntity.points + 10;
  }
  let buyerEntity = account.load(event.params.buyer.toHex());
  if (buyerEntity != null) {
    if (!buyerEntity.points) {
      buyerEntity.points = 0;
    }
    buyerEntity.points = buyerEntity.points + 20;
  }
  if (entity != null) {
    store.remove("SaleInfo", entity.id);
  }
}

export function handleItemUpdated(event: ItemUpdatedEvent): void {
  let collectionAddress = event.params.collection.toHex();
  let tokenId = event.params.tokenId;
  let tokenEntityId = "kcc/"
    .concat(collectionAddress)
    .concat("/")
    .concat(tokenId.toString());
  let entity = SaleInfo.load("saleinfo/".concat(tokenEntityId));
  if (entity != null) {
    entity.salePrice = event.params.newPrice;
    entity.blockTimestamp = event.block.timestamp;
    entity.transactionHash = event.transaction.hash;

    entity.save();
  }
}
