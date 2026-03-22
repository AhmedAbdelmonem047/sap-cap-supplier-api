using CatalogService from '../srv/cat-service';

annotate CatalogService.Products with @(
    UI: {
        LineItem: [
            { Value: name, Label: 'Name' },
            { Value: category, Label: 'Category' },
            { Value: price, Label: 'Price' },
            { Value: externalRating, Label: 'Ext. Rating' },
            { Value: averageRating, Label: 'Avg. Rating' }
        ],
        Facets: [
            { $Type: 'UI.ReferenceFacet', Target: '@UI.FieldGroup#Details', Label: 'Product Details' },
            { $Type: 'UI.ReferenceFacet', Target: 'reviews/@UI.LineItem', Label: 'Customer Reviews' }
        ],
        FieldGroup#Details: {
            Data: [
                { Value: name, Label: 'Name' },
                { Value: category, Label: 'Category' },
                { Value: price, Label: 'Price' },
                { Value: externalRating, Label: 'External Rating' },
                { Value: averageRating, Label: 'Average Rating' },
                { Value: supplier, Label: 'Supplier ID'}
            ]
        }
    },
    title:'Manage Products'
);

annotate CatalogService.Suppliers with @(
    UI: {
        LineItem: [
            { Value: name, Label: 'Name' },
            { Value: email, Label: 'Email' },
            { Value: rating, Label: 'Rating' }
        ],
        Facets: [
            { $Type: 'UI.ReferenceFacet', Target: '@UI.FieldGroup#Details', Label: 'Supplier Details' },
            { $Type: 'UI.ReferenceFacet', Target: 'products/@UI.LineItem', Label: 'Supplied Products' }
        ],
        FieldGroup#Details: {
            Data: [
                { Value: name, Label: 'Name' },
                { Value: email, Label: 'Email' },
                { Value: rating, Label: 'Rating' }
            ]
        }
    },
    title: 'Manage Suppliers'
);

annotate CatalogService.ProductReviews with @(
    UI: {
        LineItem: [
            { Value: rating, Label: 'Rating' },
            { Value: comment, Label: 'Comment' },
            { Value: reviewer, Label: 'Reviewer Name' }
        ]
    }
);