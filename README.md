jquery.queryable
================

simple, lightweight implementation of LINQ to objects for javascript collections (arrays/objects/jquery)


samples
----------------

getting started

    var data = 
    [
        {id: 1, name: 'item 1', category: 'category1', price: 200}
        ,{id: 2, name: 'item 2', category: 'category1', price: 300}
        ,{id: 3, name: 'item 3', category: 'category3', price: 100}
        ,{id: 4, name: 'item 4', category: 'category2', price: 100}
    ];
    
    // get only items with category = category1
    var result = $.queryable(data).where(function(item)
    {
        return item.category == 'category1';
    });
    
    // sort items by price
    var result = $.queryable(data).orderBy(function(item)
    {
        return item.rice;
    });
    
    // sort items by price and then by category
    var result = $.queryable(data).orderBy(function(item)
    {
        return item.price;
    }).thenBy(function(item)
    {
        return item.category;
    });
    
    // or use string expressions
    var result = $.queryable(data)
                    .where('q => q.category == "category1"')
                    .orderBy('q => q.price');
