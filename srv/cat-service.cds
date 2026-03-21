using edraky.catalog as db from '../db/schema';

@requires:'admin'
service CatalogService {

    entity Supplier      as projection on db.Suppliers;
    entity Product       as projection on db.Products;
    entity ProductReview as projection on db.ProductReviews;

    action submitReview(productId: UUID, rating: Integer, comment: String) returns ProductReview;
}
