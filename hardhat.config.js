require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config()

module.exports = {
	solidity: "0.8.18",
	networks: {
		hardhat: {
			forking: {
				url: process.env.HARDHAT_ENDPOINT
			}
		},
		polygon: {
			url: process.env.HARDHAT_ENDPOINT,
			accounts: [process.env.PRIVATE_KEY],
		}
	}
};
