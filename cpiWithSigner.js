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
  
  _publics.cpiWithSigner = async (connection, mint1, mint2, wallet) => {
  
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
    let cpiProgramId = new PublicKey(
      "G5voEpNwvMvPgxNwTztYTS5SrkEvmDnit21nmNFd5wyb"
    );  
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
          userPublicKey: wallet.publicKey,
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
    //jupiterInstruction.keys.push({ pubkey:new PublicKey("JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB"), isSigner: false, isWritable: false });

    const instruction = new TransactionInstruction({
      keys: jupiterInstruction.keys,
      programId: cpiProgramId,
      data: jupiterInstruction.data, // All instructions are hellos
    });
    let tx = await sendAndConfirmTransaction(
      connection,
      new Transaction().add(instruction),
      [wallet]
    );
    console.log("txxx ", tx);
  };
  
  module.exports = _publics;
  