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
  const { borrower, amount, interest, lockId, expiry } = event.params;
  let entity = new p2pContract(
    `${borrower.toHexString()}/${lockId.toHexString()}`
  );
  entity.borrower = borrower.toHexString();
  entity.lender = constants.ADDRESS_ZERO;
  entity.amount = amount;
  entity.interest = interest;
  entity.status = "PENDING";
  entity.lockId = lockId.toHexString();
  entity.expiry = expiry;
  entity.timestamp = event.block.timestamp.toI32();
  entity.save();
}

export function handleContractActive(event: ContractActiveEvent): void {
  const {
    borrower,
    lender,
    interest,
    expiry,
    checkPointBlock,
    lockId,
  } = event.params;
  let entity = p2pContract.load(
    `${borrower.toHexString()}/${lockId.toHexString()}`
  );
  if (entity != null) {
    entity.lender = lender.toHexString();
    entity.status = "ACTIVE";
    entity.interest = interest;
    entity.expiry = expiry;
    entity.checkPointBlock = checkPointBlock;
    updateProtocol(constants.P2P, entity.amount, constants.BIGINT_ZERO);
    entity.save();
  }
}

export function handleContractClosed(event: ContractClosedEvent): void {
  const { borrower, lockId } = event.params;
  let entity = p2pContract.load(
    `${borrower.toHexString()}/${lockId.toHexString()}`
  );
  if (entity != null) {
    entity.status = "CLOSED";
    entity.save();
  }
}

export function handleLiquidation(event: LiquidateEvent): void {
  const { borrower, lockId } = event.params;
  let entity = p2pContract.load(
    `${borrower.toHexString()}/${lockId.toHexString()}`
  );
  if (entity != null) {
    entity.status = "CLOSED";
    entity.save();
  }
}

export function handleLoanRepaid(event: LoanRepaidEvent): void {
  const { borrower, repaidInterest, lockId } = event.params;
  let entity = p2pContract.load(
    `${borrower.toHexString()}/${lockId.toHexString()}`
  );
  if (entity != null) {
    entity.status = "CLOSED";
    updateProtocol(constants.P2P, constants.BIGINT_ZERO, repaidInterest);
    entity.save();
  }
}

export function handleNewBid(event: BidOpenedEvent): void {
  const { borrower, lockId, bidder, proposedInterest } = event.params;
  let entity = new p2pBid(
    `${borrower.toHexString()}/${lockId.toHexString()}/${bidder.toHexString()}`
  );
  entity.bidder = bidder.toHexString();
  entity.proposedInterest = proposedInterest;
  entity.timestamp = event.block.timestamp.toI32();
  entity.contract = `${borrower.toHexString()}/${lockId.toHexString()}`;
  entity.status = "PENDING";
  entity.save();
}

export function handleLostBid(event: LostBidEvent): void {
  const { borrower, lockId, bidder, amount } = event.params;
  let entity = p2pBid.load(
    `${borrower.toHexString()}/${lockId.toHexString()}/${bidder.toHexString()}`
  );
  let accountEntity = fetchAccount(bidder);
  accountEntity.withdrawableBid = accountEntity.withdrawableBid.plus(amount);
  accountEntity.save();
  if (entity != null) {
    entity.status = "REJECTED";
    entity.save();
  }
}

export function handleCancelledBid(event: BidClosedEvent): void {
  const { borrower, lockId, bidder } = event.params;
  let entity = p2pBid.load(
    `${borrower.toHexString()}/${lockId.toHexString()}/${bidder.toHexString()}`
  );
  2;
  if (entity != null) {
    entity.status = "CANCELLED";
    entity.save();
  }
}

export function handleContractUpdate(event: ContractUpdateEvent): void {
  const { securityFee, protocolFee } = event.params;
  updateProtocolParameters(constants.P2P, securityFee, protocolFee);
}

// Path: src\contracts\p2plending.ts
