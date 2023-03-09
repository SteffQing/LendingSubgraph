import { BigInt, store } from "@graphprotocol/graph-ts";
import { account, collection, SaleInfo, token } from "../../generated/schema";
import {
  CollectionOfferAccepted as CollectionOfferAcceptedEvent,
  CollectionOfferCreated as CollectionOfferCreatedEvent,
  CollectionOfferDeleted as CollectionOfferDeletedEvent,
  MultipleCart as MultipleCartEvent,
  OfferAccepted as OfferAcceptedEvent,
  OfferCancelled as OfferCancelledEvent,
  OfferCreated as OfferCreatedEvent,
  OfferUpdated as OfferUpdatedEvent,
} from "../../generated/Offers/Offers";
import { CollectionOffer, CollectionsTokenOffer } from "../../generated/schema";
import { constants } from "../graphprotcol-utls";
import { fetchRegistry, fetchToken } from "../utils/erc721";
import { updateOffers } from "./offersUtils";
import { updateCollectionOffers } from "./collectionofferUtils";
import { updateMulticart } from "./multicartUtils";

export function handleCollectionOfferAccepted(
  event: CollectionOfferAcceptedEvent
): void {
  let collectionAddress = event.params.collection.toHex();
  let tokenId = event.params.tokenId;
  let tokenEntityId = "kcc/"
    .concat(collectionAddress)
    .concat("/")
    .concat(tokenId.toString());
  let entity = CollectionOffer.load(
    "collectionoffer/"
      .concat(collectionAddress)
      .concat("/")
      .concat(event.params.buyer.toHexString())
  );
  let creatorEntity = account.load(event.params.buyer.toHexString());
  if (creatorEntity != null) {
    if (!creatorEntity.points) {
      creatorEntity.points = 0;
    }
    creatorEntity.points = creatorEntity.points + 20;
  }
  let sellerEntity = account.load(event.params.seller.toHexString());
  if (sellerEntity != null) {
    if (!sellerEntity.points) {
      sellerEntity.points = 0;
    }
    sellerEntity.points = sellerEntity.points + 10;
  }
  if (entity != null) {
    let saleInfoEntity = SaleInfo.load("saleinfo/".concat(tokenEntityId));
    if (saleInfoEntity != null) {
      store.remove("SaleInfo", saleInfoEntity.id);
    }
    updateCollectionOffers(event);
    entity.amount = entity.amount.minus(event.params.value);
    entity.total = entity.total.minus(constants.BIGINT_ONE);
    if (entity.total.equals(constants.BIGINT_ZERO)) {
      store.remove("CollectionOffer", entity.id);
    } else {
      entity.save();
    }
  }
}

