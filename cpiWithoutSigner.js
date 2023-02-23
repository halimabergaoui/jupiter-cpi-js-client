const {

    TransactionMessage,
  
  } = require("@solana/web3.js");
  const {
    Account,
    ComputeBudgetProgram,
    VersionedTransaction,
    PublicKey,
    TransactionInstruction,
    sendAndConfirmTransaction,
    Transaction,
    AddressLookupTableAccount,
  } = require("@solana/web3.js");
  const {
    //getAssociatedTokenAddress,
    TOKEN_PROGRAM_ID, Token, ASSOCIATED_TOKEN_PROGRAM_ID,
  } = require("@solana/spl-token");
  const { default: fetch } = require("cross-fetch");
  const { associatedAddress } = require("@project-serum/anchor/dist/cjs/utils/token");
  let _publics = {};
  
  _publics.cpiWithoutSigner = async (connection, mint1, mint2, wallet) => {
  
    const data = await (
      await fetch(
        "https://quote-api.jup.ag/v4/quote?inputMint=" +
        mint1 +
        "&outputMint=" +
        mint2 +
        "&amount=100000&slippageBps=50"
      )
    ).json();
    const routes = data.data;
    console.log(JSON.stringify(routes))
    let cpiProgramId = new PublicKey(
      "FUntsD51ddPBQPUrk2gVbqwFa9uKMQmF3zNuWPGife5"
    );
  
    let createAccountProgram = wallet //new Account();
    let [programAddress, nonce] = await PublicKey.findProgramAddress(
      [createAccountProgram.publicKey.toBuffer()],
      cpiProgramId,
    );
    let ata = await Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, new PublicKey(mint1), programAddress, true)
    let account = new PublicKey('3m3pfQX6FZGRASnPbxbA7ckqch9twhYXGmQbwLDUT8Nv')
  
    const transactions = await (
      await fetch("https://quote-api.jup.ag/v4/swap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // route from /quote api
          route: routes[0],
          // user public key to be used for the swap
          userPublicKey: programAddress,
          // auto wrap and unwrap SOL. default is true
          wrapUnwrapSOL: false,
          // feeAccount is optional. Use if you want to charge a fee.  feeBps must have been passed in /quote API.
          // This is the ATA account for the output token where the fee will be sent to. If you are swapping from SOL->USDC then this would be the USDC ATA you want to collect the fee.
          // feeAccount: "fee_account_public_key"
        }),
      })
    ).json();
    //console.log("instruction ", transactions);
    const swapTransaction = transactions.swapTransaction;
    const swapTransactionBuf = Buffer.from(swapTransaction, "base64");
    var transaction = VersionedTransaction.deserialize(swapTransactionBuf);
  
    // get address lookup table accounts
    const addressLookupTableAccounts = await Promise.all(
      transaction.message.addressTableLookups.map(async (lookup) => {
        return new AddressLookupTableAccount({
          key: lookup.accountKey,
          state: AddressLookupTableAccount.deserialize(
            await connection
              .getAccountInfo(lookup.accountKey)
              .then((res) => res.data)
          ),
        });
      })
    );
    //console.log(addressLookupTableAccounts);
  
    const transactionMessage = TransactionMessage.decompile(transaction.message, {
      addressLookupTableAccounts,
    });
    //console.log({ transactionMessage });
  
    const jupiterInstruction = transactionMessage.instructions.find(
      (instruction) => {
        return instruction.programId.equals(
          new PublicKey("JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB")
        );
      }
    );
  
    /*console.log("jupiterInstruction", {
      programId: jupiterInstruction.programId,
      keys: jupiterInstruction.keys,
      data: jupiterInstruction.data,
    });*/
  
  
    let nonceData = Buffer.from([nonce])
    let cpiData = Buffer.concat([nonceData, jupiterInstruction.data]);
    let keys = [
      { pubkey: programAddress, isSigner: false, isWritable: false },
      { pubkey: wallet.publicKey, isSigner: false, isWritable: false },
    ];
    jupiterInstruction.keys.forEach(el => {
      if (el.isSigner == true) el.isSigner = false;
      if (el.pubkey.equals(ata)) el.pubkey = account;
      keys.push(el);
    })
    //keys.push({ pubkey:new PublicKey("JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB"), isSigner: false, isWritable: false });
    console.log(keys)
    const instruction = new TransactionInstruction({
      keys: keys,
      programId: cpiProgramId,
      data: cpiData, 
    });
    let tx = await sendAndConfirmTransaction(
      connection,
      new Transaction().add(instruction),
      [wallet]
    );
    console.log("txxx ", tx);
  };
  
  module.exports = _publics;
  