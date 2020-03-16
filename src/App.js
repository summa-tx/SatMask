/* eslint-disable */
import React from 'react';
import logo from './logo.svg';
import './App.css';
import * as tx from './tx';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <TextField label="test" />
        <TextField label="test" />
        <TextField label="test" />
        <TextField label="test" />
        <TextField label="test" />
        <Button variant="contained" color="primary">
          Submit
        </Button>
      </header>
    </div>
  );
}

export default App;
