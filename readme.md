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

Below are `curl` requests covering the primary requirements. Note: The authorization header below uses basic auth (`admin:admin`).

### 1. Create a Supplier
```bash
curl -X POST http://localhost:4004/odata/v4/catalog/Suppliers \
  -H "Authorization: Basic YWRtaW46YWRtaW4=" \
  -H "Content-Type: application/json" \
  -d '{ 
    "name": "Acme Supplier", 
    "email": "contact@acme.example.com", 
    "rating": 4 
  }'
```

### 2. Create a Product
```bash
# First, you might need a supplier ID (UUID). Let's assume you've fetched or created one.
curl -X POST http://localhost:4004/odata/v4/catalog/Products \
  -H "Authorization: Basic YWRtaW46YWRtaW4=" \
  -H "Content-Type: application/json" \
  -d '{ 
    "name": "Mens Casual T-Shirt", 
    "price": 29.99, 
    "category": "men'\''s clothing", 
    "supplier_ID": "e0a6dffe-3b95-46f4-b91c-84092b71abce" 
  }'
```

### 3. List all Products
```bash
curl -X GET http://localhost:4004/odata/v4/catalog/Products \
  -H "Authorization: Basic YWRtaW46YWRtaW4="
```

### 4. Submit a Review (Custom Action)
```bash
curl -X POST http://localhost:4004/odata/v4/catalog/submitReview \
  -H "Authorization: Basic YWRtaW46YWRtaW4=" \
  -H "Content-Type: application/json" \
  -d '{ 
    "productID": "e1f13aab-61d0-42ba-823b-0937a0bc0f1c", 
    "rating": 5, 
    "comment": "Excellent quality for the price!" 
  }'
```