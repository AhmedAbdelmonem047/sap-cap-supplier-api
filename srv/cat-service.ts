import cds, { Request } from "@sap/cds";


export default class CatlogService extends cds.ApplicationService {
    async init() {

        // ********** Products Validation ********** //
        this.before(['CREATE', 'UPDATE'], 'Products', (req: Request) => {
            const { price } = req.data;
            if (price !== undefined && price <= 0) {
                req.error(400, 'Product price must be greater than 0');
            }
        });

        // ********** Supplies Validation ********** //
        this.before(['CREATE', 'UPDATE'], 'Suppliers', (req: Request) => {
            const { rating } = req.data;
            if (rating !== undefined && (rating < 1 || rating > 5)) {
                req.error(400, 'Supplier rating must be between 1 and 5');
            }
        });

        // ********** Reviews Validation ********** //
        this.before(['CREATE', 'UPDATE'], 'ProductReviews', (req: Request) => {
            const { rating } = req.data;
            if (rating !== undefined && (rating < 1 || rating > 5)) {
                req.error(400, 'Product review rating must be between 1 and 5');
            }
        });
    }
} 