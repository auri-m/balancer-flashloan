require("dotenv").config()
const { ethers } = require("ethers")
const fs = require("fs")
const path = require("path")

const contract_address = "0xf688e1a4b320C835bB459E7f5F3326dE6aeaFdcb";

const main = async () => {

    const provider = 
        new ethers.providers.WebSocketProvider(process.env.ETHERS_ENDPOINT)
    const wallet = 
        new ethers.Wallet(process.env.PRIVATE_KEY);
    const signer = 
        wallet.connect(provider);
    const contract_abi = 
        getContractAbi();
    const contract = 
        new ethers.Contract(
            contract_address, 
            contract_abi, 
            signer
        );

    // await logCode(provider);
    await logOwnerAndVersion(contract);

    await requestFlashLoan1(contract);
}

const getContractAbi = () => {
    const local_path_to_abi = "../artifacts/contracts/Flashloan.sol/Flashloan.json";
    const full_path_to_abi = path.resolve(__dirname, local_path_to_abi);

    const file = fs.readFileSync(full_path_to_abi, "utf8")
    const json = JSON.parse(file)

    return json.abi;
}

const logCode = async (provider) => {
    const contract_code = 
        await provider.getCode(contract_address);
    console.log("Contract code");
    console.log(contract_code);
}

const logOwnerAndVersion = async (contract) => {
    const owner = 
        await contract.getOwner();
    const version = 
        await contract.getVersion();

    console.log(`\ncontract owner => ${owner}`);
    console.log(`contract version => ${version}`);
}

const requestFlashLoan1 = async (contract) => {

    const decimals = 18;
    const weth_address_on_polygon = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619";
    const weth_amount_to_borrow = ethers.utils.parseUnits("1", decimals);

    console.log("requesting WETH flashloan");

    await contract.requestFlashLoan(
        [weth_address_on_polygon],
        [weth_amount_to_borrow],
        "0x"
    )

    console.log("done");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log("error")
        console.error(error);
        process.exit(1);
    });