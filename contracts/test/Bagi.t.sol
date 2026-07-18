// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {Bagi} from "../src/Bagi.sol";

contract MockUSDC {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 v) external {
        balanceOf[to] += v;
    }

    function approve(address s, uint256 v) external returns (bool) {
        allowance[msg.sender][s] = v;
        return true;
    }

    function transfer(address to, uint256 v) external returns (bool) {
        balanceOf[msg.sender] -= v;
        balanceOf[to] += v;
        return true;
    }

    function transferFrom(address f, address to, uint256 v) external returns (bool) {
        allowance[f][msg.sender] -= v;
        balanceOf[f] -= v;
        balanceOf[to] += v;
        return true;
    }
}

contract BagiTest is Test {
    Bagi bagi;
    MockUSDC usdc;

    address creator = address(0xC0);
    address fee = address(0xFEE);
    address tipper = address(0x71);
    address alice = address(0xA1);
    address bob = address(0xB0);
    address carol = address(0xCA);

    function setUp() public {
        usdc = new MockUSDC();
        bagi = new Bagi(address(usdc), fee, 50); // 0.5% fee
        usdc.mint(tipper, 1_000_000e6);
        vm.prank(tipper);
        usdc.approve(address(bagi), type(uint256).max);
    }

    function _split3() internal {
        address[] memory r = new address[](3);
        uint16[] memory b = new uint16[](3);
        (r[0], r[1], r[2]) = (alice, bob, carol);
        (b[0], b[1], b[2]) = (5000, 3000, 2000); // 50/30/20
        vm.prank(creator);
        bagi.setSplit(r, b);
    }

    function testSplitAllocatesByBpsAfterFee() public {
        _split3();
        uint256 amount = 1000e6;
        vm.prank(tipper);
        bagi.tip(creator, amount, "gg");

        uint256 feeAmt = (amount * 50) / 10_000; // 5 USDC
        uint256 net = amount - feeAmt; // 995 USDC
        assertEq(bagi.earned(fee), feeAmt);
        assertEq(bagi.earned(alice), (net * 5000) / 10_000);
        assertEq(bagi.earned(bob), (net * 3000) / 10_000);
        // carol absorbs the remainder → all of net must be accounted for, no dust lost
        assertEq(bagi.earned(alice) + bagi.earned(bob) + bagi.earned(carol), net);
        assertEq(bagi.tippedIn(creator), net);
        assertEq(bagi.tippedOut(tipper), amount);
    }

    function testRemainderGoesToLastRecipientNoDust() public {
        // amount chosen so bps math doesn't divide evenly
        address[] memory r = new address[](3);
        uint16[] memory b = new uint16[](3);
        (r[0], r[1], r[2]) = (alice, bob, carol);
        (b[0], b[1], b[2]) = (3333, 3333, 3334);
        vm.prank(creator);
        bagi.setSplit(r, b);

        uint256 amount = 100e6 + 7; // odd wei
        vm.prank(tipper);
        bagi.tip(creator, amount, "");
        uint256 net = amount - (amount * 50) / 10_000;
        assertEq(bagi.earned(alice) + bagi.earned(bob) + bagi.earned(carol), net);
    }

    function testWithdraw() public {
        _split3();
        vm.prank(tipper);
        bagi.tip(creator, 1000e6, "");
        uint256 owed = bagi.earned(alice);
        vm.prank(alice);
        bagi.withdraw();
        assertEq(usdc.balanceOf(alice), owed);
        assertEq(bagi.earned(alice), 0);
    }

    function testWithdrawTwiceReverts() public {
        _split3();
        vm.prank(tipper);
        bagi.tip(creator, 1000e6, "");
        vm.prank(alice);
        bagi.withdraw();
        vm.prank(alice);
        vm.expectRevert(Bagi.ZeroAmount.selector);
        bagi.withdraw();
    }

    function testTipWithoutSplitReverts() public {
        vm.prank(tipper);
        vm.expectRevert(Bagi.NoSplit.selector);
        bagi.tip(creator, 1e6, "");
    }

    function testBadSplitSumReverts() public {
        address[] memory r = new address[](2);
        uint16[] memory b = new uint16[](2);
        (r[0], r[1]) = (alice, bob);
        (b[0], b[1]) = (5000, 4000); // sums to 9000, not 10000
        vm.prank(creator);
        vm.expectRevert(Bagi.BadSplit.selector);
        bagi.setSplit(r, b);
    }

    function testFeeCannotExceedCeiling() public {
        vm.expectRevert(Bagi.FeeTooHigh.selector);
        new Bagi(address(usdc), fee, 101);
    }

    function testOnlyOwnerSetsFee() public {
        vm.prank(tipper);
        vm.expectRevert(Bagi.NotOwner.selector);
        bagi.setFee(10, fee);
    }

    // invariant-style: contract never holds more than the sum it still owes
    function testSolvencyAfterTips() public {
        _split3();
        vm.startPrank(tipper);
        bagi.tip(creator, 777e6, "");
        bagi.tip(creator, 123e6, "");
        vm.stopPrank();
        uint256 owed = bagi.earned(alice) + bagi.earned(bob) + bagi.earned(carol) + bagi.earned(fee);
        assertEq(usdc.balanceOf(address(bagi)), owed);
    }
}
