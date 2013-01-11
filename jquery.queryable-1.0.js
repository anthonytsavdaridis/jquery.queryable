(function()
{
	// attach helper functions to Object
	Object.equals = function(x, y, ignoreCase)
    {
		return (ignoreCase && typeof(x) == 'string' ? x.toLowerCase() == y.toLowerCase() : x === y); 
	}

	Object.compare = function(x, y)
	{
		return x > y ? 1 : (x < y ? -1 : 0);
	}

    var Queryable = function(source)
    {
		var self = this;

		this.source = source;
		this.length = 0
	
		// call initialize
		self._init();
    };

	Queryable.fromSource = function(source)
	{
		return new Queryable(source);
	}

	Queryable._utilities =
	{
		sort: function(input, method, ordered)
		{
			var x, y, holder;
			var compare = method || function(a, b)
			{
				return Object.compare(a, b);
			};

			// the bubble sort method.
			for(x = 0;x < input.length;x++)
			{
				for(y = 0;y < (input.length - 1);y++)
				{
					if(compare(input[y], input[y + 1]) == 1)
					{
						holder = input[y + 1];
						input[y + 1] = input[y];
						input[y] = holder;
					}
				}
			}

			return input;
		}

		,sortMany: function(input, methods, ordered)
		{
			var x, y, holder;

			// our compare methods is the last one
			var compare = methods.pop();

			// the bubble sort method.
			for(x = 0;x < input.length;x++)
			{
				for(y = 0;y < (input.length - 1);y++)
				{
					var equal = true;
					$.each(methods, function(index, method)
					{
						if(method(input[y], input[y + 1]) != 0)
						{
							equal = false;
							return(false);
						}
					});

					if(equal) // this means that we can modify only these items
					{
						if(compare(input[y], input[y + 1]) == 1)
						{
							holder = input[y + 1];
							input[y + 1] = input[y];
							input[y] = holder;
						}
					}
				}
			}

			return input;
		}

		,parseExpression: function(input)
        {
			var method = input;
			if($.type(method) == 'string')
			{
				var pattern = /^[(\s]*([^()]*?)[)\s]*=>[{]?(.*)[}]?/;   
				if(!pattern.test(input))
					throw new Error('cannot parse expression');
				else
				{
					var parts = input.match(pattern);
					var method = new Function(parts[1], "return " + parts[2] + ";");
					return method;
				}
			}

			return method;
        }

		,getKeys: function(value)
		{
			var keys = [];
			for(var k in value)
			{
				if(Object.prototype.hasOwnProperty.call(value, k))
				{
					keys.push(k);
				}
			}
			return keys;
		}
	}

	Queryable.prototype =
	{
		_init: function()
		{
			var self = this;
			this.length = (this.source == null ? 0 : this.source.length);

			if(this.source != null)
			{
				$.each(this.source, function(index)
				{
					self[index] = this;
				});
			}
		}

		,toArray: function()
		{
			var output = [];
			$.each(this.source, function()
			{
				output.push(this);
			});

			return output;
		}

		,toJQuery: function()
		{
			return $(this.toArray());
		}

		,where: function(predicate)
		{
			var method = Queryable._utilities.parseExpression(predicate);

			var output = [];
			$.each(this.source, function(index, item)
			{
				if(method(item, index))
					output.push(item);
			});

			return Queryable.fromSource(output);
		}

		,count: function(predicate)
		{
			if(predicate != null)
				return this.where(Queryable._utilities.parseExpression(predicate)).length;

			return this.length;
		}

		,forEach: function(action)
		{
			$.each(this.source, function(index, item)
			{
				action(item, index);
			});
		}

		,take: function(count)
		{
			var output = this.source.slice(0, count);
			return Queryable.fromSource(output);
		}

		,takeWhile: function(predicate)
		{
			var method = Queryable._utilities.parseExpression(predicate);
			var output = [];

			$.each(this.source, function(index, item)
			{
				if(method(item, index))
					output.push(item);
				else
					return(false);
			});

			return Queryable.fromSource(output);
		}

		,skipWhile: function(predicate)
		{
			var method = Queryable._utilities.parseExpression(predicate);
			var output = null;
			var startIndex = null;

			$.each(this.source, function(index, item)
			{
				if(!method(item, index))
					return(false);

				startIndex = index;
			});

			return (startIndex == null ? Queryable.fromSource([]) : this.skip(++startIndex));
		}

		,skip: function(count)
		{
			var output = this.source.slice(count);
			return Queryable.fromSource(output);
		}

		,first: function(predicate)
		{
			var output = this.firstOrDefault(predicate);
			if(output == null)
				throw new Error('sequence contains no elements');
			else
				return output;
		}

		,firstOrDefault: function(predicate)
		{
			if(predicate != null)
			{
				return this.where(predicate).firstOrDefault();
			}
			else
			{
				var output = this.toArray();
			
				return (output.length > 0 ? output[0] : null);
			}
		}

		,last: function(predicate)
		{
			var output = this.lastOrDefault(predicate);
			if(output == null)
				throw new Error('sequence contains no elements');
			else
				return output;
		}

		,lastOrDefault: function(predicate)
		{
			if(predicate != null)
			{
				return this.where(predicate).firstOrDefault();
			}
			else
			{
				var output = this.toArray();
			
				return (output.length > 0 ? output[output.length - 1] : null);
			}
		}

		,elementAtOrDefault: function(index)
		{
			return (index in this ? this[index] : null);
		}

		,elementAt: function(index)
		{
			var item = this.elementAtOrDefault(index);
			if(item == null)
				return new Error('sequence contains no elements');
			else
				return item;
		}

		,all: function(predicate)
		{
			var method = Queryable._utilities.parseExpression(predicate);
			var output = true;

			$.each(this.source, function(index, item)
			{
				if(!method(item, index))
				{
					output = false;
				}

				return(output);
			});

			return output;
		}

		,any: function(predicate)
		{
			var method = Queryable._utilities.parseExpression(predicate);
			var output = false;

			$.each(this.source, function(index, item)
			{
				if(method(item, index))
				{
					output = true;
					return(false); // force exit
				}
			});

			return output;
		}

		,concat: function(second)
		{
			if($.isArray(second))
				return Queyrable.fromSource(this.source.concat(second));
			else
				return Queryable.fromSource(this.source.concat(second.source)); // assuming it's a queryable
		}

		,defaultIfEmpty: function(defaultValue)
		{
			if(this.source.length == 0)
			{
				return Queryable.fromSource([(defaultValue != null ? defaultValue : null)]);
			}
			else
				return this;
		}

		,distinct: function(comparer)
		{
			var output = [];
			if(comparer == null)
			{
				$.each(this.source, function(index, item)
				{
					if($.inArray(item, output) == -1)
						output.push(item);
				});
			}
			else
			{
				var compare = comparer || Object.equals;

				$.each(this.source, function(index, item)
				{
					var found = false;
					$.each(output, function()
					{
						if(compare(item, this))
						{
							found = true; // item found
							return(false); // exit
						}
					});

					if(!found)
						output.push(item);
				});
			}

			return Queryable.fromSource(output);
		}

		,_orderBy: function(keySelector, comparer, descending)
		{
			if(keySelector == null)
				keySelector = function(input){return input;}

			keySelector = Queryable._utilities.parseExpression(keySelector);

			var method = function(x, y)
			{
				return (comparer || Object.compare)(keySelector(x), keySelector(y)) * (descending ? -1 : 1);
			};
			
			var parent = this.parent;
			var methods = [];

			while(parent != null)
			{
				var internalComparer = parent[1]
				var internalKeySelector = parent[2];

				var internal = function(x, y)
				{
					return (internalComparer || Object.compare)(internalKeySelector(x), internalKeySelector(y));
				};

				methods.push(internal);
				parent = parent.parent;
			}

			methods.push(method);

			var sorted = null;
			if(methods.length > 1)
			{
				sorted = Queryable._utilities.sortMany(this.source, methods);
			}
			else
			{
				sorted = Queryable._utilities.sort(this.source, method);
			}
			return OrderedQueryable.fromSource([this, comparer, keySelector], sorted);

		}

		,orderBy: function(keySelector, comparer)
		{
			return this._orderBy(keySelector, comparer, false);
		}

		,orderByDescending: function(keySelector, comparer)
		{
			return this._orderBy(keySelector, comparer, true);
		}
		
		,min: function(selector)
		{
			var output = null;

			if(selector == null)
			{
				output = this.orderBy().first();
			}
			else
			{
				output = this.orderBy(selector).first();
			}

			return output;
		}

		,max: function(selector)
		{
			var output = null;

			if(selector == null)
			{
				output = this.orderByDescending().first();
			}
			else
			{
				output = this.orderByDescending(selector).first();
			}

			return output;
		}

		,sum: function(selector)
		{
			var output = 0;
			
			$.each(this.source, function(index, item)
			{
				output += (selector != null ? selector(item, index) : item);
			});

			return output;
		}

		,intersect: function(second, comparer)
		{
			var equals = comparer || function(a, b)
			{
				return Object.equals(a, b);
			};

			var output = [];
			$.each(this.source, function(index, item)
			{
				// check if item exists in second
				var found = false;
				$.each(second, function(index2, item2)
				{
					if(equals(item, item2))
					{
						found = true; // item found
						return(false); // exit
					}
				});

				if(found)
					output.push(item);
			});

			return Queryable.fromSource(output);
		}

		,groupBy: function(keySelector)
		{
			var elementSelector = null;
			var resultSelector = null;
			var comparer = null;
			if(arguments.length == 2)
			{
				elementSelector = arguments[1];
			}
			else if(arguments.length == 3)
			{
				elementSelector = arguments[1];
				comparer = arguments[2];
			}
			else if(arguments.length > 3)
			{
				elementSelector = arguments[1];
				resultSelector = arguments[2];
				comparer = arguments[3];
			}

			if(keySelector == null)
				throw new Error('keySelector is null');
			else
			{
				var dc = {};
				var dataComparer = [];
				var output = [];
				var allowed = ['boolean', 'number', 'string'];

				keySelector = Queryable._utilities.parseExpression(keySelector);

				// output shoud be a list of
				// key1, key2, keyN.. - items
				$.each(this.source, function(index, item)
				{
					var key = keySelector(item);
					var keyType = $.type(key);
					if($.inArray(keyType, allowed) == -1)
						throw new Error('complex types for keys are not allowed');

					if(comparer == null)
					{
						if(!(key in dc))
							dc[key] = [];
					
						dc[key].push((elementSelector != null ? elementSelector(item) : item));
					}
					else
					{
						var entry = null;

						$.each(dataComparer, function(index, item)
						{
							if(comparer(item.key, key))
								entry = item;

							return (entry == null);
						});

						if(entry == null)
						{
							entry = {key: key, values: []};
							dataComparer.push(entry);
						}

						entry.values.push((elementSelector != null ? elementSelector(item) : item));

					}
				});

				if(comparer == null)
				{
					$.each(dc, function(key, value)
					{
						output.push(new Grouping(key, value));
					});
				}
				else
				{
					$.each(dataComparer, function(index, item)
					{
						output.push(new Grouping(item.key, item.values));
					});
				}

				if(resultSelector != null)
				{
					var tmp = [];

					$.each(output, function(index, item)
					{
						tmp.push(resultSelector(item.key, item));
					});

					output = tmp;
				}

				return Queryable.fromSource(output);
			}
		}

		,_join: function(inner, outerKeySelector, innerKeySelector, resultSelector, comparer, groupJoin)
		{
			var data = [];
			var equals = (comparer || Object.equals);

			$.each(this.source, function(index, item)
			{
				var key = outerKeySelector(item);
				var subset = [];

				$.each(inner, function(subIndex, subItem)
				{
					var innerKey = innerKeySelector(subItem);
					if(equals(key, innerKey))
					{
						if(groupJoin)
							subset.push(subItem);
						else
							data.push(resultSelector(item, subItem));
					}
				});

				if(groupJoin)
					data.push(resultSelector(item, Queryable.fromSource(subset)));
			});

			return Queryable.fromSource(data);
		}

		,join: function(inner, outerKeySelector, innerKeySelector, resultSelector, comparer)
		{
			return this._join(inner, outerKeySelector, innerKeySelector, resultSelector, comparer, false);
		}

		,groupJoin: function(inner, outerKeySelector, innerKeySelector, resultSelector, comparer)
		{
			return this._join(inner, outerKeySelector, innerKeySelector, resultSelector, comparer, true);
		}

		,select: function(selector)
		{
			var output = [];
			$.each(this.source, function(index, item)
			{
				output.push(selector(item));
			});

			return Queryable.fromSource(output);
		}

		,selectMany: function(collectionSelector)
		{
			var resultSelector = (arguments.length > 1 ? arguments[1] : null);
			var output = [];

			$.each(this.source, function(index, item)
			{
				if(resultSelector == null)
					output = output.concat(collectionSelector(item, index));
				else
				{
					var subset = collectionSelector(item, index);
					$.each(subset, function(subIndex, subItem)
					{
						output.push(resultSelector(item, subItem, subIndex));
					});
				}
			});

			return Queryable.fromSource(output);
		}

		,union: function(second, comparer)
		{
			var output = this.source.concat(second);
			return Queryable.fromSource(output).distinct(comparer);
		}

		,zip: function(second, resultSelector)
		{
			var len = Math.min(this.source.length, second.length);
			var output = [];

			$.each(this.source, function(index, item)
			{
				if(index + 1 > len)
					return(false);

				output.push(resultSelector(item, second[index]));
			});

			return Queryable.fromSource(output);
		}
	}

	// OrderedQueryable
	var OrderedQueryable = function(parentQueryable, source)
	{
		if(parentQueryable == null)
			throw new Error('parentQueryable must be specified');

		this.parent = parentQueryable;
		this.source = source;
		this.length = 0;

		this._init();
	}

	// extend
	$.extend(OrderedQueryable, Queryable);
	OrderedQueryable.prototype = new Queryable();
	OrderedQueryable.prototype.constructor = OrderedQueryable;

	OrderedQueryable.fromSource = function(parentQueryable, source)
	{
		return new OrderedQueryable(parentQueryable, source);
	}

	OrderedQueryable.prototype.thenBy = Queryable.prototype.orderBy;
	OrderedQueryable.prototype.thenByDescending = Queryable.prototype.orderByDescending;

	var Grouping = function(key, source)
	{
		this.key	= key;
		this.source = source;
		this.length = 0;

		this._init();
	}

	$.extend(Grouping, Queryable);
	Grouping.prototype = new Queryable();
	Grouping.prototype.constructor = Grouping;

    $.queryable = Queryable.fromSource;
	$.fn.asQueryable = function()
	{
		return Queryable.fromSource(this);
	};
})();