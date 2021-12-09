/* eslint-disable */
/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/* eslint-disable react/require-default-props */
// eslint-disable-next-line no-use-before-define
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { ShopperLogin, ShopperSearch } from 'lib';
import config from '../config';
import './App.css';

// For this client, we want to explicitly handle redirects.
const loginClient = new ShopperLogin({
  fetchOptions: { redirect: 'manual' },
  ...config
})
const searchClient = new ShopperSearch(config);


// PKCE Helpers ---------------------------------------------------------------

function generateRandomString(length) {
  let randomString = ""
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  for (let i = 0; i < length; i++) {
    randomString += possible.charAt(
      Math.floor(Math.random() * possible.length)
    )
  }
  return randomString
}

function _arrayBufferToBase64(buffer) {
  var binary = '';
  var bytes = new Uint8Array(buffer);
  var len = bytes.byteLength;
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

async function generateCodeChallenge(codeVerifier) {
  const encoder = new TextEncoder()
  const data = encoder.encode(codeVerifier)
  const digest = await window.crypto.subtle.digest('SHA-256', data)
  const base64Digest = _arrayBufferToBase64(digest)
  return base64Digest
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "")
}

const createCodeVerifier = () => generateRandomString(128)

// App ------------------------------------------------------------------------

const Product = ({ id = '', name = '', price = 0, currency = '' }) => (
  <div className="product-component">
    <h3>{name}</h3>
    <p className="product-price">
      ${price}
      <span className="product-currency"> {currency}</span>
    </p>
    <p className="product-id">
      ID
      {id}
    </p>
  </div>
);

Product.propTypes = {
  id: PropTypes.string,
  name: PropTypes.string,
  price: PropTypes.number,
  currency: PropTypes.string,
};
class App extends Component {
  constructor(props) {
    super(props);
    this.searchClient = searchClient;
    this.state = {
      searchText: 'sony',
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  async componentDidMount() {
    const { searchText } = this.state;
    this.doSearch(searchText);
  }

  handleChange(event) {
    this.setState({ searchText: event.target.value });
  }

  handleSubmit(event) {
    const { searchText } = this.state;
    this.doSearch(searchText);
    event.preventDefault();
  }

  async getSearchResults(text) {
    await this.getToken();
    const { token } = this.state;
    this.searchClient.clientConfig.headers.authorization = token;
    return searchClient.productSearch({
      parameters: { q: text },
    });
  }

  async getToken() {
    const code_verifier = createCodeVerifier()
    const code_challenge = await generateCodeChallenge(code_verifier)
    // We provide a URI here, but don't expect it to be called as we explicitly said we want to handle redirects
    // ourselves above.
    const redirect_uri = `https://localhost:3000/callback`
    const client_id = config.parameters.clientId

    const authorizeOptions = {
      headers: {
        "Content-Type": 'application/x-www-form-urlencoded',
      },
      parameters: {
        client_id,
        code_challenge,
        hint: "guest",
        redirect_uri,
        response_type: "code",
      },
    }

    const authorizeResponse =
      await loginClient.authorizeCustomer(
        authorizeOptions,
        true
      )

    // We expect this the response to not be redirected, but it is :S

    // const { usid, code } = Object.fromEntries(
    //   new URL(authorizeResponse.headers.get("location")).searchParams
    // )

    const { usid, code } = Object.fromEntries(
      new URL(authorizeResponse.url).searchParams
    )
    const tokenOptions = {
      headers: {
        "Content-Type": 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id,
        code_verifier,
        code,
        grant_type: "authorization_code_pkce",
        redirect_uri,
        usid,
      }),
    }
    const tokenResponse = await loginClient.getAccessToken(
      tokenOptions
    )
    
    const { access_token } = tokenResponse
    this.state.token = `Bearer ${access_token}`
  }

  async doSearch() {
    const { searchText } = this.state;
    const results = await this.getSearchResults(searchText);
    if (results.hits?.length) {
      this.setState({ ...results.hits[0] });
    } else {
      this.setState({ productId: null });
    }
  }

  render() {
    const { searchTerm, currency, productId, productName, price } = this.state;
    return (
      <div className="search-component">
        <form className="search-bar" onSubmit={this.handleSubmit}>
          <label className="search-label" htmlFor="item-search">
            Product Search
            <input
              id="item-search"
              className="search-box"
              type="text"
              value={searchTerm}
              onChange={this.handleChange}
            />
          </label>
          <input className="search-button" type="submit" value="Search" />
        </form>
        <Product
          currency={currency}
          id={productId}
          name={productName}
          price={price}
        />
      </div>
    );
  }
}

export default App;
