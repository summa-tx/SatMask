/* global describe it */
import { assert } from 'chai';
import { utils } from '@summa-tx/bitcoin-spv-js';

import { srvToDER } from '../src/sigs';


describe('utils', () => {
  describe('srvToDER', () => {
    it('converts signature format', () => {
      assert(
        utils.typedArraysAreEqual(
          srvToDER('0x7d278c09c3b765a8744f8824c060ebf0b872005077d87a92d9826d24d25b4765579d8f40e5a9010d1104da0872016669ac548621195ef2c682f9d3a1d8bf88121c'),
          new Uint8Array([48, 68, 2, 32, 87, 157, 143, 64, 229, 169, 1, 13, 17, 4, 218, 8, 114, 1,
            102, 105, 172, 84, 134, 33, 25, 94, 242, 198, 130, 249, 211, 161, 216, 191, 136, 18,
            2, 32, 125, 39, 140, 9, 195, 183, 101, 168, 116, 79, 136, 36, 192, 96, 235, 240, 184,
            114, 0, 80, 119, 216, 122, 146, 217, 130, 109, 36, 210, 91, 71, 101])
        ),
        'Bad signature conversion'
      );
    });
  });
});
