import { utils } from '@summa-tx/bitcoin-spv-js';
import * as sigs from './sigs';

// Double SHA256. Used in many bitcoin operations.
function hash256(buf) {
  return utils.sha256(utils.sha256(buf));
}

// Build a witness from a pubkey and a signature
export function wpkhWitness(pubkey, signature) {
  return utils.concatUint8Arrays(
    new Uint8Array([0x02, signature.length + 1]),
    signature,
    new Uint8Array([0x01, 33]), // SIGHASH_ALL + pubkey is always 33 bytes
    pubkey
  );
}

// Append a witness built from a pubkey and a signature to the transaction
export function appendWitness(tx, pubkey, signature) {
  const timelock = utils.safeSlice(tx, tx.length - 4);
  const body = utils.safeSlice(tx, 0, tx.length - 4);
  return utils.concatUint8Arrays(
    body,
    wpkhWitness(pubkey, signature),
    timelock
  );
}

// Build an unsigned transaction that spends a specified input and creates a
// specified output.
export function wpkhToWpkhTx(
  outpoint,
  inputPKH,
  outputValue, // 8-byte LE
  outputPKH
) {
  const outputScript = utils.concatUint8Arrays(
    new Uint8Array([0x16, 0x00, 0x14]), // wpkh prefix
    outputPKH
  );
  return utils.concatUint8Arrays(
    new Uint8Array([0x01, 0x00, 0x00, 0x00, 0x00, 0x01, 0x01]), // version, flag, len(vin)
    outpoint,
    new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x01]), // 0 scriptSig, nsequence and len(vout)
    outputValue,
    outputScript,
    new Uint8Array([0x00, 0x00, 0x00, 0x00]) // nLockTime
  );
}

// Calculate the sighash for the 0th input of a 1-input 1-output tx.
export function wpkhToWpkhSighashAll(
  outpoint,
  inputPKH,
  inputValue, // 8-byte LE
  outputValue, // 8-byte LE
  outputPKH
) {
  const scriptCode = utils.concatUint8Arrays(
    new Uint8Array([0x19, 0x76, 0xa9, 0x14]), // length, dup, hash160, pkh_length
    inputPKH,
    new Uint8Array([0x88, 0xac]) // equal, checksig
  );
  const outputScript = utils.concatUint8Arrays(
    new Uint8Array([0x16, 0x00, 0x14]), // wpkh prefix
    outputPKH
  );
  const hashOutputs = hash256(utils.concatUint8Arrays(
    outputValue,
    outputScript
  ));
  const sighashPreimage = utils.concatUint8Arrays(
    new Uint8Array([0x01, 0x00, 0x00, 0x00]), // version
    hash256(outpoint),
    utils.deserializeHex('8cb9012517c817fead650287d61bdd9c68803b6bf9c64133dcab3e65b5a50cb9'), // hashSequence(00000000)
    outpoint,
    scriptCode,
    inputValue,
    new Uint8Array([0x00, 0x00, 0x00, 0x00]), // input nSequence
    hashOutputs,
    new Uint8Array([0x00, 0x00, 0x00, 0x00]), // nLockTime
    new Uint8Array([0x01, 0x00, 0x00, 0x00]) // SIGHASH_ALL
  );
  return hash256(sighashPreimage);
}

// Builds a signed transaction that spends a specified input and creates a
// specified output. This is the core business logic of the Bitcoin signer.
export async function makeSignedTx(
  outpoint,
  inputPKH,
  inputValue, // 8-byte LE
  outputValue, // 8-byte LE
  outputPKH
) {
  // Make a transaction
  const tx = wpkhToWpkhTx(outpoint, inputPKH, outputValue, outputPKH);

  // Calculate its sighash
  const sighash = wpkhToWpkhSighashAll(outpoint, inputPKH, inputValue, outputValue, outputPKH);

  // Get an RSV signture on that sighash
  const rsvStr = await sigs.rawSign(sighash);

  // Recover the public key from the signature
  const pubkey = sigs.recoverPubkey(sighash, rsvStr);

  // Translate the signature to DER-encoding for use in Bitcoin
  const signature = sigs.rsvToDER(rsvStr);

  // Append the signature to the transaction.
  return appendWitness(tx, pubkey, signature);
}
