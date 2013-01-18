jquery.queryable
================

simple, lightweight implementation of LINQ to objects for javascript collections (arrays/objects/jquery)


samples
----------------

1. [getting started](#start)
2. [jquery](#jquery)
3. [aggregates] (#aggregates)
4. [join, groupJoin] (#joins) *
5. [groupBy] (#groupBy) *

_*_ *complex types are not supported for keys in join, groupJoin, groupBy*

-

<a name="start">getting started</a>

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
        return item.price;
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

<a name="jquery">using with jquery</a>
    
    <input type="text" data-scope="calc" value="10" />
    <input type="text" data-scope="calc" value="12" />
    <input type="text" data-scope="name" value="text" />
    
    var sum = $('input[data-scope=calc]').asQueryable().sum(function(item) { return parseFloat(item.value); });
    
    // sum = 12
    
<a name="aggregates">aggregates</a>

    var source = $.queryable([1, 2, 3, 4, 5, 6, 7, 8]);
    
    var min = source.min(); // returns 1
    var max = source.max(); // returns 8
    var sum = source.max(); // returns  36
    var avg = source.average(); // returns 4.5
    
    // with objects
    var source =
        [
            {id: 1, name: 'item 1', amount: 10}
            ,{id: 2, name: 'item 2', amount: 20}
            ,{id: 3, name: 'item 3', amount: 15}
        ]
    
    var min = $.queryable(source).min(function(item) { return item.amount; }); // returns 10

    // with an expression
    var min = $.queryable(source).min('q => q.amount');
    
<a name="joins">join, groupJoin</a>

    var categories =
    	$.queryable(
			[
				{id: 1, name: 'category 1'}
				,{id: 2, name: 'category 2'}
				,{id: 3, name: 'category 3'}
			]
		);

	var items =
		$.queryable(
			[
				{id: 1, name: 'item 1', category: 1}
				,{id: 2, name: 'item 2', category: 1}
				,{id: 3, name: 'item 3', category: 3}
				,{id: 4, name: 'item 4', category: 3}
				,{id: 5, name: 'item 5', category: 3}
			] 
		);

    // join: returns new Queryable of {category, item}
    var result = categories.join(items
        ,function(category) { return category.id; } // outer key
        ,function(item) { return item.category; } // inner key
        ,function(category, item)
        {
            return {category: category: item: item};
        }); // result selector, return new object
    
    // join (same example using string expressions)
    var result = categoires.join(items
            ,'category => category.id'
            ,'item => item.category'
            ,function(category, item)
            {
                return {category: category: item: item};
            });
    
    // groupJoin: returns new Queryable of Grouping
    var result = categories.groupJoin(
            'category => category.id'
            ,'item => item.category'); 
        
     // groupJoin: returns new Queryable of string, modify result with resultSelector
    var result = categories.groupJoin(
            'category => category.id'
            ,'item => item.category'
            ,function(category, items)
            {
                return 'category ' + category.name + ' has ' + items.count() + ' items(s)';
            });
    
<a name="groupBy">groupBy</a>

	var items =
		$.queryable(
			[
				{id: 1, name: 'item 1', category: 1}
				,{id: 2, name: 'item 2', category: 1}
				,{id: 3, name: 'item 3', category: 3}
				,{id: 4, name: 'item 4', category: 3}
				,{id: 5, name: 'item 5', category: 3}
			] 
		);

	// simple, group by category: returns Queryable of Grouping
	var result = items.groupBy('q => q.category') // group items by category

	// use elementSelector
	var result = items.groupBy(
			'q => q.category'
			,'q => {id: q.id, nameWithCategory: q.category + "_" + q.name}');

	// use resultSelector
	var result = items.groupBy(
			'q => q.category'
			,null // if elementSelector is null then a default function will be used function anonymous(x) { return x; }
			,'(key, items) => key + " has " + items.count()' // modify output by using a result selector, this will return a Queryable of string {category} has {itemCount}
			,null // comparer
			);		
