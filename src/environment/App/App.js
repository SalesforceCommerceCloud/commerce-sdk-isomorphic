import React, {Component} from 'react';
import {ShopperSearch} from 'lib';
import {config} from '../config';
import './App.css';

const searchClient = new ShopperSearch(config);
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
      `/customer/shopper-customers/v1/organizations/${this.searchClient.clientConfig.parameters.organizationId}/customers/actions/login?siteId=${this.searchClient.clientConfig.parameters.siteId}&clientId=${this.searchClient.clientConfig.parameters.clientId}`,
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
    const results = await this.getSearchResults(this.state.searchText);
    console.log(results?.hits[0]);
    if (results?.hits[0]) {
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
      <div className="search-component">
        <form className="search-bar" onSubmit={this.handleSubmit}>
          <label className="search-label">
            Product Search 
            <input className="search-box" type="text" value={this.state.searchTerm} onChange={this.handleChange} />
          </label>
          <input className="search-button" type="submit" value="Search" />
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
      <div className="product-component">
        <h3>Nothing!</h3>
      </div>
    )
  }

  return (
    <div className="product-component">
      <h3>{props.name}</h3>
      <p className="product-price">${props.price}<span className="product-currency"> {props.currency}</span></p>
      <p className="product-id">ID {props.id}</p>
    </div>
    );
}

export default App;
