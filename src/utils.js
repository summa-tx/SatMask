
import { utils } from '@summa-tx/bitcoin-spv-js';

export const SEVEN = 7;

// Transform eth_sign result to a DER signature
export function srvToDER(srvStr) {
  let srv = '';
  if (utils.safeSlice(srvStr, 0, 2) === '0x') {
    srv = utils.safeSlice(srvStr, 2);
  } else {
    srv = srvStr;
  }
  let s = utils.deserializeHex(utils.safeSlice(srv, 0, 64));
  let r = utils.deserializeHex(utils.safeSlice(srv, 64, 128));

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
