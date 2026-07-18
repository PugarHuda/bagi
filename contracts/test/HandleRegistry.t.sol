// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {HandleRegistry} from "../src/HandleRegistry.sol";

contract HandleRegistryTest is Test {
    HandleRegistry reg;
    address alice = address(0xA11CE);
    address bob = address(0xB0B);

    function setUp() public {
        reg = new HandleRegistry(); // owner = this test contract
    }

    function testBindAndResolve() public {
        vm.prank(alice);
        reg.bind("twitter", "alice");
        assertEq(reg.resolve("twitter", "alice"), alice);
    }

    function testUnclaimedResolvesZero() public view {
        assertEq(reg.resolve("twitter", "nobody"), address(0));
    }

    function testCannotHijackClaimedHandle() public {
        vm.prank(alice);
        reg.bind("github", "shared");
        vm.prank(bob);
        vm.expectRevert(HandleRegistry.Taken.selector);
        reg.bind("github", "shared");
        assertEq(reg.resolve("github", "shared"), alice);
    }

    function testHolderCanRebindSelf() public {
        vm.startPrank(alice);
        reg.bind("x", "a");
        reg.bind("x", "a"); // idempotent for the holder, no revert
        vm.stopPrank();
        assertEq(reg.resolve("x", "a"), alice);
    }

    function testUnbindFreesHandle() public {
        vm.prank(alice);
        reg.bind("yt", "chan");
        vm.prank(alice);
        reg.unbind("yt", "chan");
        assertEq(reg.resolve("yt", "chan"), address(0));
        // now bob can claim it
        vm.prank(bob);
        reg.bind("yt", "chan");
        assertEq(reg.resolve("yt", "chan"), bob);
    }

    function testUnbindOnlyByHolder() public {
        vm.prank(alice);
        reg.bind("yt", "chan");
        vm.prank(bob);
        vm.expectRevert(HandleRegistry.NotHolder.selector);
        reg.unbind("yt", "chan");
    }

    function testAdminOverride() public {
        vm.prank(alice);
        reg.bind("tw", "disputed");
        bytes32 id = reg.handleId("tw", "disputed");
        reg.adminBind(id, bob); // owner (this contract) forces reassignment
        assertEq(reg.resolve("tw", "disputed"), bob);
    }

    function testAdminOnlyOwner() public {
        bytes32 id = reg.handleId("tw", "x");
        vm.prank(bob);
        vm.expectRevert(HandleRegistry.NotOwner.selector);
        reg.adminBind(id, bob);
    }

    function testHandleIdMatchesFormula() public view {
        // must equal keccak256(abi.encodePacked("twitter", ":", "vitalik"))
        assertEq(reg.handleId("twitter", "vitalik"), keccak256(abi.encodePacked("twitter", ":", "vitalik")));
    }
}
