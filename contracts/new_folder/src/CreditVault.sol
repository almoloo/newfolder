// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract CreditVault {
    error Unauthorized();
    error ZeroAmount();
    error ZeroAddress();
    error TransferFailed();

    event BalanceToppedUp(
        address indexed account,
        uint256 amount,
        uint256 newAccountTotal
    );
    event AdminWithdrawal(
        address indexed admin,
        address indexed recipient,
        uint256 amount
    );

    address public immutable admin;
    mapping(address account => uint256 amount) public topUpBalanceOf;
    uint256 public totalTopUps;
    uint256 public totalWithdrawn;

    constructor(address admin_) {
        if (admin_ == address(0)) revert ZeroAddress();
        admin = admin_;
    }

    function topUpBalance() external payable {
        _topUp(msg.sender, msg.value);
    }

    function withdraw(address payable recipient, uint256 amount) external {
        if (msg.sender != admin) revert Unauthorized();
        if (recipient == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();

        totalWithdrawn += amount;

        (bool success, ) = recipient.call{value: amount}("");
        if (!success) revert TransferFailed();

        emit AdminWithdrawal(msg.sender, recipient, amount);
    }

    function contractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    receive() external payable {
        _topUp(msg.sender, msg.value);
    }

    function _topUp(address account, uint256 amount) internal {
        if (amount == 0) revert ZeroAmount();

        uint256 newAccountTotal = topUpBalanceOf[account] + amount;
        topUpBalanceOf[account] = newAccountTotal;
        totalTopUps += amount;

        emit BalanceToppedUp(account, amount, newAccountTotal);
    }
}
