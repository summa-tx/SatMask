/* eslint-disable */
import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import * as tx from './tx';
import * as sigs from './sigs';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';


class App extends Component {
  constructor() {
    super();
    this.state = {
      outpoint: '',
      inputPubkeyHash: '',
      inputValue: '',
      outputValue: '',
      outputPubkeyHash: ''
    }

    this.submit = this.submit.bind(this);
    this.getPublicKey = this.getPublicKey.bind(this);
  }

  // TODO(starscream): could make this on pageload
  // using componentDidMount after bugs are sorted out
  async getPublicKey() {
    const pubkey = await sigs.getPublicKey();
    console.log(pubkey)
  }

  submit() {
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
            label="Input Pubkey Hash"
            onChange={(e) => this.setState({inputPubkeyHash: e.target.value})}
            value={this.state.inputPubkeyHash}
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
            onChange={(e) => this.setState({outputPubkeyHash: e.target.value})}
            value={this.state.outputPubkeyHash}
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
