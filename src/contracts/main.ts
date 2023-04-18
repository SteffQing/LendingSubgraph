import { store } from "@graphprotocol/graph-ts";
import {
  AuctionCancelled as AuctionCancelledEvent,
  AuctionStarted as AuctionStartedEvent,
  BidAccepted as BidAcceptedEvent,
  BidCreated as BidCreatedEvent,
} from "../../generated/Auction/Auction";

import { SupportedCollection } from "../../generated/schema";
import { fetchAccount } from "../utils/erc721";
