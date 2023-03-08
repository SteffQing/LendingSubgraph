import { BigInt, store } from "@graphprotocol/graph-ts";
import { account, collection, SaleInfo } from "../../generated/schema";
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
import {
  CollectionOffers,
  CollectionsTokenOffers,
} from "../../generated/schema";
import { constants } from "../graphprotcol-utls";
import { fetchRegistry, fetchToken } from "../utils/erc721";
import { updateOffers } from "./offersUtils";
import { updateCollectionOffers } from "./collectionofferUtils";
import { updateMulticart } from "./multicartUtils";

export function handleCollectionOfferAccepted(
  event: CollectionOfferAcceptedEvent
): void {
  let collectionEntity = fetchRegistry(event.params.collection);
  if (collectionEntity != null) {
    let timestampBigInt = BigInt.fromI32(event.block.timestamp.toI32());
    let tokenEntity = fetchToken(
      collectionEntity,
      event.params.tokenId,
      timestampBigInt
    );
    let entity = CollectionOffers.load(
      "collectionoffers/"
        .concat(collectionEntity.id)
        .concat("/")
        .concat(event.params.buyer.toHexString())
    );
    let creatorEntity = account.load(event.params.buyer.toHexString());
    if (creatorEntity != null) {
      creatorEntity.points = creatorEntity.points + 20;
    }
    let sellerEntity = account.load(event.params.seller.toHexString());
    if (sellerEntity != null) {
      sellerEntity.points = sellerEntity.points + 10;
    }
    if (entity != null) {
      let saleInfoEntity = SaleInfo.load("saleinfo/".concat(tokenEntity.id));
      if (saleInfoEntity != null) {
        store.remove("SaleInfo", saleInfoEntity.id);
      }
      updateCollectionOffers(event);
      entity.amount = entity.amount.minus(event.params.value);
      entity.total = entity.total.minus(constants.BIGINT_ONE);
      if (entity.total.equals(constants.BIGINT_ZERO)) {
        store.remove("CollectionOffers", entity.id);
      } else {
        entity.save();
      }
    }
  }
}

export function handleCollectionOfferCreated(
  event: CollectionOfferCreatedEvent
): void {
  let collectionEntity = fetchRegistry(event.params.collection);
  if (collectionEntity != null) {
    let entity = new CollectionOffers(
      "collectionoffers/"
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
}

export function handleCollectionOfferDeleted(
  event: CollectionOfferDeletedEvent
): void {
  let collectionEntity = fetchRegistry(event.params.collection);
  if (collectionEntity != null) {
    let entity = CollectionOffers.load(
      "collectionoffers/"
        .concat(collectionEntity.id)
        .concat("/")
        .concat(event.params.buyer.toHexString())
    );
    if (entity != null) {
      store.remove("CollectionOffers", entity.id);
    }
  }
}

export function handleMultipleCart(event: MultipleCartEvent): void {
  let collectionEntity = collection.load(event.params.collections.toHex());
  if (collectionEntity != null) {
    let timestampBigInt = BigInt.fromI32(event.block.timestamp.toI32());
    let tokenEntity = fetchToken(
      collectionEntity,
      event.params.tokenId,
      timestampBigInt
    );
    let entity = SaleInfo.load("saleinfo/".concat(tokenEntity.id));
    let buyerEntity = account.load(event.params.buyer.toHexString());
    if (buyerEntity != null) {
      buyerEntity.points = buyerEntity.points + 20;
    }
    let sellerEntity = account.load(event.params.owner.toHexString());
    if (sellerEntity != null) {
      sellerEntity.points = sellerEntity.points + 10;
    }
    updateMulticart(event);
    if (entity != null) {
      store.remove("SaleInfo", entity.id);
    }
  }
}

export function handleOfferAccepted(event: OfferAcceptedEvent): void {
  let collectionEntity = collection.load(event.params.collection.toHex());
  if (collectionEntity != null) {
    let timestampBigInt = BigInt.fromI32(event.block.timestamp.toI32());
    let tokenEntity = fetchToken(
      collectionEntity,
      event.params.tokenId,
      timestampBigInt
    );
    let id = "collectiontokensoffers/"
      .concat(tokenEntity.id)
      .concat("/")
      .concat(event.params.creator.toHex());
    updateOffers(event);
    let creator = account.load(event.params.creator.toHex());
    if (creator != null) {
      creator.points = creator.points + 20;
    }
    let seller = account.load(event.params.owner.toHex());
    if (seller != null) {
      seller.points = seller.points + 10;
    }
    let entity = CollectionsTokenOffers.load(id);
    if (entity != null) {
      store.remove("CollectionsTokenOffers", id);
    }
  }
}

export function handleOfferCancelled(event: OfferCancelledEvent): void {
  let collectionEntity = collection.load(event.params.collection.toHex());
  if (collectionEntity != null) {
    let timestampBigInt = BigInt.fromI32(event.block.timestamp.toI32());
    let tokenEntity = fetchToken(
      collectionEntity,
      event.params.tokenId,
      timestampBigInt
    );
    let id = "collectiontokensoffers/"
      .concat(tokenEntity.id)
      .concat("/")
      .concat(event.params.creator.toHex());
    let entity = CollectionsTokenOffers.load(id);
    if (entity != null) {
      store.remove("CollectionsTokenOffers", id);
    }
  }
}

export function handleOfferCreated(event: OfferCreatedEvent): void {
  let collectionEntity = collection.load(event.params.collection.toHex());
  if (collectionEntity != null) {
    let timestampBigInt = BigInt.fromI32(event.block.timestamp.toI32());
    let tokenEntity = fetchToken(
      collectionEntity,
      event.params.tokenId,
      timestampBigInt
    );
    let entityId = "collectiontokensoffers/"
      .concat(tokenEntity.id)
      .concat("/")
      .concat(event.params.creator.toHex());
    let entity = new CollectionsTokenOffers(entityId);
    entity.id = entityId;
    entity.collection = collectionEntity.id;
    entity.tokenId = tokenEntity.id;
    entity.creator = event.params.creator.toHex();
    entity.value = event.params.value;

    entity.blockTimestamp = event.block.timestamp;
    entity.transactionHash = event.transaction.hash;

    entity.save();
  }
}

export function handleOfferUpdated(event: OfferUpdatedEvent): void {
  let collectionEntity = collection.load(event.params.collection.toHex());
  if (collectionEntity != null) {
    let timestampBigInt = BigInt.fromI32(event.block.timestamp.toI32());
    let tokenEntity = fetchToken(
      collectionEntity,
      event.params.tokenId,
      timestampBigInt
    );
    let id = "collectiontokensoffers/"
      .concat(tokenEntity.id)
      .concat("/")
      .concat(event.params.creator.toHex());
    let entity = CollectionsTokenOffers.load(id);
    if (entity != null) {
      entity.value = event.params.value;
      entity.save();
    }
  }
}
