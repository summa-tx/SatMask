import { utils } from '@summa-tx/bitcoin-spv-js';
import * as ethUtil from 'ethereumjs-util';


export function getProvider() {
  return window.ethereum;
}

export function extractVRS(srvStr) {
  let srv = '';
  if (utils.safeSlice(srvStr, 0, 2) === '0x') {
    srv = utils.safeSlice(srvStr, 2);
  } else {
    srv = srvStr;
  }

  let s = utils.deserializeHex(utils.safeSlice(srv, 0, 64));
  let r = utils.deserializeHex(utils.safeSlice(srv, 64, 128));
  const v = utils.safeSlice(srv, srv.length - 1)[0];

  // Trim to minimal encoding.
  // If there is a leading 0 and the next bit is 0, trim the lead.
  while (s[0] === 0 && s[1] & 0x80 !== 0) {
    s = utils.safeSlice(s, 1);
  }
  while (r[0] === 0 && r[1] & 0x80 !== 0) {
    r = utils.safeSlice(r, 1);
  }
  return { v, r, s };
}

export function recoverPubkey(msgHash, srvStr) {
  const { v, r, s } = extractVRS(srvStr);
  return ethUtil.ecrecover(msgHash, v, r, s);
}

export function recoverPersonal(message, srvStr) {
  const msgHash = ethUtil.hashPersonalMessage(message);
  return recoverPubkey(msgHash, srvStr);
}

// Transform eth_sign result to a DER signature
export function srvToDER(srvStr) {
  const { r, s } = extractVRS(srvStr);

  const encR = utils.concatUint8Arrays(new Uint8Array([0x02, r.length]), r);
  const encS = utils.concatUint8Arrays(new Uint8Array([0x02, s.length]), s);

  return utils.concatUint8Arrays(
    new Uint8Array([0x30, encR.length + encS.length]),
    encR,
    encS
  );
}

export async function getPublicKey() {
  const provider = getProvider();
  const message = 'Allow this page to view your Bitcoin public key.';
  const currentAccount = await provider.enable()[0];

  return new Promise((resolve, reject) => {
    const cb = (err, result) => {
      if (err) reject(err);

      const signature = result.result;
      const pubkey = recoverPersonal(message, signature);
      resolve(pubkey);
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
  const currentAccount = await provider.enable()[0];

  return new Promise((resolve, reject) => {
    const cb = (err, result) => {
      if (err) reject(err);

      const signature = result.result;
      resolve(signature);
    };
    provider.sendAsync({
      method: 'eth_sign',
      params: [currentAccount, hexDigest]
    }, cb);
  });
}
