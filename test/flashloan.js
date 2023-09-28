const { expect } = require("chai")
const hre = require("hardhat")
const IERC20 = require('@openzeppelin/contracts/build/contracts/ERC20.json')
require("dotenv").config()

describe("Balancer flashloan on polygon", () => {

  const balancer_vault_on_polygon = "0xBA12222222228d8Ba445958a75a0704d566BF2C8";
  const contract_version = "test_1.01";
  const default_decimals = 18;

  let owner;
  let not_owner;
  let contract;

  beforeEach(async () => {

    [owner, not_owner] = 
      await hre.ethers.getSigners();

    const contract_factory = 
      await hre.ethers.getContractFactory("Flashloan")

    contract = 
      await contract_factory.deploy
      (
        balancer_vault_on_polygon, 
        contract_version
      );

    await contract.deployed();

  });

  describe("flashloan", async () => {
    it("should have correct version", async () => {

      const version = 
        await contract.getVersion();

      expect(version)
        .to.equal(contract_version)

    });
    it("should have correct owner", async () => {

      const owner = 
        await contract.getOwner();

      expect(owner)
        .to.equal("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")

    });
    it("should borrow WETH", async () => {

      const weth_address_on_polygon = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619";
      const weth_amount_to_borrow = ethers.utils.parseUnits("1000", default_decimals);

      const transaction = await contract
          .connect(owner)
          .requestFlashLoan(
              [weth_address_on_polygon],
              [weth_amount_to_borrow],
              "0x"
          );

      await transaction
          .wait();

      expect(transaction).to.not.reverted;
      
    });

    it("should borrow WETH and DAI", async () => {

      const weth_address_on_polygon = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619";
      const weth_amount_to_borrow = ethers.utils.parseUnits("22", default_decimals);
      const dai_address_on_polygon = "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063";
      const dai_amount_to_borrow = ethers.utils.parseUnits("333", default_decimals);

      const transaction = await contract
          .connect(owner)
          .requestFlashLoan(
              [weth_address_on_polygon, dai_address_on_polygon],
              [weth_amount_to_borrow, dai_amount_to_borrow],
              "0x"
          );

      await transaction
          .wait();

      expect(transaction).to.not.reverted;
      
    });

    it("should be able to receive native coins", async () => {

      const native_coin_amount_to_send = ethers.utils.parseUnits("4", default_decimals);
      const transaction = await owner.sendTransaction({
        to: contract.address,
        value: native_coin_amount_to_send 
      });

      await transaction
        .wait();

      expect(transaction)
        .to.not.reverted

      const balance = 
        await contract.getBalance();

      expect(balance)
        .to.equal(native_coin_amount_to_send); 

      const balance_via_provider = 
        await ethers.provider.getBalance(contract.address);
      
      expect(balance_via_provider)
        .to.equal(native_coin_amount_to_send); 
    });

    it("should be able to receive native coins via payable function", async () => {

      const native_coin_amount_to_send = ethers.utils.parseUnits("3", default_decimals);   

      const transaction = await contract
          .connect(owner)
          .deposit({
            value: native_coin_amount_to_send
          });

      await transaction
          .wait();

      expect(transaction).to.not.reverted;

      const balance = 
        await contract.getBalance();
      
      expect(balance)
        .to.equal(native_coin_amount_to_send);  
      
      const balance_via_provider = 
        await ethers.provider.getBalance(contract.address);
      
      expect(balance_via_provider)
        .to.equal(native_coin_amount_to_send);    
    });

    it("should be able to withdraw native coins", async () => {

      const native_coin_amount_to_send = 
        ethers.utils.parseUnits("6", default_decimals);

      const original_owner_balance = 
        await ethers.provider.getBalance(owner.address);
      
      // send native coin to contract
      const transaction = await owner.sendTransaction({
        to: contract.address,
        value: native_coin_amount_to_send 
      });

      const owner_balance_after_send = 
        await ethers.provider.getBalance(owner.address);    

      // we need to round due to gas fees
      // gas fees make it impossible to get an exact number
      const rounded_original_balance = 
        Math.round(
          Number(
            ethers.utils.formatUnits(original_owner_balance, "ether")
          )
        );
      const rounded_balance_after = 
        Math.round(
          Number(
            ethers.utils.formatUnits(owner_balance_after_send, "ether")
          )
        );
      const rounded_amount_sent = 
        Math.round(
          Number(
            ethers.utils.formatUnits(native_coin_amount_to_send, "ether")
          )
        );
      
      // check the amout was deducted from the owner account
      expect(rounded_balance_after)
        .to.equal(rounded_original_balance - rounded_amount_sent)

      // check contract balance and owner
      const balance = 
        await contract.getBalance();

      expect(balance)
        .to.equal(native_coin_amount_to_send); 
      
      const contract_owner = 
        await contract.getOwner();

      expect(contract_owner)
        .to.equal(owner.address); 

      //withdraw native coin
      await contract.withdraw();

      const contract_balance_after_withdraw = 
        await ethers.provider.getBalance(contract.address);
      
      const owner_balance_after_withdraw = 
        await ethers.provider.getBalance(owner.address);
      
      const rounded_owner_balance_after_withdraw = 
        Math.round(
          Number(
            ethers.utils.formatUnits(owner_balance_after_withdraw, "ether")
          )
        ); 

      // contract balance should be 0
      expect(Number(contract_balance_after_withdraw))
        .to.equal(0)

      // owner balance should be equal to the original balance (before send)
      expect(rounded_owner_balance_after_withdraw)
        .to.equal(rounded_original_balance)
    });

    it("should be able to receive ERC20 tokens", async () => {

      const dai_contract_address = "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063";
      const dai_wallet_to_impersonate = "0x62de034b1a69ef853c9d0d8a33d26df5cf26682e";
      const dai_amount_to_send = ethers.utils.parseUnits("1000000", default_decimals);

      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [dai_wallet_to_impersonate],
      })

      const impesonated_account = 
        await ethers.getSigner(dai_wallet_to_impersonate);

      const dai_contract = 
        new ethers.Contract
        (
          dai_contract_address, 
          IERC20.abi, 
          ethers.provider
        );
      
      // send 1 000 000 DAI to contract
      await dai_contract
          .connect(impesonated_account)
          .transfer(
            contract.address, 
            dai_amount_to_send
          );

      const dai_contract_balance_1 = 
        await contract.getTokenBalance(dai_contract_address);
      
      const dai_contract_balance_2 = 
        await dai_contract.balanceOf(contract.address); 

      expect(dai_contract_balance_1)
        .to.equal(dai_amount_to_send); 

      expect(dai_contract_balance_2)
        .to.equal(dai_amount_to_send); 
    });

    it("should be able to withdraw ERC20 tokens", async () => {

      const dai_contract_address = "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063";
      const dai_wallet_to_impersonate = "0x62de034b1a69ef853c9d0d8a33d26df5cf26682e";
      const dai_amount_to_send = ethers.utils.parseUnits("2000000", default_decimals);

      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [dai_wallet_to_impersonate],
      })

      const impesonated_account = 
        await ethers.getSigner(dai_wallet_to_impersonate);

      const dai_contract = 
        new ethers.Contract
        (
          dai_contract_address, 
          IERC20.abi, 
          ethers.provider
        );
      
      // send 2 000 000 DAI to contract
      await dai_contract
          .connect(impesonated_account)
          .transfer(
            contract.address, 
            dai_amount_to_send
          );

      const dai_contract_balance = 
        await contract.getTokenBalance(dai_contract_address);

      expect(dai_contract_balance)
        .to.equal(dai_amount_to_send); 

      // withdraw to owner
      await contract.withdrawToken(dai_contract_address);
      
      // contract DAI balance should be 0
      const dai_contract_balance_after_withdrawal = 
        await dai_contract.balanceOf(contract.address); 

      expect(dai_contract_balance_after_withdrawal)
        .to.equal(0); 
      
      // owner DAI balance should be 2 000 000 
      const dai_owner_balance = 
        await dai_contract.balanceOf(owner.address); 
      
      expect(dai_owner_balance)
        .to.equal(dai_amount_to_send);
    });

    it("non owner accounts should not be allowed to witdraw native coins", async () => {

      const transaction = contract
          .connect(not_owner)
          .withdraw();

      await expect(transaction).to.be.revertedWith('caller is not the owner!');
      
    });

    it("non owner accounts should not be allowed to witdraw tokens", async () => {

      const dai_contract_address = "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063";
      const transaction = contract
          .connect(not_owner)
          .withdrawToken(dai_contract_address);

      await expect(transaction).to.be.revertedWith('caller is not the owner!');

    });
  });
})

