import cds, { Request } from "@sap/cds";
import axios from "axios";


export default class CatlogService extends cds.ApplicationService {
    async init() {
        const { Products, ProductReviews } = this.entities;

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

        // ******* External API Integration ******* //
        this.before('CREATE', 'Products', async (req: Request) => {
            const { category } = req.data;
            // 1) Only attempt external api integration if category exists
            if (category) {
                try {
                    // 2) Fetch products using axios
                    const response = await axios.get('https://fakestoreapi.com/products');
                    const products = response.data;

                    // 3) Find the first product that matches the category and extract its rating and assign it to the new product being created
                    const matchedProduct = products.find((p: any) => p.category === category);
                    if (matchedProduct && matchedProduct.rating && matchedProduct.rating.rate)
                        req.data.externalRating = matchedProduct.rating.rate;

                } catch (error) {
                    console.warn('Failed to fetch from external API, ignoring error to maintain creation.', error);
                }
            }
        });

        // ********* submitReview Action ********** //
        this.on('submitReview', async (req: Request) => {
            const { productID, rating, comment } = req.data;

            // 1) Validation on ProductId and Rating
            if (!productID)
                return req.error(400, 'productID is required');

            if (rating === undefined || rating < 1 || rating > 5)
                return req.error(400, 'Rating must be between 1 and 5');

            // 2) Creating a new tranasction to ensure atomicity (all or nothing)
            const tx = cds.tx(req);

            // 3) Fetch the product to ensure it exists
            const existingProduct = await tx.run(SELECT.one.from(Products).where({ ID: productID }));
            if (!existingProduct)
                return req.error(404, `Product with ID ${productID} not found`);

            // 4) Create a new review entry and insert it into ProductReviews
            const newReview = {
                product_ID: productID,
                rating,
                comment,
                reviewer: req.user?.id || 'anonymous'
            };

            await tx.run(INSERT.into(ProductReviews).entries(newReview));

            // 5) Calculate the new average and update it
            const { averageRating } = await tx.run(
                SELECT.one.from(ProductReviews)
                .columns('avg(rating) as averageRating')
                .where({ product_ID: productID })
            ) as any || { averageRating: 0 };

            const newAvg = averageRating ? Number(Number(averageRating).toFixed(1)) : 0;

            await tx.run(UPDATE(Products, productID).with({ averageRating: newAvg }));

            return newReview;
        });

        return super.init();
    }
}