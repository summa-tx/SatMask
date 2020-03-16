/* global BigInt */
import * as ethUtil from 'ethereumjs-util';
import { publicKeyConvert } from 'secp256k1';
import { utils } from '@summa-tx/bitcoin-spv-js';


export const CURVE_ORDER = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141');


export function getProvider() {
  return window.ethereum;
}

// extracts v as number, RS as Uint8Arrays
export function extractVRS(rsvStr) {
  let srv = '';
  if (utils.safeSlice(rsvStr, 0, 2) === '0x') {
    srv = utils.safeSlice(rsvStr, 2);
  } else {
    srv = rsvStr;
  }

  const r = utils.deserializeHex(utils.safeSlice(srv, 0, 64));
  const s = utils.deserializeHex(utils.safeSlice(srv, 64, 128));
  const v = utils.deserializeHex(utils.safeSlice(srv, srv.length - 2))[0];

  return { v, r, s };
}

// recovers the COMPRESSED public key
export function recoverPubkey(msgHash, rsvStr) {
  const { v, r, s } = extractVRS(rsvStr);
  const rawKey = ethUtil.ecrecover(
    Buffer.from(msgHash),
    v,
    Buffer.from(r),
    Buffer.from(s)
  );
  const prefixedKey = utils.concatUint8Arrays(
    new Uint8Array([0x04]),
    rawKey
  );
  return publicKeyConvert(Buffer.from(prefixedKey));
}

export function recoverPersonal(message, rsvStr) {
  const msgBuf = Buffer.from(message, 'utf-8');
  const msgHash = ethUtil.hashPersonalMessage(msgBuf);
  return recoverPubkey(msgHash, rsvStr);
}

// Transform eth_sign result to a DER signature
export function srvToDER(rsvStr) {
  let { r, s } = extractVRS(rsvStr);

  // If S is non-canoncial, lower it
  let sBigInt = utils.bytesToUint(s);
  console.log({ sBigInt });
  console.log({ half: CURVE_ORDER / BigInt(2) });
  if (sBigInt > CURVE_ORDER / BigInt(2)) {
    sBigInt = CURVE_ORDER - sBigInt;
    s = utils.deserializeHex((sBigInt.toString(16)));
  }

  // Trim to minimal encoding.
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

// Should be used on setup and you should key to state
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

// expects a Uint8Array input
// returns a hex string
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
