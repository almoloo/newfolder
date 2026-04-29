// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {CreditVault} from "../src/CreditVault.sol";

contract DeployCreditVault is Script {
    function run() external returns (CreditVault vault) {
        address admin = vm.envAddress("CREDIT_VAULT_ADMIN_ADDRESS");
        uint256 deployerPrivateKey = vm.envUint("WALLET_PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);
        vault = new CreditVault(admin);
        vm.stopBroadcast();

        console2.log("CreditVault deployed at:", address(vault));
        console2.log("Admin:", admin);
    }
}