export function handleCollectionOfferCreated(
  event: CollectionOfferCreatedEvent
): void {
  let collectionAddress = event.params.collection.toHex();
  let collectionEntity = collection.load(collectionAddress);
  if (collectionEntity == null) {
    collectionEntity = fetchRegistry(event.params.collection);
  }
  let entity = new CollectionOffer(
    "collectionoffer/"
      .concat(collectionEntity.id)
      .concat("/")
      .concat(event.params.buyer.toHexString())
  );
  let creatorEntity = account.load(event.params.buyer.toHexString());
  if (creatorEntity == null) {
    creatorEntity = new account(event.params.buyer.toHexString());
  }
  entity.creator = creatorEntity.id;
  entity.collection = collectionEntity.id;
  entity.amount = event.params.amount;
  entity.total = event.params.total;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleCollectionOfferDeleted(
  event: CollectionOfferDeletedEvent
): void {
  let collectionAddress = event.params.collection.toHex();
  let entity = CollectionOffer.load(
    "collectionoffer/"
      .concat(collectionAddress)
      .concat("/")
      .concat(event.params.buyer.toHexString())
  );
  if (entity != null) {
    store.remove("CollectionOffer", entity.id);
  }
}

export function handleMultipleCart(event: MultipleCartEvent): void {
  let collectionAddress = event.params.collections.toHex();
  let tokenId = event.params.tokenId.toString();
  let tokenEntityId = "kcc/"
    .concat(collectionAddress)
    .concat("/")
    .concat(tokenId);
  let entity = SaleInfo.load("saleinfo/".concat(tokenEntityId));
  let buyerEntity = account.load(event.params.buyer.toHexString());
  if (buyerEntity != null) {
    if (!buyerEntity.points) {
      buyerEntity.points = 0;
    }
    buyerEntity.points = buyerEntity.points + 20;
  }
  let sellerEntity = account.load(event.params.owner.toHexString());
  if (sellerEntity != null) {
    if (!sellerEntity.points) {
      sellerEntity.points = 0;
    }
    sellerEntity.points = sellerEntity.points + 10;
  }
  updateMulticart(event);
  if (entity != null) {
    store.remove("SaleInfo", entity.id);
  }
}

export function handleOfferAccepted(event: OfferAcceptedEvent): void {
  let collectionAddress = event.params.collection.toHex();
  let tokenId = event.params.tokenId.toString();
  let tokenEntityId = "kcc/"
    .concat(collectionAddress)
    .concat("/")
    .concat(tokenId);
  let id = "collectionstokenoffer/"
    .concat(tokenEntityId)
    .concat("/")
    .concat(event.params.creator.toHex());
  updateOffers(event);
  let creator = account.load(event.params.creator.toHex());
  if (creator != null) {
    if (!creator.points) {
      creator.points = 0;
    }
    creator.points = creator.points + 20;
  }
  let seller = account.load(event.params.owner.toHex());
  if (seller != null) {
    if (!seller.points) {
      seller.points = 0;
    }
    seller.points = seller.points + 10;
  }
  let entity = CollectionsTokenOffer.load(id);
  if (entity != null) {
    store.remove("CollectionsTokenOffer", id);
  }
}

export function handleOfferCancelled(event: OfferCancelledEvent): void {
  let collectionAddress = event.params.collection.toHex();
  let tokenId = event.params.tokenId.toString();
  let tokenEntityId = "kcc/"
    .concat(collectionAddress)
    .concat("/")
    .concat(tokenId);
  let id = "collectionstokenoffer/"
    .concat(tokenEntityId)
    .concat("/")
    .concat(event.params.creator.toHex());
  let entity = CollectionsTokenOffer.load(id);
  if (entity != null) {
    store.remove("CollectionsTokenOffer", id);
  }
}

export function handleOfferCreated(event: OfferCreatedEvent): void {
  let collectionEntity = collection.load(event.params.collection.toHex());
  if (collectionEntity == null) {
    collectionEntity = fetchRegistry(event.params.collection);
  }
  let tokenEntityId = "kcc/"
    .concat(collectionEntity.id)
    .concat("/")
    .concat(event.params.tokenId.toString());
  let TOKEN = token.load(tokenEntityId);
  if (TOKEN == null) {
    let timestampBigInt = BigInt.fromI32(event.block.timestamp.toI32());
    TOKEN = fetchToken(collectionEntity, event.params.tokenId, timestampBigInt);
  }
  let entityId = "collectionstokenoffer/"
    .concat(TOKEN.id)
    .concat("/")
    .concat(event.params.creator.toHex());
  let entity = new CollectionsTokenOffer(entityId);
  entity.id = entityId;
  entity.collection = collectionEntity.id;
  entity.tokenId = TOKEN.id;
  entity.creator = event.params.creator.toHex();
  entity.value = event.params.value;

  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleOfferUpdated(event: OfferUpdatedEvent): void {
  let collectionAddress = event.params.collection.toHex();
  let tokenId = event.params.tokenId.toString();
  let tokenEntityId = "kcc/"
    .concat(collectionAddress)
    .concat("/")
    .concat(tokenId);
  let id = "collectionstokenoffer/"
    .concat(tokenEntityId)
    .concat("/")
    .concat(event.params.creator.toHex());
  let entity = CollectionsTokenOffer.load(id);
  if (entity != null) {
    entity.value = event.params.value;
    entity.save();
  }
}
