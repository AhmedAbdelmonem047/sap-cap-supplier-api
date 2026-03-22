# Supplier Product Management API

A fully functional Supplier Product Management API built using SAP CAP (Node.js) and TypeScript. 
This service allows users to manage suppliers, products, and product reviews. It automatically enriches new products with external data from a public API.

## Features & Bonuses Implemented
- **Core CAP Framework**: Built on SAP CAP (Node.js runtime) using SQLite for local persistence.
- **TypeScript**: The entire service and tests are written in TypeScript (`.ts`).
- **External API Integration**: Automatically fetches and applies `externalRating` from `fakestoreapi.com` on Product creation using asynchronous event handlers.
- **Custom Actions**: Includes a custom `submitReview` action to handle review creation and average rating calculation transactionally.
- **Authentication**: Custom authentication handling in `server.js` supporting both JWT (Bearer) and Basic Auth.
- **Fiori Elements UI**: Annotations provided in `app/annotations.cds` to automatically render Fiori UI previews.
- **Logging**: Production-ready logging using CAP's built-in `cds.log`.
- **Unit Testing**: Test suites written using Jest to validate service logic and event handlers.

## Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm` (Node Package Manager)

## Setup and Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Deploy the local database**:
   ```bash
   npx cds deploy --to sqlite
   ```
3. **Start the local development server**:
   ```bash
   npm run watch
   # or
   npx cds watch
   ```
4. The server will start at `http://localhost:4004`. The root page provides links to the OData endpoints and the Fiori Elements UI preview.

## Testing
To run the automated test suite using Jest:
```bash
npm run test
```

## Design Decisions & Trade-offs
- **TypeScript & Service Classes**: Decided to use ES6 classes extending `cds.ApplicationService` for the `CatalogService` implementation to leverage TypeScript's type-safety and object-oriented features.
- **Transactions & Atomicity**: The custom `submitReview` action uses `cds.tx()` to ensure that both the `ProductReview` creation and the `Products` average rating recalculation are atomic. If any step fails, the entire transaction rolls back.
- **Mocked DB in Tests**: SQLite is used for tests and local development to provide a fast and reliable development loop without requiring a heavy cloud DB instance.
- **Authentication**: The CDS schema uses `@requires:'admin'`. In local testing, `auth: "mocked"` is defined, but `server.js` implements real JWT verification. We intercept standard HTTP Basic Authentication to make it easy to test endpoints from browsers natively during development while enforcing JWT for API clients.

## Assumptions
- When integrating with the external `fakestoreapi.com`, category names are matched case-insensitively. 
- The external API might occasionally be slow or unavailable. The HTTP call has a hard timeout to ensure product creation is never blocked by a third-party failure. If it fails, the product is created successfully without the `externalRating`.
- Products inherit default values (0) for `averageRating` until reviews are submitted.

## Sample API Calls

> **Authentication:** First, obtain a JWT token by calling the login endpoint with any username and `admin` as the password. Then include the token in the `Authorization` header as `Bearer <token>` for all subsequent API calls.
>
> **Browser / Fiori UI:** When accessing the Fiori Elements UI preview in a browser, use any username and `admin` as the password in the Basic Auth popup.

```
POST /api/login
{ "username": "ahmed", "password": "admin" }
```

### Create a Supplier
```
POST /odata/v4/catalog/Suppliers
{ "name": "Acme Supplier", "email": "contact@acme.example.com", "rating": 4 }
```

### Create a Product
```
POST /odata/v4/catalog/Products
{ "name": "T-Shirt", "price": 29.99, "category": "clothing", "supplier_ID": "..." }
```

### List all Products
```
GET /odata/v4/catalog/Products
```

### Submit a Review
```
POST /odata/v4/catalog/submitReview
{ "productID": "...", "rating": 4, "comment": "Good quality" }
```