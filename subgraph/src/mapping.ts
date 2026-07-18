import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts";
import { Tipped } from "../generated/Bagi/Bagi";
import { Bound, Released } from "../generated/HandleRegistry/HandleRegistry";
import { Account, Tip, Handle } from "../generated/schema";

function loadAccount(addr: Bytes): Account {
  let acc = Account.load(addr);
  if (!acc) {
    acc = new Account(addr);
    acc.totalSent = BigInt.zero();
    acc.totalReceived = BigInt.zero();
    acc.tipsSent = BigInt.zero();
    acc.tipsReceived = BigInt.zero();
  }
  return acc;
}

const ONE = BigInt.fromI32(1);

export function handleTipped(event: Tipped): void {
  // Self-tip (from == creator, e.g. tipping a handle you own) must reuse ONE Account object.
  // Two separate load()s are distinct AssemblyScript copies; saving them in sequence makes the
  // second save clobber the first's field update. (This exact bug is documented in nih.)
  const selfTip = event.params.from.equals(event.params.creator);
  const from = loadAccount(event.params.from);
  const creator = selfTip ? from : loadAccount(event.params.creator);

  const net = event.params.amount.minus(event.params.fee); // what actually routed to the split

  const tip = new Tip(event.transaction.hash.concatI32(event.logIndex.toI32()));
  tip.from = from.id;
  tip.creator = creator.id;
  tip.amount = event.params.amount;
  tip.fee = event.params.fee;
  tip.memo = event.params.memo;
  tip.txHash = event.transaction.hash;
  tip.blockNumber = event.block.number;
  tip.timestamp = event.block.timestamp;
  tip.save();

  from.totalSent = from.totalSent.plus(event.params.amount);
  from.tipsSent = from.tipsSent.plus(ONE);
  creator.totalReceived = creator.totalReceived.plus(net);
  creator.tipsReceived = creator.tipsReceived.plus(ONE);

  creator.save();
  if (!selfTip) from.save(); // when selfTip, creator === from and already holds all four updates
}

export function handleBound(event: Bound): void {
  // adminBind emits empty platform/username (dispute override) — only touch the wallet then.
  const wallet = loadAccount(event.params.wallet);
  wallet.save();

  let handle = Handle.load(event.params.handleId);
  if (!handle) {
    handle = new Handle(event.params.handleId);
    handle.platform = "";
    handle.username = "";
    handle.boundAt = event.block.timestamp;
  }
  if (event.params.platform.length > 0) handle.platform = event.params.platform;
  if (event.params.username.length > 0) handle.username = event.params.username;
  handle.wallet = wallet.id;
  handle.save();
}

export function handleReleased(event: Released): void {
  const handle = Handle.load(event.params.handleId);
  if (!handle) return;
  handle.wallet = null; // freed; keeps the row for history
  handle.save();
}
