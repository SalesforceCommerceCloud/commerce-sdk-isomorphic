# API Overview

The Shopper Stores API enables you to search for, and obtain details on stores. This allows shoppers to locate nearby stores for delivery or offline shopping, and to obtain store information that can be displayed to the shopper.

## Shopper Stores Use Cases

### Get Stores by Ids

Use the Shopper Stores API to gather information pertaining to a specific store(s).

For example, a customer wants to show a default list of a select few stores on their locations page. Each store is identified by its unique ID. The returned object is a pageable list of stores identified by the IDs passed in the request and their details, such as name, address, location, etc.

### Find Stores in an Area

Use the Shopper Stores API to locate stores within a specific area.

For example, a shopper wants to find all available stores in a specified area. The location from which the search is executed can be specified either using a combination of a country and ZIP code or a geolocation described by longitude and latitude values. In addition, a maximum distance from that location can be specified to limit the results. The returned object is a pageable list of stores and their details, such as name, address, location, etc.
