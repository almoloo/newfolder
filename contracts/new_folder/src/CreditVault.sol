// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title CreditVault
 * @notice Accepts user top-ups and immediately forwards all ETH to the admin
 *         treasury wallet. No funds are held by the contract — the admin wallet
 *         is responsible for funding the 0G Compute Ledger off-chain.
 */
contract CreditVault {
    error ZeroAmount();
    error ZeroAddress();
    error TransferFailed();

    event BalanceToppedUp(
        address indexed account,
        uint256 amount,
        uint256 newAccountTotal
    );
    event FundsForwarded(address indexed treasury, uint256 amount);

    /// @notice Immutable treasury address — all received ETH is forwarded here.
    address payable public immutable treasury;

    mapping(address account => uint256 amount) public topUpBalanceOf;
    uint256 public totalTopUps;

    constructor(address payable treasury_) {
        if (treasury_ == address(0)) revert ZeroAddress();
        treasury = treasury_;
    }

    /// @notice Top up credits. ETH is forwarded to treasury immediately.
    function topUpBalance() external payable {
        _topUp(msg.sender, msg.value);
    }

    /// @notice Plain ETH transfers are treated as top-ups.
    receive() external payable {
        _topUp(msg.sender, msg.value);
    }

    /// @notice Returns 0 — funds are never held by this contract.
    function contractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function _topUp(address account, uint256 amount) internal {
        if (amount == 0) revert ZeroAmount();

        uint256 newAccountTotal = topUpBalanceOf[account] + amount;
        topUpBalanceOf[account] = newAccountTotal;
        totalTopUps += amount;

        emit BalanceToppedUp(account, amount, newAccountTotal);

        // Forward immediately to treasury — no funds held.
        (bool success, ) = treasury.call{value: amount}("");
        if (!success) revert TransferFailed();

        emit FundsForwarded(treasury, amount);
    }
}
