using edraky.catalog as db from '../db/schema';

@requires:'admin'
service CatalogService {

    entity Suppliers      as projection on db.Suppliers;
    entity Products       as projection on db.Products;
    entity ProductReviews as projection on db.ProductReviews;

    action submitReview(productID: UUID, rating: Integer, comment: String) returns ProductReviews;
}
