require("dotenv").config()
const hre = require("hardhat")

const contract_address = "0xf688e1a4b320C835bB459E7f5F3326dE6aeaFdcb";

const main = async () => {

    const [owner] = 
        await hre.ethers.getSigners()
    const contract = 
        await hre.ethers.getContractAt(
            "Flashloan", 
            contract_address
        )

    // await logCode(provider);
    await logOwnerAndVersion(contract);

    await requestFlashLoan1(contract, owner);
}

const logOwnerAndVersion = async (contract) => {
    const owner = 
        await contract.getOwner();
    const version = 
        await contract.getVersion();

    console.log(`\ncontract owner => ${owner}`);
    console.log(`contract version => ${version}`);
}

const requestFlashLoan1 = async (contract, account) => {

    const decimals = 18;
    const weth_address_on_polygon = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619";
    const weth_amount_to_borrow = hre.ethers.utils.parseUnits("1", decimals);

    console.log(`Executing Flashloan...\n`)

    const transaction = await contract
        .connect(account)
        .requestFlashLoan(
            [weth_address_on_polygon],
            [weth_amount_to_borrow],
            "0x"
        );

    await transaction
        .wait()

    console.log(`Transaction Successful!\n`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log("error")
        console.error(error);
        process.exit(1);
    });