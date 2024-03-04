const express = require("express");
const axios = require("axios");
const app = express();
const ethers = require("ethers");
const cors = require("cors");

// Use the cors middleware
app.use(cors());

const { Web3 } = require("web3");
const web3 = new Web3(
  "https://polygon-mumbai.g.alchemy.com/v2/_5Fh5sDLETDqiQnsm3j0wSjyndEqjbuQ"
);
const MarketplaceJSON = require("../Marketplace.json");
const contractAddress = MarketplaceJSON.address;
const contractAbi = MarketplaceJSON.abi;

const myNFTContract = new web3.eth.Contract(contractAbi, contractAddress);

const GetIpfsUrlFromPinata = (pinataUrl) => {
  var IPFSUrl = pinataUrl.split("/");
  const lastIndex = IPFSUrl.length;
  IPFSUrl = "https://ipfs.io/ipfs/" + IPFSUrl[lastIndex - 1];
  return IPFSUrl;
};

app.get("/api/nfts", async (req, res) => {
  try {
    let transaction = await myNFTContract.methods.getAllNFTs().call();

    //Fetch all the details of every NFT from the contract and display
    const items = await Promise.all(
      transaction.map(async (i) => {
        var tokenURI = await myNFTContract.methods.tokenURI(i.tokenId);
        tokenURI = await tokenURI.call();
        tokenURI = GetIpfsUrlFromPinata(tokenURI);
        let meta = await axios.get(tokenURI);
        meta = meta.data;

        let price = ethers.utils.formatUnits(i.price.toString(), "ether");
        let item = {
          price,
          tokenId: Math.random(),
          seller: i.seller,
          owner: i.owner,
          image: meta.image,
          name: meta.name,
          description: meta.description,
        };
        return item;
      })
    );

    res.json({ items });
  } catch (error) {
    console.error("Error fetching NFTs from contract:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
