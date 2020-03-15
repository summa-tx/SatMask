import { utils } from '@summa-tx/bitcoin-spv-js';
import * as sigs from './sigs';

function hash256(buf) {
  return utils.sha256(utils.sha256(buf));
}

export function wpkhWitness(pubkey, signature) {
  return utils.concatUint8Arrays(
    new Uint8Array([0x02, signature.length]),
    signature,
    new Uint8Array([33]), // always 33 bytes
    pubkey
  );
}

export function appendWitness(tx, pubkey, signature) {
  const timelock = utils.safeSlice(tx, tx.length - 4);
  const body = utils.safeSlice(tx, 0, tx.length - 4);
  return utils.concatUint8Arrays(
    body,
    wpkhWitness(pubkey, signature),
    timelock
  );
}

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
    new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x01]), // nsequence and len(vout)
    outputValue,
    outputScript,
    new Uint8Array([0x00, 0x00, 0x00, 0x00]) // nLockTime
  );
}

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


export async function makeSignedTx(
  outpoint,
  inputPKH,
  inputValue, // 8-byte LE
  outputValue, // 8-byte LE
  outputPKH
) {
  const tx = wpkhToWpkhTx(outpoint, inputPKH, outputValue, outputPKH);
  const sighash = wpkhToWpkhSighashAll(outpoint, inputPKH, inputValue, outputValue, outputPKH);

  const srvStr = await sigs.rawSign(sighash);
  const pubkey = sigs.recoverPubkey(srvStr); // pubkey is wrong here
  const signature = sigs.srvToDER(srvStr);

  return appendWitness(tx, pubkey, signature);
}
