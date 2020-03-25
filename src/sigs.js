/* global BigInt */
import * as ethUtil from 'ethereumjs-util';
import { publicKeyConvert } from 'secp256k1';
import { utils } from '@summa-tx/bitcoin-spv-js';

// The curve order of secp256k1
export const CURVE_ORDER = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141');

// Get a reference to the MetaMask provider
export function getProvider() {
  return window.ethereum;
}

// extracts v as number, RS as 32-byte Uint8Arrays
export function extractVRS(rsvStr) {
  let rsv = '';
  if (utils.safeSlice(rsvStr, 0, 2) === '0x') {
    rsv = utils.safeSlice(rsvStr, 2);
  } else {
    rsv = rsvStr;
  }

  const r = utils.deserializeHex(utils.safeSlice(rsv, 0, 64));
  const s = utils.deserializeHex(utils.safeSlice(rsv, 64, 128));
  const v = utils.deserializeHex(utils.safeSlice(rsv, rsv.length - 2))[0];

  return { v, r, s };
}

// Recovers the PREFIXED COMPRESSED public key from a Ethereum-formatted RSV
// Signature and the associated message hash.
export function recoverPubkey(msgHash, rsvStr) {
  const { v, r, s } = extractVRS(rsvStr);
  const rawKey = ethUtil.ecrecover(
    Buffer.from(msgHash),
    v,
    Buffer.from(r),
    Buffer.from(s)
  );

  // Ethereum pubkeys are raw (unprefixed). 0x04 is the standard prefix for an
  // uncompressed public key. Many libraries will not handle unprefixed keys.
  const prefixedKey = utils.concatUint8Arrays(
    new Uint8Array([0x04]),
    rawKey
  );
  return publicKeyConvert(Buffer.from(prefixedKey));
}

// Recover the PREFIXED COMPRESSED public key from a Ethereum-formatted RSV
// Signature and the associated message. Uses the `Ethereum Signed Message:`
// prefix as in get and `personal_sign`.
export function recoverPersonal(message, rsvStr) {
  const msgBuf = Buffer.from(message, 'utf-8');
  const msgHash = ethUtil.hashPersonalMessage(msgBuf);
  return recoverPubkey(msgHash, rsvStr);
}

// Transform eth_sign RSV result to a canonical DER signature
export function rsvToDER(rsvStr) {
  let { r, s } = extractVRS(rsvStr);

  // If S is non-canoncial, lower it. Unsure if this is neccessary. Does
  // Ethereum use canonical low-S signatures?
  let sBigInt = utils.bytesToUint(s);
  if (sBigInt > CURVE_ORDER / BigInt(2)) {
    sBigInt = CURVE_ORDER - sBigInt;
    s = utils.deserializeHex((sBigInt.toString(16)));
  }

  // DER-encoded integers use a minimal signed encoding.
  // If there is a leading 0 and the next bit is 0, trim the lead.
  while (s[0] === 0 && s[1] & 0x80 !== 0) {
    s = utils.safeSlice(s, 1);
  }
  while (r[0] === 0 && r[1] & 0x80 !== 0) {
    r = utils.safeSlice(r, 1);
  }

  const encR = utils.concatUint8Arrays(new Uint8Array([0x02, r.length]), r);
  const encS = utils.concatUint8Arrays(new Uint8Array([0x02, s.length]), s);

  return utils.concatUint8Arrays(
    new Uint8Array([0x30, encR.length + encS.length]),
    encR,
    encS
  );
}

// Get the public key associated with the current MetaMask account. We do this
// by requesting that the user sign a message, and then recovering the public
// key from the signature on that message. Using `personal_sign` ensures that
// the user is shown the message, and has a chance to read it and decline.
export async function getPublicKey() {
  const provider = getProvider();
  const message = 'Allow this page to view your Bitcoin public key.';
  const currentAccount = (await provider.enable())[0];

  return new Promise((resolve, reject) => {
    const cb = (err, result) => {
      if (err) return reject(err);

      const signature = result.result;
      const pubkey = recoverPersonal(message, signature);
      return resolve(pubkey);
    };
    provider.sendAsync({
      method: 'personal_sign',
      params: [currentAccount, message]
    }, cb);
  });
}

// Sign a raw digest useing `eth_sign`. `rawDigest` is a Uint8Array, and should
// be 32 bytes long. Will return a hex-encoded signature on the digest. This is
// the function we use to generate Bitcoin signatures
export async function rawSign(rawDigest) {
  const provider = getProvider();
  const hexDigest = utils.serializeHex(rawDigest);
  const currentAccount = (await provider.enable())[0];

  return new Promise((resolve, reject) => {
    const cb = (err, result) => {
      if (err) return reject(err);

      const signature = result.result;
      return resolve(signature);
    };
    provider.sendAsync({
      method: 'eth_sign',
      params: [currentAccount, hexDigest]
    }, cb);
  });
}
