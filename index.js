const {
  Account,
  VersionedTransaction,
  Connection,
  PublicKey,
  TransactionInstruction,
  sendAndConfirmTransaction,
  Transaction,
  AddressLookupTableAccount,
  Keypair,
} = require("@solana/web3.js");
const {
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
  TOKEN_PROGRAM_ID,
} = require("@solana/spl-token");
const { Wallet } = require("@project-serum/anchor");
const { cpiWithSigner } = require("./cpiWithSigner");
const { cpiWithoutSigner } = require("./cpiWithoutSigner");

// console.log("your private key ", JSON.parse(process.env.PRIVATE_KEY));
const connection = new Connection("https://api.mainnet-beta.solana.com");
let mint1 = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
let mint2 = "So11111111111111111111111111111111111111112";
let wallet = new Account(JSON.parse(process.env.PRIVATE_KEY));
let cpi = cpiWithoutSigner(connection,mint1,mint2,wallet)
let cpi2 = cpiWithSigner(connection,mint1,mint2,wallet)

