import { loanContract, bid, lockId, account } from "../../generated/schema";
import {
  ContractOpened as ContractOpenedEvent,
  ContractActive as ContractActiveEvent,
  ContractClosed as ContractClosedEvent,
  Liquidate as LiquidateEvent,
  LoanRepaid as LoanRepaidEvent,
  LostBid as LostBidEvent,
  BidOpened as BidOpenedEvent,
  BidClosed as BidClosedEvent,
} from "../../generated/P2PLending/P2PLending";
import { constants, transactions } from "../graphprotcol-utls";
import { updateProtocol } from "./main";
import { fetchAccount } from "../utils/erc721";

export function handleContractOpened(event: ContractOpenedEvent): void {
  let entity = new loanContract(event.params.id.toHexString());
  entity.borrower = event.params.borrower.toHexString();
  entity.lender = constants.ADDRESS_ZERO;
  entity.amount = event.params.amount;
  entity.interest = event.params.interest;
  entity.status = "PENDING";
  entity.lockId = event.params.lockId.toHexString();
  entity.expiry = event.params.expiry;
  entity.transaction = transactions.log(event).id;
  let tokenLockerEntity = lockId.load(event.params.lockId.toHexString());
  if (tokenLockerEntity != null) {
    tokenLockerEntity.contract = event.params.id.toHexString();
    tokenLockerEntity.save();
  }
  entity.save();
}

export function handleContractActive(event: ContractActiveEvent): void {
  let entity = loanContract.load(event.params.id.toHexString());
  if (entity != null) {
    entity.lender = event.params.lender.toHexString();
    entity.status = "ACTIVE";
    entity.interest = event.params.interest;
    entity.expiry = event.params.expiry;
    entity.checkPointBlock = event.params.checkPointBlock;
    let bidEntity = bid.load(
      event.params.id
        .toHexString()
        .concat("-")
        .concat(event.params.lender.toHexString())
    );
    if (bidEntity != null) {
      bidEntity.status = "ACCEPTED";
      bidEntity.save();
    }
    updateProtocol(constants.P2P, entity.amount, constants.BIGINT_ZERO);
    entity.save();
  }
}

export function handleContractClosed(event: ContractClosedEvent): void {
  let entity = loanContract.load(event.params.id.toHexString());
  if (entity != null) {
    entity.status = "CLOSED";
    entity.save();
  }
}

export function handleLiquidation(event: LiquidateEvent): void {
  let entity = loanContract.load(event.params.id.toHexString());
  if (entity != null) {
    entity.status = "LIQUIDATED";
    entity.save();
  }
}

export function handleLoanRepaid(event: LoanRepaidEvent): void {
  let entity = loanContract.load(event.params.id.toHexString());
  if (entity != null) {
    entity.status = "LOAN_REPAID";
    updateProtocol(
      constants.P2P,
      constants.BIGINT_ZERO,
      event.params.repaidInterest
    );
    entity.save();
  }
}

export function handleNewBid(event: BidOpenedEvent): void {
  let entity = new bid(
    event.params.id
      .toHexString()
      .concat("-")
      .concat(event.params.bidder.toHexString())
  );
  entity.bidder = event.params.bidder.toHexString();
  entity.proposedInterest = event.params.proposedInterest;
  entity.transaction = transactions.log(event).id;
  entity.contract = event.params.id.toHexString();
  entity.status = "PENDING";
  entity.save();
}

export function handleLostBid(event: LostBidEvent): void {
  let bidder = event.params.bidder.toHexString();
  let entity = bid.load(
    event.params.id
      .toHexString()
      .concat("-")
      .concat(bidder)
  );
  let _accountEntity = fetchAccount(event.params.bidder);
  _accountEntity.withdrawableBid.plus(event.params.amount);
  _accountEntity.save();
  if (entity != null) {
    entity.status = "REJECTED";
    entity.save();
  }
}

export function handleCancelledBid(event: BidClosedEvent): void {
  let entity = bid.load(
    `${event.params.id.toHexString()}-${event.params.bidder.toHexString()}`
  );
  2;
  if (entity != null) {
    entity.status = "CANCELLED";
    entity.save();
  }
}

// Path: src\contracts\p2plending.ts
