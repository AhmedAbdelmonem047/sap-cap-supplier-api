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
        // Create valid product first
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
});
