namespace edraky.catalog;

using {
    cuid,
    managed
} from '@sap/cds/common';

entity Suppliers : cuid, managed {
    name     : String(100) not null;
    email    : String(100) not null;
    rating   : Integer;
    products : Association to many Products
                   on products.supplier = $self;
}

entity Products : cuid, managed {
    name           : String(100) not null;
    price          : Decimal(9, 2) not null;
    category       : String(50) not null;
    externalRating : Decimal(3, 1);
    averageRating  : Decimal(3, 1);
    supplier       : Association to Suppliers not null;
    reviews        : Association to many ProductReviews
                         on reviews.product = $self;
}

entity ProductReviews : cuid, managed {
    product  : Association to Products not null;
    rating   : Integer not null;
    comment  : String(1000) not null;
    reviewer : String(100) not null;
}
