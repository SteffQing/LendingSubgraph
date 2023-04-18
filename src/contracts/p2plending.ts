import { p2pContract, p2pBid } from "../../generated/schema";
import {
  ContractOpened as ContractOpenedEvent,
  ContractActive as ContractActiveEvent,
  ContractClosed as ContractClosedEvent,
  Liquidate as LiquidateEvent,
  LoanRepaid as LoanRepaidEvent,
  LostBid as LostBidEvent,
  BidOpened as BidOpenedEvent,
  BidClosed as BidClosedEvent,
  ContractUpdate as ContractUpdateEvent,
} from "../../generated/P2PLending/P2PLending";
import { constants } from "../graphprotcol-utls";
import { updateProtocol, updateProtocolParameters } from "./main";
import { fetchAccount } from "../utils/erc721";

export function handleContractOpened(event: ContractOpenedEvent): void {
  let entity = new p2pContract(
    `${event.params.borrower.toHexString()}/${event.params.lockId.toHexString()}`
  );
  entity.borrower = event.params.borrower.toHexString();
  entity.lender = constants.ADDRESS_ZERO;
  entity.amount = event.params.amount;
  entity.interest = event.params.interest;
  entity.status = "PENDING";
  entity.lockId = event.params.lockId.toHexString();
  entity.expiry = event.params.expiry;
  entity.timestamp = event.block.timestamp.toI32();
  entity.save();
}

export function handleContractActive(event: ContractActiveEvent): void {
  let entity = p2pContract.load(
    `${event.params.borrower.toHexString()}/${event.params.lockId.toHexString()}`
  );
  if (entity != null) {
    entity.lender = event.params.lender.toHexString();
    entity.status = "ACTIVE";
    entity.interest = event.params.interest;
    entity.expiry = event.params.expiry;
    entity.checkPointBlock = event.params.checkPointBlock;
    updateProtocol(constants.P2P, entity.amount, constants.BIGINT_ZERO);
    entity.save();
  }
}

export function handleContractClosed(event: ContractClosedEvent): void {
  let entity = p2pContract.load(
    `${event.params.borrower.toHexString()}/${event.params.lockId.toHexString()}`
  );
  if (entity != null) {
    entity.status = "CLOSED";
    entity.save();
  }
}

export function handleLiquidation(event: LiquidateEvent): void {
  let entity = p2pContract.load(
    `${event.params.borrower.toHexString()}/${event.params.lockId.toHexString()}`
  );
  if (entity != null) {
    entity.status = "CLOSED";
    entity.save();
  }
}

export function handleLoanRepaid(event: LoanRepaidEvent): void {
  let entity = p2pContract.load(
    `${event.params.borrower.toHexString()}/${event.params.lockId.toHexString()}`
  );
  if (entity != null) {
    entity.status = "CLOSED";
    updateProtocol(
      constants.P2P,
      constants.BIGINT_ZERO,
      event.params.repaidInterest
    );
    entity.save();
  }
}

export function handleNewBid(event: BidOpenedEvent): void {
  let entity = new p2pBid(
    `${event.params.borrower.toHexString()}/${event.params.lockId.toHexString()}/${event.params.bidder.toHexString()}`
  );
  entity.bidder = event.params.bidder.toHexString();
  entity.proposedInterest = event.params.proposedInterest;
  entity.timestamp = event.block.timestamp.toI32();
  entity.contract = `${event.params.borrower.toHexString()}/${event.params.lockId.toHexString()}`;
  entity.status = "PENDING";
  entity.save();
}

export function handleLostBid(event: LostBidEvent): void {
  let entity = p2pBid.load(
    `${event.params.borrower.toHexString()}/${event.params.lockId.toHexString()}/${event.params.bidder.toHexString()}`
  );
  let accountEntity = fetchAccount(event.params.bidder);
  accountEntity.withdrawableBid = accountEntity.withdrawableBid.plus(
    event.params.amount
  );
  accountEntity.save();
  if (entity != null) {
    entity.status = "REJECTED";
    entity.save();
  }
}

export function handleCancelledBid(event: BidClosedEvent): void {
  let entity = p2pBid.load(
    `${event.params.borrower.toHexString()}/${event.params.lockId.toHexString()}/${event.params.bidder.toHexString()}`
  );
  2;
  if (entity != null) {
    entity.status = "CANCELLED";
    entity.save();
  }
}

export function handleContractUpdate(event: ContractUpdateEvent): void {
  updateProtocolParameters(
    constants.P2P,
    event.params.securityFee,
    event.params.protocolFee
  );
}

// Path: src\contracts\p2plending.ts
