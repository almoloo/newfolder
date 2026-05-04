// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";

import {CreditVault} from "../src/CreditVault.sol";

contract CreditVaultTest is Test {
    CreditVault internal vault;

    address payable internal treasury = payable(makeAddr("treasury"));
    address internal user = makeAddr("user");

    function setUp() external {
        vault = new CreditVault(treasury);
    }

    function testTopUpForwardsToTreasury() external {
        vm.deal(user, 3 ether);

        vm.prank(user);
        vault.topUpBalance{value: 1 ether}();

        assertEq(vault.topUpBalanceOf(user), 1 ether);
        assertEq(vault.totalTopUps(), 1 ether);
        // Contract holds nothing — all forwarded
        assertEq(address(vault).balance, 0);
        assertEq(treasury.balance, 1 ether);
    }

    function testReceiveForwardsToTreasury() external {
        vm.deal(user, 2 ether);

        vm.prank(user);
        (bool success, ) = address(vault).call{value: 0.5 ether}("");

        assertTrue(success);
        assertEq(vault.topUpBalanceOf(user), 0.5 ether);
        assertEq(vault.totalTopUps(), 0.5 ether);
        assertEq(address(vault).balance, 0);
        assertEq(treasury.balance, 0.5 ether);
    }

    function testTopUpBalanceRevertsOnZeroAmount() external {
        vm.prank(user);
        vm.expectRevert(CreditVault.ZeroAmount.selector);
        vault.topUpBalance{value: 0}();
    }

    function testMultipleTopUpsAccumulate() external {
        vm.deal(user, 3 ether);

        vm.prank(user);
        vault.topUpBalance{value: 1 ether}();

        vm.prank(user);
        vault.topUpBalance{value: 0.5 ether}();

        assertEq(vault.topUpBalanceOf(user), 1.5 ether);
        assertEq(vault.totalTopUps(), 1.5 ether);
        assertEq(treasury.balance, 1.5 ether);
    }
}
