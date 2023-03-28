// SPDX-License-Identifier: None

pragma solidity 0.8.18;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./IFlashLoanRecipient.sol";
import "./IBalancerVault.sol";
import "hardhat/console.sol";

contract Flashloan is IFlashLoanRecipient {
    
    address payable private _owner;
    address public immutable _vault;
    string private _version = "";

    modifier onlyOwner() {
        require(msg.sender == _owner, "caller is not the owner!");
        _;
    }

    constructor(
        address vault, 
        string memory version
    ) payable  {
        _owner = payable(msg.sender);
        _vault = vault;
        _version = version;
    }

    function receiveFlashLoan(
        IERC20[] memory tokens,
        uint256[] memory amounts,
        uint256[] memory feeAmounts,
        bytes memory
    ) external override 
    {
        require(msg.sender == _vault);

        console.log("flashloan received");

        for (uint256 i = 0; i < tokens.length; ++i) {
            IERC20 token = tokens[i];
            uint256 amount = amounts[i];
            console.log("borrowed amount:", amount);
            uint256 feeAmount = feeAmounts[i];
            console.log("flashloan fee: ", feeAmount);

            // Return loan
            token.transfer(_vault, amount);
        }
    }

    function requestFlashLoan(
        IERC20[] memory tokens,
        uint256[] memory amounts,
        bytes memory userData
    ) external 
    {
        console.log("flashloan requested");

        IBalancerVault(_vault)
            .flashLoan(
                IFlashLoanRecipient(address(this)),
                tokens,
                amounts,
                userData
            );
    }

    receive() external payable { console.log("receive called"); }

    fallback() external payable { console.log("fallback called"); }

    function deposit() public payable { console.log("deposit called"); }

    function getBalance() public view returns (uint) 
    {
        console.log("getBalance called");

        return address(this).balance;
    }

    function getTokenBalance(address tokenAddress) public view returns (uint) 
    {
        console.log("getTokenBalance called");

        return IERC20(tokenAddress).balanceOf(address(this));
    }

    function withdraw() public onlyOwner 
    {
        console.log("withdraw called");

        uint amount = address(this).balance;

        (bool success, ) = _owner.call{value: amount}("");
        require(success, "Failed to send Ether");
    }

    function withdrawToken(address tokenAddress) public onlyOwner 
    {
        console.log("withdrawToken called");

        uint256 balance = IERC20(tokenAddress).balanceOf(address(this));
        IERC20(tokenAddress).transfer(_owner, balance);
    }

    function getOwner() external view returns (address) 
    {
        return _owner;
    }

    function getVersion() external view returns (string memory) 
    {
        return _version;
    }
}
