/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { ShopperCustomers, ShopperSearch } from 'lib';
import config from '../config';
import './App.css';

const customerClient = new ShopperCustomers(config);
const searchClient = new ShopperSearch(config);

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

  getToken = async () => {
    const authResponse = await customerClient.authorizeCustomer({ body: { type: 'guest' } }, true);
    this.state.token = authResponse.headers.get('authorization');
  }

  getSearchResults = async (text) => {
    await this.getToken();
    const { token } = this.state;
    this.searchClient.clientConfig.headers.authorization = token;
    return searchClient.productSearch({
      parameters: { q: text },
    });
  }

  handleSubmit(event) {
    const { searchText } = this.state;
    this.doSearch(searchText);
    event.preventDefault();
  }

  handleChange(event) {
    this.setState({ searchText: event.target.value });
  }

  async doSearch() {
    const { searchText } = this.state;
    const results = await this.getSearchResults(searchText);
    if (results?.hits[0]) {
      this.setState({ ...results.hits[0] });
    } else {
      this.setState({ productId: null });
    }
  }

  render() {
    const {
      searchTerm, currency, productId, productName, price,
    } = this.state;
    return (
      <div className="search-component">
        <form className="search-bar" onSubmit={this.handleSubmit}>
          <label className="search-label" htmlFor="item-search">
            Product Search
            <input id="item-search" className="search-box" type="text" value={searchTerm} onChange={this.handleChange} />
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

function Product(props) {
  const {
    id, name, price, currency,
  } = props;
  if (!id) {
    return (
      <div className="product-component">
        <h3>Nothing!</h3>
      </div>
    );
  }

  return (
    <div className="product-component">
      <h3>{name}</h3>
      <p className="product-price">
        $
        {price}
        <span className="product-currency">
          {' '}
          {currency}
        </span>
      </p>
      <p className="product-id">
        ID
        {id}
      </p>
    </div>
  );
}

Product.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  price: PropTypes.number.isRequired,
  currency: PropTypes.string.isRequired,
};

export default App;
