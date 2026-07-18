// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script} from "forge-std/Script.sol";
import {Bagi} from "../src/Bagi.sol";

/// @notice Deploy Bagi to Avalanche.
///   Fuji:  USDC = 0x5425890298aed601595a70AB815c96711a31Bc65 (Circle testnet USDC)
///   Mainnet USDC = 0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E (native Circle USDC, C-Chain)
///
///   forge script script/Deploy.s.sol --rpc-url fuji --broadcast \
///     --private-key $PRIVATE_KEY \
///     --sig "run(address,address,uint16)" $USDC $FEE_RECIPIENT 50
contract Deploy is Script {
    function run(address usdc, address feeRecipient, uint16 feeBps) external returns (Bagi bagi) {
        vm.startBroadcast();
        bagi = new Bagi(usdc, feeRecipient, feeBps);
        vm.stopBroadcast();
    }
}
