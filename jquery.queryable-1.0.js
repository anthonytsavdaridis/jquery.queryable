(function()
{
	// attach helper functions to Object
	Object.equals = function(x, y, ignoreCase)
	{
		return (ignoreCase 
				&& (typeof(x) == 'string' && typeof(y) == 'string') 
						? x.toLowerCase() == y.toLowerCase() 
							: x === y); 
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
		sort: function(input, methods, ordered)
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
							console.log(input[y], input[y + 1]);
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
				$.each(this.source, function(index, value)
				{
					self[index] = value;
				});
			}
		}

		// define queryable version
		,queryableVersion: '1.0'

		,toArray: function()
		{
			var output = [];
			$.each(this.source, function()
			{
				output.push(this);
			});

			return output;
		}

		,toLookup: function(keySelector, elementSelector, comparer)
		{
			keySelector = Queryable._utilities.parseExpression(keySelector);
			elementSelector = (elementSelector == null ? function(item, index) { return item; } : Queryable._utilities.parseExpression(elementSelector));
			
			var output = {};
			var useComparer = (comparer != null);
			var comparer = comparer || Object.equals;
			var keys = [];

			$.each(this.source, function(index, item)
			{
				var key = keySelector(item, index);
				if(useComparer)
				{
					var existingKey = null;
					$.each(keys, function(innerIndex, innerItem)
					{
						if(comparer(key, innerItem))
						{
							existingKey = innerItem;
							return(false);
						}
					});

					if(existingKey != null)
						key = existingKey;
					else
						keys.push(key);
				}
				if(!(key in output))
					output[key] = []
				
				output[key].push(elementSelector(item, index));
			});

			$.each(output, function(key, value)
			{
				output[key] = Queryable.fromSource(value);
			});

			return output;
		}

		,toDictionary: function(keySelector, elementSelector, comparer)
		{
			keySelector = Queryable._utilities.parseExpression(keySelector);
			elementSelector = (elementSelector == null ? function(item, index) { return item; } : Queryable._utilities.parseExpression(elementSelector));

			var noComparer = (comparer == null);
			var output = {};
			var keys = [];

			$.each(this.source, function(index, item)
			{
				var key = keySelector(item, index);
				if(noComparer)
				{
					if(key in output)
						throw new Error('duplicate key found (' + key + ')');
					else
						output[key] = elementSelector(item, index);
				}
				else
				{
					var found = false;
					$.each(keys, function(innerIndex, innerItem)
					{
						if(comparer(key, innerItem))
						{
							found = true;
							return(false);
						}
					});

					if(found)
						throw new Error('duplicate key found (' + key + ')');
					else
					{
						output[key] = elementSelector(item, index);
						keys.push(key);
					}
				}
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

		,contains: function(value, comparer)
		{
			comparer = comparer || Object.equals;
			
			var exists = false;
			$.each(this.source, function(index, item)
			{
				exists = (comparer(value, item));					
				return(!exists); // break
			});

			return exists;
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

		,single: function(predicate)
		{
			var output = this.singleOrDefault(predicate);
			if(output == null)
				throw new Error('sequence contains no matching element');
			else
				return output;
		}

		,singleOrDefault: function(predicate)
		{
			var output = this.where(predicate);
			if(output.length > 1)
				throw new Error('found more than 1 matching elements');
			else
				return output.firstOrDefault();
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
			var output = null;
			if($.isArray(second))
			{
				output = this.source.concat(second);
			}
			else if(second instanceof Queryable)
			{
				output = this.source.concat(second.source);
			}
			else if(second.jquery != null)
			{
				output = this.source;

				$.each(second, function()
				{
					output.push(this);
				});
			}
			else
				throw new Error('cannot merge with this type');

			return Queryable.fromSource(output);
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
				var internalComparer = parent.comparer;
				var internalKeySelector = parent.keySelector;

				var internal = function(x, y)
				{
					return (internalComparer || Object.compare)(internalKeySelector(x), internalKeySelector(y));
				};

				methods.push(internal);
				parent = parent.parent;
			}

			methods.push(method);
			
			var sorted = Queryable._utilities.sort(this.source, methods);
			return OrderedQueryable.fromSource({comparer: comparer, keySelector: keySelector}, sorted);

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

		,average: function(selector)
		{
			selector = (selector == null ? function(item, index) { return item; } : Queryable._utilities.parseExpression(selector));

			var sum = 0;
			$.each(this.source, function(index, item)
			{
				sum += selector(item, index);
			});

			return (sum / this.length);
		}

		,aggregate: function()
		{
			var seed = (arguments.length > 1 && typeof(arguments[0]) != 'function' ? arguments[0] : null);
			var method = Queryable._utilities.parseExpression(arguments.length > 1 ? arguments[1] : arguments[0]);
			var resultSelector = (arguments.length > 2 ? arguments[2] : 
										(arguments.length == 2 && typeof(arguments[0]) == 'function' ? arguments[1] : null));			
			resultSelector = (resultSelector == null ? function(item) { return item;} : Queryable._utilities.parseExpression(resultSelector));

			console.log(method.toString());

			var first = (seed == null ? this.source.shift() : seed);
			var second = null;
			while(second = this.source.shift())
			{
				first = method(first, second);
			}

			return resultSelector(first);
		}

		,reverse: function()
		{
			var output = [];
			$.each(this.source, function(index, item)
			{
				output.unshift(item);
			});

			return Queryable.fromSource(output);
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
				comparer = arguments[2] || Object.equals;				
			}
			else if(arguments.length > 3)
			{
				elementSelector = arguments[1];
				resultSelector = arguments[2];
				comparer = arguments[3] || Object.equals;
			}			

			if(elementSelector != null)
				elementSelector = Queryable._utilities.parseExpression(elementSelector);

			if(resultSelector != null)
				resultSelector = Queryable._utilities.parseExpression(resultSelector);

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

			outerKeySelector = Queryable._utilities.parseExpression(outerKeySelector);
			innerKeySelector = Queryable._utilities.parseExpression(innerKeySelector);			
			resultSelector	 = Queryable._utilities.parseExpression(resultSelector);

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
			selector = Queryable._utilities.parseExpression(selector);

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

		,except: function(second, comparer)
		{
			comparer = comparer || Object.equals;

			var output = [];
			$.each(this.source, function(index, item)
			{
				var exists = false;
				$.each(second, function(secondIndex, secondItem)
				{
					exists = comparer(item, secondItem);
					return (!exists);
				});

				if(!exists)
					output.push(item);
			});

			return Queryable.fromSource(output);
		}

		,sequenceEqual: function(second, comparer)
		{
			comparer = (comparer || Object.equals);

			var equal = (this.source.length == second.length);
			
			if(equal)
			{
				$.each(this.source, function(index, item)
				{
					var secondItem = second[index]
					console.log(item, secondItem);
					if(!comparer(item, secondItem))
					{
						equal = false;
						return(false);
					}
				});
			}

			return equal;
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
