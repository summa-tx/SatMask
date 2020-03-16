/* eslint-disable */
import { utils } from '@summa-tx/bitcoin-spv-js';
import React, { Component } from 'react';
// import logo from './logo.svg';
import './App.css';
import * as tx from './tx';
import * as sigs from './sigs';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';


class App extends Component {
  constructor() {
    super();
    this.state = {
      address: '',
      publicKey: '',
      outpoint: '',
      inputValue: '',
      outputValue: '',
      outputPKH: ''
    };

    this.submit = this.submit.bind(this);
    this.getPublicKey = this.getPublicKey.bind(this);
  }

  // TODO(starscream): could make this on pageload
  // using componentDidMount after bugs are sorted out
  async getPublicKey() {
    const publicKey = utils.serializeHex(await sigs.getPublicKey());
    this.setState({ publicKey: publicKey });
    this.setState({ address: this.state.pubkey });
  }

  async submit() {
    if (!this.state.publicKey || this.state.publicKey.length === 0) await this.getPublicKey();
    const pubkey = utils.deserializeHex(this.state.publicKey);
    const inputPKH = utils.ripemd160(utils.sha256(pubkey));

    const outpoint = utils.deserializeHex(this.state.outpoint);
    const inputValue = utils.deserializeHex(this.state.inputValue);
    const outputValue = utils.deserializeHex(this.state.outputValue);
    const outputPKH = utils.deserializeHex(this.state.outputPKH);
    const signedTx = await tx.makeSignedTx(
      outpoint,
      inputPKH,
      inputValue,
      outputValue,
      outputPKH
    );
    console.log(utils.serializeHex(signedTx));

    // TODO(starscream): easier to manage strings in state
    // deserialize here, pass along to tx.makeSignedTx
    console.log(this.state);
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">

          <Button
            variant="contained"
            color="primary"
            onClick={() => this.getPublicKey()}
          >
            Get Public Key
          </Button>

          <TextField
            label="Outpoint"
            onChange={(e) => this.setState({outpoint: e.target.value})}
            value={this.state.outpoint}
          />
          <TextField
            label="Input Value"
            onChange={(e) => this.setState({inputValue: e.target.value})}
            value={this.state.inputValue}
          />
          <TextField
            label="Output Value"
            onChange={(e) => this.setState({outputValue: e.target.value})}
            value={this.state.outputValue}
          />
          <TextField
            label="Output Pubkey Hash"
            onChange={(e) => this.setState({outputPKH: e.target.value})}
            value={this.state.outputPKH}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={() => this.submit()}
          >
            Submit
          </Button>
        </header>
      </div>
    );
  }
}

export default App;
