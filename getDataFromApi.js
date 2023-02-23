const { VersionedTransaction,AddressLookupTableAccount } = require("@solana/web3.js");
let _publics={};

_publics.getDataFromApi = async (connection, mint1, mint2, wallet) => {
    // retrieve indexed routed map
    const indexedRouteMap = await (await fetch('https://quote-api.jup.ag/v4/indexed-route-map')).json();
    const getMint = (index) => indexedRouteMap["mintKeys"][index];
    const getIndex = (mint) => indexedRouteMap["mintKeys"].indexOf(mint);
    //console.log("getMint",indexedRouteMap)
    // generate route map by replacing indexes with mint addresses
    var generatedRouteMap = {};
    if (!indexedRouteMap['indexedRouteMap']) return "failed"
    Object.keys(indexedRouteMap['indexedRouteMap']).forEach((key, index) => {
      generatedRouteMap[getMint(key)] = indexedRouteMap["indexedRouteMap"][key].map((index) => getMint(index))
    });
  
    // list all possible input tokens by mint Address
    const allInputMints = Object.keys(generatedRouteMap);
  
    // list tokens can swap by mint address for SOL
    const swappableOutputForSol = generatedRouteMap[mint1];
    //console.log({ allInputMints, swappableOutputForSol })
    const data = await (
      await fetch('https://quote-api.jup.ag/v4/quote?inputMint=' + mint1 + '&outputMint=' + mint2 + '&amount=100000&slippageBps=50'
      )
    ).json();
    const routes = data.data;
  
    console.log(JSON.stringify(routes))
    //crossProgram(connection,wallet)
    const transactions = await (
      await fetch('https://quote-api.jup.ag/v4/swap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          // route from /quote api
          route: routes[0],
          // user public key to be used for the swap
          userPublicKey: wallet.publicKey.toString(),
          // auto wrap and unwrap SOL. default is true
          wrapUnwrapSOL: true,
          // feeAccount is optional. Use if you want to charge a fee.  feeBps must have been passed in /quote API.
          // This is the ATA account for the output token where the fee will be sent to. If you are swapping from SOL->USDC then this would be the USDC ATA you want to collect the fee.
          // feeAccount: "fee_account_public_key"  
        })
      })
    ).json();
    console.log("instruction ", transactions)
    const swapTransaction = transactions.swapTransaction;
    const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
    var transaction = VersionedTransaction.deserialize(swapTransactionBuf);
    console.log("////////////////////////")
    
    console.log(JSON.stringify(transaction))
    console.log("////////////////////////")
    // get address lookup table accounts
    const addressLookupTableAccounts = await Promise.all(
      transaction.message.addressTableLookups.map(async (lookup) => {
        return new AddressLookupTableAccount({
          key: lookup.accountKey,
          state: AddressLookupTableAccount.deserialize(await connection.getAccountInfo(lookup.accountKey).then((res) => res.data)),
        })
      }))
    console.log(addressLookupTableAccounts)
  
  }

  module.exports = _publics;