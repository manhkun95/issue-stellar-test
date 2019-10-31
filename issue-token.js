var StellarSdk = require('stellar-sdk');
const axios = require('axios');
const server = new StellarSdk.Server("https://horizon-testnet.stellar.org");
const sourcePrivateKey = 'SDY5OUUDHLWRECHWHL66JUXPWCV7PXZOL7LCNINER64UJJXUFKNGPDEE';
const sourcePublicKey = 'GDYH7WHNXFU2HRFA5UT3R6WHGX4B36XD56GICX2TM5BDIFMAIUYV7UAN';
const destinationId = 'GA2C5RFPE6GCKMY3US5PAB6UZLKIGSPIUKSLRB6Q723BM2OARMDUYEJ5';
const amount = "100";
const message = 'Test transaction';


const issuerPriv = "SDYPAWVH3FDE7R4IU5SR4VTG35BW4OECCBF6TCOYEZZ4VI2GN7G2MCIH";
const issuerPub = "GAHXTZQNFDPCBAE3J5C7HFIVJDNCK6WT6NVVXTKT7LL4XX7HR3KQY2AP";
const distributedPriv = "SBSCK375Q462TDBZ4HA7G5ALDBCSECHI6ZZAUUJ3ZBVZASH2BJY3H5S2";
const distributedPub = "GA22JBNHV4DCXB54FUSUR2R5YGSAIREZZ6HTXQNMOPYUSEJ3ZO2SRPUJ";
const homeDomain = "dstock.kaopiz.com";
const totalSupply = "6000000000";

// Issuer
// SECRET: SDVRW6BK2AJNNGDQWBXK4YUWKWEVGZKZHEYJ5HWDNFLC35G4EX4C4JT4
// PUBLICGA4JL4EUCJS3N5PNMINXXV47SFA3OUBN7AQYV64C6FRU3YXJU6BR3WXP
// Receiver
// SECRET: SCFZK3AQNJT6WHMXE4I6Z4MR6XPXMPFORYNODS5MFLDYY3JGPB3UYWKA
// PUBLIC: GAQTLUYY3ZLRWVQZIJE5TM4K4TKIIWR5JJUOZRNNDN5WLDLSEOWMKWVE

(async function main() {
  // sendCoin(sourcePrivateKey, sourcePublicKey, destinationId, StellarSdk.Asset.native(), amount, message);
  // createNewAccount()
  issueAsset(issuerPriv, issuerPub, distributedPriv, distributedPub, homeDomain, totalSupply)
  // getBalance('GD3B5XV44PV2MTEH2TL3AOMELVFDSUUZ3D7M53RWNDK2NPTATQMJAIMR')
})()

function sendCoin(privateKey, from, to, assetType, amount, message) {
  const sourceKeys = StellarSdk.Keypair
    .fromSecret(privateKey);
  // Transaction will hold a built transaction we can resubmit if the result is unknown.
  var transaction;
  // First, check to make sure that the destination account exists.
  // You could skip this, but if the account does not exist, you will be charged
  // the transaction fee when the transaction fails.
  server.loadAccount(to)
    // If the account is not found, surface a nicer error message for logging.
    .catch(StellarSdk.NotFoundError, function (error) {
      throw new Error('The destination account does not exist!');
    })
    // If there was no error, load up-to-date information on your account.
    .then(function () {
      return server.loadAccount(sourceKeys.publicKey());
    })
    .then(function (sourceAccount) {
      // Start building the transaction.
      transaction = new StellarSdk.TransactionBuilder(sourceAccount, { fee: 100, networkPassphrase: StellarSdk.Networks.TESTNET })
        .addOperation(StellarSdk.Operation.payment({
          destination: to,
          // Because Stellar allows transaction in many currencies, you must
          // specify the asset type. The special "native" asset represents Lumens.
          asset: assetType,
          amount: amount
        }))
        // A memo allows you to add your own metadata to a transaction. It's
        // optional and does not affect how Stellar treats the transaction.
        .addMemo(StellarSdk.Memo.text(message))
        // Wait a maximum of three minutes for the transaction
        .setTimeout(180)
        .build();
      // Sign the transaction to prove you are actually the person sending it.
      transaction.sign(sourceKeys);
      // And finally, send it off to Stellar!
      return server.submitTransaction(transaction);
    })
    .then(function (result) {
      console.log('Success! Results:', result);
    })
    .then(function () {
      return getBalance(sourceKeys.publicKey())
    })
    .catch(function (error) {
      console.error('Something went wrong!', error);
      // If the result is unknown (no response body, timeout etc.) we simply resubmit
      // already built transaction:
      // server.submitTransaction(transaction);
    });
}

