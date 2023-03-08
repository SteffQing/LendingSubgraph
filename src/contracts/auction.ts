import { BigInt, store } from "@graphprotocol/graph-ts";
import {
  AuctionCancelled as AuctionCancelledEvent,
  AuctionStarted as AuctionStartedEvent,
  BidAccepted as BidAcceptedEvent,
  BidCreated as BidCreatedEvent,
} from "../../generated/Auction/Auction";
import { account, collection, SaleInfo } from "../../generated/schema";
import { fetchToken } from "../utils/erc721";
import { updateAuction } from "./auctionUtils";

export function handleAuctionCancelled(event: AuctionCancelledEvent): void {
  let collectionEntity = collection.load(event.params.collection.toHex());
  if (collectionEntity != null) {
    let timestampBigInt = BigInt.fromI32(event.block.timestamp.toI32());
    let tokenEntity = fetchToken(
      collectionEntity,
      event.params.tokenId,
      timestampBigInt
    );
    let id = "saleinfo/".concat(tokenEntity.id);
    let entity = new SaleInfo(id);
    if (entity != null) {
      store.remove("SaleInfo", entity.id);
    }
  }
}

export function handleAuctionStarted(event: AuctionStartedEvent): void {
  let collectionEntity = collection.load(event.params.collection.toHex());
  if (collectionEntity != null) {
    let timestampBigInt = BigInt.fromI32(event.block.timestamp.toI32());
    let tokenEntity = fetchToken(
      collectionEntity,
      event.params.tokenId,
      timestampBigInt
    );
    let id = "saleinfo/".concat(tokenEntity.id);
    let entity = new SaleInfo(id);
    if (entity != null) {
      entity.seller = event.params.creator.toHex();
      entity.collection = collectionEntity.id;
      entity.tokenId = tokenEntity.id;
      entity.state = "auctionSale";
      entity.startingBid = event.params.startingBid;
      entity.validity = event.params.endAuctionTime;

      entity.blockTimestamp = event.block.timestamp;
      entity.transactionHash = event.transaction.hash;

      entity.save();
    }
  }
}

export function handleBidAccepted(event: BidAcceptedEvent): void {
  let collectionEntity = collection.load(event.params.collection.toHex());
  if (collectionEntity != null) {
    let timestampBigInt = BigInt.fromI32(event.block.timestamp.toI32());
    let tokenEntity = fetchToken(
      collectionEntity,
      event.params.tokenId,
      timestampBigInt
    );
    let id = "saleinfo/".concat(tokenEntity.id);
    let entity = new SaleInfo(id);
    updateAuction(event);
    let sellerEntity = account.load(event.params.owner.toHex());
    if (sellerEntity != null) {
      sellerEntity.points = sellerEntity.points + 10;
    }
    let bidderEntity = account.load(event.params.bidder.toHex());
    if (bidderEntity != null) {
      bidderEntity.points = bidderEntity.points + 20;
    }
    if (entity != null) {
      store.remove("SaleInfo", entity.id);
    }
  }
}

export function handleBidCreated(event: BidCreatedEvent): void {
  let collectionEntity = collection.load(event.params.collection.toHex());
  if (collectionEntity != null) {
    let timestampBigInt = BigInt.fromI32(event.block.timestamp.toI32());
    let tokenEntity = fetchToken(
      collectionEntity,
      event.params.tokenId,
      timestampBigInt
    );
    let id = "saleinfo/".concat(tokenEntity.id);
    let entity = new SaleInfo(id);
    if (entity != null) {
      entity.highestBidder = event.params.bidder.toHex();
      entity.highestBid = event.params.amount;

      entity.save();
    }
  }
}
