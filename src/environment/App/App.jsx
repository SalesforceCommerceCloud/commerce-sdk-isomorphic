/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/* eslint-disable react/require-default-props */
// eslint-disable-next-line no-use-before-define
import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {ShopperLogin, ShopperSearch} from 'lib';
import * as slasHelper from 'lib/helpers/slasHelper';
import config from '../config';
import './App.css';

const slasClient = new ShopperLogin(config);
const searchClient = new ShopperSearch(config);

const Product = ({id = '', name = '', price = 0, currency = ''}) => (
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
    const {searchText} = this.state;
    this.doSearch(searchText);
  }

  handleChange(event) {
    this.setState({searchText: event.target.value});
  }

  handleSubmit(event) {
    const {searchText} = this.state;
    this.doSearch(searchText);
    event.preventDefault();
  }

  async getSearchResults(text) {
    await this.getToken();
    const {token} = this.state;
    this.searchClient.clientConfig.headers.authorization = token;
    return searchClient.productSearch({
      parameters: {q: text},
    });
  }

  async getToken() {
    const authResponse = await slasHelper.loginGuestUser(slasClient, {
      redirectURI: new URL('/callback', window.location).href,
    });
    this.state.token = `Bearer ${authResponse.access_token}`;
  }

  async doSearch() {
    const {searchText} = this.state;
    const results = await this.getSearchResults(searchText);
    if (results?.hits[0]) {
      this.setState({...results.hits[0]});
    } else {
      this.setState({productId: null});
    }
  }

  render() {
    const {searchTerm, currency, productId, productName, price} = this.state;
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
