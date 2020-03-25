# SatMask

Proof of Concept code for signing Bitcoin transactions via MetaMask.

DO NOT USE THIS CODE IN PRODUCTION.

### How it works

MetaMask's `eth_sign` api allows the user to sign arbitrary digests. Unlike
geth, it does not modify or hash the argument. This means we can calculate the
sighash of a Bitcoin transaction and pass it to `eth_sign`. After that, we
need to translate the signature from Ethereum's hex-encoded RSV standard to
Bitcoin's DER-Encoded RS format, and add the signature to the transaction.

Calculating the sighash requires knowledge of the public key that will sign,
so an extra `personal_sign` call is made. This generates a signature from which
we can recover the users' pubkey to use in the sighash algorithm.

The current version signs only transactions with 1 witness pubkeyhash input and
one witness pubkeyhash output. The resulting transaction is logged to console.

### A brief tour of the codebase

- `src/tx.js` handles transaction datastructure manipulation. This includes
construction, sighash serialization, and adding the signature to the
transaction (inside a witness).

- `src/sigs.js` handles interfacing with MetaMask, retrieving the signature,
and translating from RSV to DER.

- `src/App.js` is a simple react app that provides a convenient interface for
specifying a transaction. All credit to [@tynes](https://github.com/tynes/) for
this part :)


### How to run it

Don't. Like really don't. Read the code, but don't run it.
