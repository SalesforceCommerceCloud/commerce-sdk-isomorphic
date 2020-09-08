import React, {Component} from 'react';
import {ShopperSearch} from 'lib';
import classes from './App.module.css';

const searchClient = new ShopperSearch({
  baseUri: 'https://localhost:3000/search/shopper-search/v1',
  headers: {},
  parameters: {
    clientId: 'CLIENT_ID',
    organizationId: 'ORGANIZATION_ID',
    shortCode: 'SHORT_CODE',
    siteId: 'SITE_ID',
  },
});
console.log(searchClient);

class App extends Component {
  constructor(props) {
    super(props);
    this.searchClient = searchClient;
    this.state = {
      result: '',
      searchText: 'sony'
    }
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  } 

  handleChange(event) {
    this.setState({searchText: event.target.value});
  }

  handleSubmit(event) {
    this.doSearch(this.state.searchText)
    event.preventDefault();
  }

  getToken = async () => {
    const response = await fetch(
      `https://localhost:3000/customer/shopper-customers/v1/organizations/${this.searchClient.clientConfig.parameters.organizationId}/customers/actions/login?siteId=${this.searchClient.clientConfig.parameters.siteId}&clientId=${this.searchClient.clientConfig.parameters.clientId}`,
      {
        body: "{ \"type\": \"guest\" }",
        method: "POST",
        headers: { "Content-Type": "application/json" }
      }
    );
    this.state.token = response.headers.get('Authorization');
  }

  getSearchResults = async (text) => {
    await this.getToken();
    this.searchClient.clientConfig.headers.authorization = this.state.token;
    console.log(searchClient.clientConfig.headers);
    return await searchClient.productSearch({
      parameters: { q: text }
    });
  }

  async doSearch() {
    this.setState({result: 'searching...'});
    const response = await this.getSearchResults(this.state.searchText);
    console.log(response);
    const results = await response.json();
    console.log(results.hits[0]);
    if (results.hits[0]) {
      this.setState({...results.hits[0]})
    } else {
      this.setState({productId: null})
    }
  }

  async componentDidMount() {
    this.doSearch(this.state.searchText)
  }

  render() {
    return (
      <div className="{classes.search-component}">
        <form className="{classes.search-bar}" onSubmit={this.handleSubmit}>
          <label className="{classes.search-label}">
            Product Search 
            <input className="{classes.search-box}" type="text" value={this.state.searchTerm} onChange={this.handleChange} />
          </label>
          <input className="{classes.search-button}" type="submit" value="Search" />
        </form>
        <Product
          currency={this.state.currency}
          id={this.state.productId}
          name={this.state.productName}
          price={this.state.price}
        />
      </div>
    )
  }
}

function Product(props) {
  if (!props.id) {
    return (
      <div className="{classes.product-component}">
        <h3>Nothing!</h3>
      </div>
    )
  }

  return (
    <div className="{classes.product-component}">
      <h3>{props.name}</h3>
      <p className="{classes.product-price}">${props.price}<span className="{classes.product-currency}"> {props.currency}</span></p>
      <p className="{classes.product-id}">ID {props.id}</p>
    </div>
    );
}

export default App;