async function createNewAccount() {
  const pair = StellarSdk.Keypair.random();

  console.log('SECRET:', pair.secret());

  console.log('PUBLIC:', pair.publicKey());

  try {
    const response = await axios(
      `https://friendbot.stellar.org?addr=${encodeURIComponent(pair.publicKey())}`
    );
    console.log("SUCCESS! You have a new account :)\n", response.data);
  } catch (e) {
    console.error("ERROR!", e);
  }

  await getBalance(pair.publicKey());
}

async function getBalance(publicKey) {
  // the JS SDK uses promises for most actions, such as retrieving an account
  const account = await server.loadAccount(publicKey);
  console.log("Balances for account: " + publicKey);
  account.balances.forEach(function (balance) {
    console.log(balance);
  });
}

// async function changeTrust (privateKey, stockCode, issuer) {
//   server.loadAccount(receivingKeys.publicKey())
//   .then(function (receiver) {
//     var transaction = new StellarSdk.TransactionBuilder(receiver, {
//       fee: 100,
//       networkPassphrase: StellarSdk.Networks.TESTNET
//     })
//       // The `changeTrust` operation creates (or alters) a trustline
//       // The `limit` parameter below is optional
//       .addOperation(StellarSdk.Operation.changeTrust({
//         asset: dStock,
//         limit: '1000'
//       }))
//       // setTimeout is required for a transaction
//       .setTimeout(100)
//       .build();
//     transaction.sign(receivingKeys);
//     return server.submitTransaction(transaction);
//   })
//   .then(console.log)
// }

async function issueAsset(issuerPriv, issuerPub, distributedPriv, distributedPub, homeDomain, totalSupply) {
  // Keys for accounts to issue and receive the new asset
  var issuingKeys = StellarSdk.Keypair
    .fromSecret(issuerPriv);
  var receivingKeys = StellarSdk.Keypair
    .fromSecret(distributedPriv);

  // Keys for accounts to issue and receive the new asset
  var dStock = new StellarSdk.Asset(
    'DSTOCK', issuerPub);

  server.loadAccount(receivingKeys.publicKey())
    .then(function (receiver) {
      var transaction = new StellarSdk.TransactionBuilder(receiver, {
        fee: 100,
        networkPassphrase: StellarSdk.Networks.TESTNET
      })
        // The `changeTrust` operation creates (or alters) a trustline
        // The `limit` parameter below is optional
        .addOperation(StellarSdk.Operation.changeTrust({
          asset: dStock,
          limit: totalSupply
        }))
        // setTimeout is required for a transaction
        .setTimeout(100)
        .build();
      transaction.sign(receivingKeys);
      return server.submitTransaction(transaction);
    })
    .then(console.log)
    // Second, the issuing account actually sends a payment using the asset
    .then(function () {
      return server.loadAccount(issuingKeys.publicKey())
    })
    .then(function (issuer) {
      var transaction = new StellarSdk.TransactionBuilder(issuer, {
        fee: 100,
        networkPassphrase: StellarSdk.Networks.TESTNET
      })
        .addOperation(StellarSdk.Operation.payment({
          destination: receivingKeys.publicKey(),
          asset: dStock,
          amount: totalSupply
        }))
        // setTimeout is required for a transaction
        .setTimeout(100)
        .build();
      transaction.sign(issuingKeys);
      return server.submitTransaction(transaction);
    })
    .then(console.log)
    .then(function () {
      return server.loadAccount(issuingKeys.publicKey())
    })
    .then(function (issuer) {
      var transaction = new StellarSdk.TransactionBuilder(issuer, {
        fee: 100,
        networkPassphrase: StellarSdk.Networks.TESTNET
      })
        .addOperation(StellarSdk.Operation.setOptions({
          masterWeight: 1, // set master key weight
          lowThreshold: 1,
          medThreshold: 2, // a payment is medium threshold
          highThreshold: 2, // make sure to have enough weight to add up to the high threshold!
          setFlags: StellarSdk.AuthRequiredFlag,
          homeDomain: homeDomain
        }))
        // setTimeout is required for a transaction
        .setTimeout(100)
        .build();
      transaction.sign(issuingKeys);
      return server.submitTransaction(transaction);
    })
    .catch(function (error) {
      console.error('Error!', error);
    });
}




