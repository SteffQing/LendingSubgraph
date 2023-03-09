import { store } from "@graphprotocol/graph-ts";
import {
  AuctionCancelled as AuctionCancelledEvent,
  AuctionStarted as AuctionStartedEvent,
  BidAccepted as BidAcceptedEvent,
  BidCreated as BidCreatedEvent,
} from "../../generated/Auction/Auction";
import { account, SaleInfo } from "../../generated/schema";
import { updateAuction } from "./auctionUtils";

export function handleAuctionCancelled(event: AuctionCancelledEvent): void {
  let collectionAddress = event.params.collection.toHex();
  let tokenId = event.params.tokenId.toString();
  let tokenEntityId = "kcc/"
    .concat(collectionAddress)
    .concat("/")
    .concat(tokenId);
  let id = "saleinfo/".concat(tokenEntityId);
  let entity = SaleInfo.load(id);
  if (entity != null) {
    store.remove("SaleInfo", entity.id);
  }
}

export function handleAuctionStarted(event: AuctionStartedEvent): void {
  let collectionAddress = event.params.collection.toHex();
  let tokenId = event.params.tokenId.toString();
  let tokenEntityId = "kcc/"
    .concat(collectionAddress)
    .concat("/")
    .concat(tokenId);
  let id = "saleinfo/".concat(tokenEntityId);
  let entity = new SaleInfo(id);
  entity.seller = event.params.creator.toHex();
  entity.collection = collectionAddress;
  entity.tokenId = tokenEntityId;
  entity.state = "auctionSale";
  entity.startingBid = event.params.startingBid;
  entity.validity = event.params.endAuctionTime;

  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleBidAccepted(event: BidAcceptedEvent): void {
  let collectionAddress = event.params.collection.toHex();
  let tokenId = event.params.tokenId.toString();
  let tokenEntityId = "kcc/"
    .concat(collectionAddress)
    .concat("/")
    .concat(tokenId);
  let id = "saleinfo/".concat(tokenEntityId);
  updateAuction(event);
  let sellerEntity = account.load(event.params.owner.toHex());
  if (sellerEntity != null) {
    if (sellerEntity.points == null) {
      sellerEntity.points = 0;
    }
    sellerEntity.points = sellerEntity.points + 10;
  }
  let bidderEntity = account.load(event.params.bidder.toHex());
  if (bidderEntity != null) {
    if (bidderEntity.points == null) {
      bidderEntity.points = 0;
    }
    bidderEntity.points = bidderEntity.points + 20;
  }
  store.remove("SaleInfo", id);
}

export function handleBidCreated(event: BidCreatedEvent): void {
  let collectionAddress = event.params.collection.toHex();
  let tokenId = event.params.tokenId.toString();
  let tokenEntityId = "kcc/"
    .concat(collectionAddress)
    .concat("/")
    .concat(tokenId);
  let id = "saleinfo/".concat(tokenEntityId);
  let entity = SaleInfo.load(id);
  if (entity != null) {
    entity.highestBidder = event.params.bidder.toHex();
    entity.highestBid = event.params.amount;

    entity.save();
  }
}
