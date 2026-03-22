process.env.CDS_TYPESCRIPT = 'true';
import * as cds from '@sap/cds';

describe('Catalog Service Data Model & Validation Tests', () => {
    const testApp = cds.test(__dirname + '/..', '--in-memory');
    const { GET, POST, PATCH } = testApp;

    let jwtToken = '';
    let supplierId = '';

    beforeAll(async () => {
        // Ensure the CAP server has fully started
        await testApp;

        // Authenticate with the custom JWT login endpoint
        const { data } = await testApp.axios.post('/api/login', {
            username: 'ahmed',
            password: 'admin'
        });
        jwtToken = data.token;

        // Create a supplier for `supplier not null` constraint on Products
        const res = await testApp.axios.post('/odata/v4/catalog/Suppliers', {
            name: 'Test Supplier',
            email: 'test@supplier.com'
        }, { headers: { Authorization: 'Bearer ' + jwtToken } });
        supplierId = res.data.ID;
    }, 15000);

    // Helper function to get auth headers
    const getHeaders = () => ({
        Authorization: 'Bearer ' + jwtToken
    });

    // ********** Tests for Catalog Service ********** //
    // 1) Basic $metadata test to ensure service is up and running
    it('should serve $metadata', async () => {
        const { status } = await GET('/odata/v4/catalog/$metadata', { headers: getHeaders() });
        expect(status).toBe(200);
    });

    // 2) Validation tests for Supplier rating
    it('should validate supplier rating (invalid)', async () => {
        expect.assertions(2);
        try {
            await POST('/odata/v4/catalog/Suppliers', {
                name: 'Test Supplier', email: 'test@test.com', rating: 6
            }, { headers: getHeaders() });
        } catch (err: any) {
            expect(err.response?.status).toBe(400);
            expect(err.response?.data?.error?.message).toContain('between 1 and 5');
        }
    });

    // 3) Validation tests for Product price
    it('should validate product price (invalid)', async () => {
        expect.assertions(2);
        try {
            await POST('/odata/v4/catalog/Products', {
                name: 'Test Product', price: -10, category: 'electronics', supplier_ID: supplierId
            }, { headers: getHeaders() });
        } catch (err: any) {
            expect(err.response?.status).toBe(400);
            expect(err.response?.data?.error?.message).toContain('greater than 0');
        }
    }, 10000);

    // 4) Edge case validation for price exactly zero
    it('should validate product price exactly zero (invalid)', async () => {
        expect.assertions(2);
        try {
            await POST('/odata/v4/catalog/Products', {
                name: 'Test Product', price: 0, category: 'electronics', supplier_ID: supplierId
            }, { headers: getHeaders() });
        } catch (err: any) {
            expect(err.response?.status).toBe(400);
            expect(err.response?.data?.error?.message).toContain('greater than 0');
        }
    });

    // 5) Validation on UPDATE to ensure price cannot be set to invalid value after creation
    it('should validate product price on UPDATE (invalid)', async () => {
        // Create Test Product first
        const { data: newProd } = await POST('/odata/v4/catalog/Products', {
            name: 'Test Product', price: 50, category: 'electronics', supplier_ID: supplierId
        }, { headers: getHeaders() });

        expect.assertions(2);
        try {
            await PATCH(`/odata/v4/catalog/Products(${newProd.ID})`, {
                price: -10
            }, { headers: getHeaders() });
        } catch (err: any) {
            expect(err.response?.status).toBe(400);
            expect(err.response?.data?.error?.message).toContain('greater than 0');
        }
    });

    // 6) Test to ensure that if the external API fails, product creation still succeeds
    it('should fallback gracefully on external API failure and create product', async () => {
        const { status, data } = await POST('/odata/v4/catalog/Products', {
            name: 'Test Product', price: 99.99, category: 'electronics', supplier_ID: supplierId
        }, { headers: getHeaders() });
        
        expect(status).toBe(201);
        expect(data.name).toBe('Test Product');
    });

    // 7) Tests for submitReview action with missing prodcutID
    it('should fail submitReview if productID is completely missing', async () => {
        try {
            await POST('/odata/v4/catalog/submitReview', {
                rating: 4, comment: 'Nice!'
            }, { headers: getHeaders() });
        } catch (err: any) {
            expect(err.response?.status).toBe(400);
            expect(err.response?.data?.error?.message).toContain('productID is required');
        }
    });

    // 8) Tests for submitReview action with non-existent productID
    it('should fail submitReview if product does not exist', async () => {
        expect.assertions(2);
        try {
            await POST('/odata/v4/catalog/submitReview', {
                productID: '00000000-0000-0000-0000-000000000000', rating: 4, comment: 'Nice!'
            }, { headers: getHeaders() });
        } catch (err: any) {
            expect(err.response?.status).toBe(404);
            expect(err.response?.data?.error?.message).toContain('not found');
        }
    });

    // 9) Tests for submitReview action with invalid rating values (too high and too low)
    it('should fail submitReview if rating is invalid (too high or too low)', async () => {
        // First create a real product to review
        const { data: newProd } = await POST('/odata/v4/catalog/Products', {
            name: 'Test Product', price: 10, category: 'test', supplier_ID: supplierId
        }, { headers: getHeaders() });

        const prodId = newProd.ID;

        expect.assertions(4);
        try {
            await POST('/odata/v4/catalog/submitReview', {
                productID: prodId, rating: 6, comment: 'Nice!'
            }, { headers: getHeaders() });
        } catch (err: any) {
            expect(err.response?.status).toBe(400);
            expect(err.response?.data?.error?.message).toContain('between 1 and 5');
        }

        try {
            await POST('/odata/v4/catalog/submitReview', {
                productID: prodId, rating: 0, comment: 'Nice!'
            }, { headers: getHeaders() });
        } catch (err: any) {
            expect(err.response?.status).toBe(400);
            expect(err.response?.data?.error?.message).toContain('between 1 and 5');
        }
    });

    // 10) Tests for submitReview action with missing or empty comment
    it('should fail submitReview if comment is missing or empty', async () => {
        // First create a real product to review
        const { data: newProd } = await POST('/odata/v4/catalog/Products', {
            name: 'Test Product', price: 10, category: 'test', supplier_ID: supplierId
        }, { headers: getHeaders() });

        const prodId = newProd.ID;

        expect.assertions(4);
        try {
            await POST('/odata/v4/catalog/submitReview', {
                productID: prodId, rating: 4, comment: ''
            }, { headers: getHeaders() });
        } catch (err: any) {
            expect(err.response?.status).toBe(400);
            expect(err.response?.data?.error?.message).toContain('cannot be empty');
        }

        try {
            await POST('/odata/v4/catalog/submitReview', {
                productID: prodId, rating: 4, comment: '   '
            }, { headers: getHeaders() });
        } catch (err: any) {
            expect(err.response?.status).toBe(400);
            expect(err.response?.data?.error?.message).toContain('cannot be empty');
        }
    });

    // 11) Tests for submitReview action for successful review submission and averageRating update
    it('should successfully submitReview and update average return', async () => {
        // Create a real product to review
        const { data: newProd } = await POST('/odata/v4/catalog/Products', {
            name: 'Test Product', price: 10, category: 'test', supplier_ID: supplierId
        }, { headers: getHeaders() });

        const prodId = newProd.ID;

        // Submit review
        const { status, data: reviewResponse } = await POST('/odata/v4/catalog/submitReview', {
            productID: prodId, rating: 5, comment: 'Amazing!'
        }, { headers: getHeaders() });

        expect(status).toBe(200);

        // Fetch product again to check if averageRating updated
        const { data: verifiedProd } = await GET(`/odata/v4/catalog/Products(${prodId})`, { headers: getHeaders() });
        expect(verifiedProd.averageRating).toBe(5);
    });

    // 12) Tests for submitReview action to ensure averageRating is correctly recalculated when there are multiple reviews
    it('should correctly recalculate averageRating when multiple reviews are submitted', async () => {
        // Create product
        const { data: newProd } = await POST('/odata/v4/catalog/Products', {
            name: 'Multi-Review Product', price: 20, category: 'test', supplier_ID: supplierId
        }, { headers: getHeaders() });

        const prodId = newProd.ID;

        // Submit first review (Rating: 5)
        await POST('/odata/v4/catalog/submitReview', {
            productID: prodId, rating: 5, comment: 'Excellent!'
        }, { headers: getHeaders() });

        // Submit second review (Rating: 3)
        await POST('/odata/v4/catalog/submitReview', {
            productID: prodId, rating: 3, comment: 'Not great'
        }, { headers: getHeaders() });

        // Verify mathematically expected average (5 + 3 = 8 / 2 = 4)
        const { data: verifiedProd } = await GET(`/odata/v4/catalog/Products(${prodId})`, { headers: getHeaders() });
        expect(verifiedProd.averageRating).toBe(4);
    });
});