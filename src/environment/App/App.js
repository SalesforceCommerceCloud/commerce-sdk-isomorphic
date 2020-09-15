import React, {Component} from 'react';
import logo from './logo.svg';
import './App.css';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      imageSrc: logo,
      text: "Edit src/App.js and save to reload."
    };
  } 

  render() {
    return (
      <div className="App">
      <header className="App-header">
        <img src={this.state.imageSrc} className="App-logo" alt="logo" />
        <p>
          {this.state.text}
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
        </a>
      </header>
    </div>
    )
  }
}

export default App;
