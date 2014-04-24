module QueryableUtility
{
    export function getType(source: any) : string
    {
        var type = typeof (source);
        if (type == 'object')
        {
            if (Object.prototype.toString.call(source) === '[object Array]')
                type = 'array';
        }
        return type;
    }
}

class Queryable<T>
{
    private source: any[];

    constructor(source: any[])
    {
        this.source = source;
    }

    static fromSource(source: any[])
    {
        return new Queryable(source);
    }

    size()
    {
        return this.source.length;
    }
}

var p = Queryable.fromSource([1, 2, 3, 4]);
alert(p.size())