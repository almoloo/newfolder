// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";

import {CreditVault} from "../src/CreditVault.sol";

contract CreditVaultTest is Test {
    CreditVault internal vault;

    address internal admin = makeAddr("admin");
    address internal user = makeAddr("user");
    address internal recipient = makeAddr("recipient");

    function setUp() external {
        vault = new CreditVault(admin);
    }

    function testTopUpBalanceTracksUserDeposit() external {
        vm.deal(user, 3 ether);

        vm.prank(user);
        vault.topUpBalance{value: 1 ether}();

        assertEq(vault.topUpBalanceOf(user), 1 ether);
        assertEq(vault.totalTopUps(), 1 ether);
        assertEq(address(vault).balance, 1 ether);
    }

    function testReceiveAlsoTracksDeposit() external {
        vm.deal(user, 2 ether);

        vm.prank(user);
        (bool success, ) = address(vault).call{value: 0.5 ether}("");

        assertTrue(success);
        assertEq(vault.topUpBalanceOf(user), 0.5 ether);
        assertEq(vault.totalTopUps(), 0.5 ether);
    }

    function testTopUpBalanceRevertsOnZeroAmount() external {
        vm.prank(user);
        vm.expectRevert(CreditVault.ZeroAmount.selector);
        vault.topUpBalance{value: 0}();
    }

    function testWithdrawTransfersFundsWhenCalledByAdmin() external {
        vm.deal(user, 3 ether);

        vm.prank(user);
        vault.topUpBalance{value: 1.25 ether}();

        vm.prank(admin);
        vault.withdraw(payable(recipient), 0.75 ether);

        assertEq(recipient.balance, 0.75 ether);
        assertEq(vault.totalWithdrawn(), 0.75 ether);
        assertEq(address(vault).balance, 0.5 ether);
        assertEq(vault.topUpBalanceOf(user), 1.25 ether);
    }

    function testWithdrawRevertsForNonAdmin() external {
        vm.prank(user);
        vm.expectRevert(CreditVault.Unauthorized.selector);
        vault.withdraw(payable(recipient), 1 ether);
    }
}
