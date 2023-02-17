const { Account, VersionedTransaction, Connection, PublicKey, TransactionInstruction, sendAndConfirmTransaction, Transaction, AddressLookupTableAccount } = require("@solana/web3.js");
const { getAssociatedTokenAddress, getOrCreateAssociatedTokenAccount, TOKEN_PROGRAM_ID } = require('@solana/spl-token');
const { getDataFromApi } = require("./getDataFromApi");

console.log("your private key ", JSON.parse(process.env.PRIVATE_KEY))
const connection = new Connection('https://api.mainnet-beta.solana.com');
let mint1 = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
let mint2 = "So11111111111111111111111111111111111111112";
let wallet = new Account(JSON.parse(process.env.PRIVATE_KEY))

async function crossProgram(connection, mint, wallet) {
  let cpiProgramId = new PublicKey("8NshNLq6mLbEUjHtM6bv121zn7gtdDuioA4aQAsWraA4")
  /* let create_account=new Account();
   console.log(create_account.publicKey.toBase58())
  let [authority, nonce] = await PublicKey.findProgramAddress(
     [create_account.publicKey.toBuffer()],
     programId,
   ); */
  console.log(wallet.publicKey)
  let tokenAccount = await getOrCreateAssociatedTokenAccount(connection, wallet, new PublicKey(mint), wallet.publicKey)

  let keys = [
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: wallet.publicKey, isSigner: true, isWritable: false },
    { pubkey: tokenAccount.address, isSigner: false, isWritable: true },
  ];
  const instruction = new TransactionInstruction({
    keys,
    programId: cpiProgramId,
    data: Buffer.from([]), // All instructions are hellos
  });
  let tx = await sendAndConfirmTransaction(
    connection,
    new Transaction().add(instruction),
    [wallet],
  );
  console.log("txxx ", tx)
}

//let data = getDataFromApi(connection, mint1, mint2, wallet)
let cpi = crossProgram(connection,mint2,wallet)


