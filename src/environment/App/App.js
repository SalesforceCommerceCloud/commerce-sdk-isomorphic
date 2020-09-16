import React, {Component} from 'react';
import logo from './logo.svg';
import './App.css';

// Commerce SDK configuration
import {ShopperCustomers,ShopperSearch} from "lib";

const config = {
  proxy: 'https://localhost:3000',
  headers: {},
  parameters: {
    clientId: 'CLIENTID',
    organizationId: 'ORGID',
    shortCode: 'SHORTCODE',
    siteId: 'SITEID',
  },
}
const authClient = new ShopperCustomers({...config});
const client = new ShopperSearch({...config});
// End config

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      imageSrc: logo,
      text: "Edit src/App.js and save to reload."
    };
  } 

  // Commerce SDK Call
  async componentDidMount() {
    const authResponse = await authClient.authorizeCustomer({ body: { type: 'guest' } }, true);
    client.clientConfig.headers.authorization = authResponse.headers.get('authorization');

    const results = await client.productSearch({ parameters: { q: 'dress' } });
    this.setState({
      imageSrc: results.hits[0].image.link,
      text: results.hits[0].productName
    });
  }
  // End call

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
