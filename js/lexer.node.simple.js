
/*----------------------------------
	- class SimpleNode 
----------------------------------*/
SimpleNode =function( s1 ){
	if( s1 )this.nodeName = s1
	this.childNodes=[]
	}
SimpleNode.prototype ={
	nodeName:null,
	parentNode:null,
	firstChild:null,
	lastChild:null,
	previousSibling:null,
	nextSibling:null,
	appendChild :function( o ){
		if( o.parentNode ) o = o.parentNode.removeChild( o )
		o.parentNode = this
		if( o.previousSibling = this.lastChild ) this.lastChild.nextSibling = o
		if( ! this.childNodes.length ) this.firstChild = o 
		this.childNodes.push( this.lastChild = o )
		return o
		},
	getElementsByTagName :function( tagName ){
		//http://dean.edwards.name/weblog/2009/12/getelementsbytagname/
		var a = [], i = 0, node, next = this.firstChild
		if( tagName=="*" )
			while( node = next ){
				a[i++] = node
				next = node.firstChild || node.nextSibling
				while( !next && ( node = node.parentNode )) next = node===this ? null : node.nextSibling
				}
		else
			while( node = next ){
				if( node.nodeName==tagName ) a[i++] = node
				next = node.firstChild || node.nextSibling
				while( !next && ( node = node.parentNode )) next = node===this ? null : node.nextSibling
				}
		return a
		},
	hasChildNodes :function(){
		return this.firstChild && true
		},
	insertBefore :function( o, NS ){
		if( ! NS ) return this.appendChild( o )
		if( o.parentNode ) o.parentNode.removeChild( o )
		o.previousSibling = (o.nextSibling = NS).previousSibling
		NS.previousSibling = NS.previousSibling
			? NS.previousSibling.nextSibling = o
			: this.firstChild = o
		o.parentNode = this
		
		for(var i=0, a=[]; this.childNodes[i]; i++){
			if( this.childNodes[i]===NS ){
				a[i]=o
				for(; this.childNodes[i]; i++) a[i+1]=this.childNodes[i]
				this.childNodes = a
				return o
				}
			a[i]=this.childNodes[i]
			}
		throw new Error ('NODE_NOT_FOUND')
		},
	removeChild :function( o ){
	 	for(var i=0, a=[]; this.childNodes[i]; i++){
			if( this.childNodes[i]===o ){
				for( i++; this.childNodes[i]; i++) a[i-1]=this.childNodes[i]
				break;
				}
			a[i]=this.childNodes[i]
			}
		this.childNodes = a
		if( this.firstChild==o && ( this.firstChild=o.nextSibling ))
			o.nextSibling.previousSibling = null
		else if( this.lastChild==o && ( this.lastChild=o.previousSibling ))
			o.previousSibling.nextSibling = null
		else if( this.childNodes.length ){
			o.nextSibling.previousSibling = o.previousSibling
			o.previousSibling.nextSibling = o.nextSibling
			}
		o.parentNode = o.nextSibling = o.previousSibling = null
		return o
		}
	}
