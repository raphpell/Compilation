﻿if( ! window.Lexeme ) Lexeme =function( o ){
	var m = document.createElement( o.token )
	m.oValue = o
	return m
	}

var LexerClass =function(){
	var Lexer =function( sText, sSyntax ){
		if( sText!=undefined ){
			if( !Lexer.SINGLETON ) Lexer.SINGLETON = new Lexer
			return Lexer.SINGLETON.scan( sText, sSyntax )
			}
		}
	, LexerRules =(function(){
		var Dictionary =function( sId ){
			var sGetError = '"$1" is not a lexer '+ sId
			var sAddError = 'Lexer '+ sId +' "$1" already exist.'
			return {
				list: {},
				add :function( ID, m ){
					if( this.list[ID]) throw new Error ( sAddError.replace( '$1', ID ) +' ('+ Lexer.ID +')')
					return this.list[ID] = m
					},
				get :function( ID ){
					if( this.list[ID]) return this.list[ID]
					throw new Error ( sGetError.replace( '$1', ID ) +' ('+ Lexer.ID +')')
					},
				have :function( ID ){
					return this.list[ID]
					}
				}
			}
		, Rules=Dictionary('rule')
		, Tokens=Dictionary('token')
		return{
			CSS: {},
			Rules: Rules,
			Tokens: Tokens,
			Translation: {},
			addCSSClass :function( m ){
				var o = this.CSS
				var aCouples = m.constructor==Array ? m : m.split('&')
				for(var i=0, s ; s=aCouples[i]; i++){
					var aCouple = s.split('=')
					var sClassName = aCouple[0]
					var aTokens=aCouple[1].split('|')
					for(var j=0, sToken; sToken=aTokens[j]; j++){
						o[sToken] = o[sToken] ? o[sToken].split(' ') : []
						o[sToken].push( sClassName )
						o[sToken].sort()
						o[sToken] = Array.unique( o[sToken]).join(' ')
						}
					}
				},
			addRule :function( sName, sTokens ){
				return Rules.add( sName, this.makeRule( sName, sTokens ))
				},
			addRules :function( aRules ){
				for(var i=0; aRules[i]; i++ )
					aRules[i] = this.addRule( aRules[i][0], aRules[i][1])
				return aRules
				},
			addTokens :function( aTokens ){
				if( aTokens.length )
					for(var i=0; aTokens[i]; i++){
						var sName=aTokens[i][0]
						aTokens[i] = Tokens.add( sName, this.makeToken( sName, aTokens[i][1] ))
						}
				return aTokens
				},
			makeToken :function( sName, o ){
				o.name = sName
				return o
				},
			makeRule :function( sName, sTokens ){
				var aList = sTokens.split('|')
				var a = []
				for(var i=0; aList[i]; i++){
					var ID = aList[i]
					var oToken = this.Tokens.list[ID]
					if( oToken ) a.push( oToken )
					else {
						var aRule = this.Rules.list[ID]
						if( ! aRule ) throw Error ('Rule "'+ ID +'" Not Found !' )
						a = a.concat( aRule )
						}
					}
				return a
				},
			setPreviousTokenOf :function( sToken, sPreviousTokens ){
				return Previous.setPreviousTokenOf( sToken, sPreviousTokens )
				},
			setTokensTranslation :function( m ){
				var o = this.Translation
				var aCouples = m.constructor==Array ? m : m.split('&')
				for(var aCouple, sToken, i=0, ni=aCouples.length; i<ni ; i++ ){
					aCouple = aCouples[i].split('=')
					sToken = aCouple[0]
					if( o[sToken]) throw Error ( 'Token Translation of '+ sToken +' already defined with '+ o[sToken] +' !' )
					o[sToken] = aCouple[1]
					}
				}
			}
		})()
	, Actions =(function(){
		var Do =function( oInstance, oLexeme ){
			var s = oInstance.sToken
			return Do[ s.charAt(1)=='_' && Do.directive[ s.charAt(0)] || 'add' ].call( oInstance, oLexeme )
			}
		Do.union({
			add :function( oLexeme ){
				this.previous.set( oLexeme.token )
				return this.appendNode( Lexeme( oLexeme ))
				},
			endParent :function( oLexeme ){
				oLexeme.bParentLimit = true
				this.previous.set( this.eParent.oValue.token )
				var eNode = this.appendNode( Lexeme( oLexeme ))
				this.stack.pop()
				return eNode
				},
			newLine :function( oLexeme ){
				this.previous.set( oLexeme.token )
				this.nLine++
				return this.appendNode( Lexeme( oLexeme ))
				},
			rescanToken :function( oLexeme ){
				this.nPos = oLexeme.index
				this.nLine = oLexeme.lineStart
				var sRule = this.sToken.slice(2)
				, sTextRescan = oLexeme.value
				, nEnd = this.nPos + sTextRescan.length
				, sTMP = this.sText
				oLexeme.value = ''
				oLexeme.rule = sRule
				oLexeme.bParent = oLexeme.bRescan = true
				var eParent = this.appendNode( Lexeme( oLexeme ))
				this.stack.push( eParent )
				this.previous.set( oLexeme.token )
				this.sText = this.sText.slice( 0, nEnd )
				do{ this.readToken()}while( this.nPos<nEnd )
				this.sText = sTMP
				this.stack.pop()
				return eParent
				},
			startParent :function( oLexeme ){
				this.sToken = this.sToken.slice(2)
				var eNewParent = Lexeme({
					token: LexerRules.Translation[this.sToken]||this.sToken,
					css: LexerRules.CSS[this.sToken]||'',
					rule:this.sToken,
					value:'',
					index:oLexeme.index,
					lineStart:this.nLine,
					bParent:true
					})
				oLexeme.bParentLimit = true
				this.previous.set( oLexeme.token )
				var bSkip = this.skip( oLexeme.token )
				if( ! bSkip ) this.appendNode( eNewParent )
				this.stack.push( eNewParent )
				this.appendNode( Lexeme( oLexeme ))
				if( Skip.stepOf[ this.sSyntax ])
					do{ this.readToken()}while( this.eParent==eNewParent )
				return bSkip ? true : eNewParent
				}
			})
		Do.directive={
			E:'endParent',
			L:'newLine',
			R:'rescanToken',
			S:'startParent'
			}
		return Do
		})()
	, Previous =(function(){
		var o =function(){
			var s = ''
			return {
				get :function(){ return s },
				set :function( sToken ){
					return o.excluded[sToken]
						? false // doit impérativement retourner cette valeur
						: s = LexerRules.Translation[sToken]||sToken
					},
				validFor :function( sToken ){
					return o.ofToken[sToken] ? o.ofToken[sToken][s] || false : true
					}
				}
			}
		o.union({
			excluded :{
				WHITE_SPACES:1,SPACES:1,SPACE:1,TAB:1,// NEW_LINE:1,L_NEW_LINE:1,
				S_SLC:1,SLC:1,SLC_IN:1,
				S_MLC:1,MLC:1,MLC_IN:1,E_MLC:1,
				COMMENT:1,
				REGULAR_EXPRESSION_IN:1
				},
			ofToken :{},
			setPreviousTokenOf :function( sToken, sPreviousTokens ){
				if( Previous.ofToken[sToken]) throw new Error ( 'Previous token of '+ sToken +' already defined !' )
				var o = Previous.ofToken[sToken] = {}
				for(var i=0, a=sPreviousTokens.split('|'); a[i]; i++) o[ a[i]]= true
				return o
				}
			})
		return o
		})()
	, Stack =function( that ){
		var a =[0,0,0,0,0]
		var n = 0 // StackLength
		return {
			getSize :function(){ return n },
			pop :function(){
				if( that.bIncremental ){
					// Cas : Un parent est stoppé plus top
					if( that.eEndToken && that.eParent==that.eEndToken.parentNode ){
						// Efface tous les enfants du parent présent après sa nouvelle fin
						for(var e=that.eEndToken; e;){
							var eRemoved = e
							e = e.nextSibling
							that.removeToken( eRemoved )
							}
						// New End Token
						that.eEndToken = that.getTokenAfter( that.eParent )
						}
					}
				// A faire après suppression des éléments inutiles
				if( n ){
					var e = a[--n]
					e.oValue.lineEnd = e.lastChild && e.lastChild.oValue.lineEnd || 1
					if( e.setTitle ) e.setTitle()
					}
				if( n ){
					that.eParent = a[n-1]
					that.setSyntax( that.eParent.oValue.rule )
					}
				else {
					that.eParent = that.sSyntax = that.aRules = null
					}
				return n
				},
			push :function( e ){
				a[n++] = that.eParent = e
				that.setSyntax( e.oValue.rule )
				return e
				},
			top :function(){ return a[n-1] },
			unshift :function( e ){
				n++
				a.unshift(e)
				return e
				}
			}
		}
	, Skip =(function(){
		var o = function( that ){
			var f = that.bSkip
				? function( sToken ){ return Previous.excluded[sToken] || false }
				: function( sToken ){ return false }
			f.set =function( bSkip ){
				that.bSkip = bSkip
				return that.skip = Skip(that)
				}
			return f
			}
		o.stepOf={SSQ:1,SDQ:1,MLC:1,SLC:1,REGULAR_EXPRESSION:1}
		return o
		})()

	Lexer.ID = "LexerClass"
	Lexer.union({
		Actions: Actions,
		Previous: Previous,
		Rules: LexerRules,
		Skip: Skip,
		Stack: Stack,
		insert :function( fModule ){ fModule( Lexer.Rules )},
		rescan :function( eRoot, sSource, nPos, nDeleted, nAdded ){
			return Lexer.SINGLETON.rescan( eRoot, sSource, nPos, nDeleted, nAdded )
			}
		})
	Lexer.prototype ={
		bSkip: 0,
		sToken: null,
		sValue: null,
		appendNode: null,
		end :function(){
			return this.eRoot
			},
		init :function( sText, sSyntax ){
			sSyntax = sSyntax || 'TXT'
			this.union({
				nLine:1,
				nPos:0,
				sText:sText,
				skip:Skip(this),
				stack:Stack(this),
				previous:Previous()
				})
			this.eRoot = this.stack.push( Lexeme({
				value:'',
				token:sSyntax,
				rule:sSyntax,
				css:sSyntax.toLowerCase(),
				index:0,
				lineStart:1
				}))
			this.appendNode =function( eNode ){
				return this.skip( eNode.oValue.token )
					? true
					: this.eParent.appendChild( eNode )
				}
			},
		readToken :function(){
			for(var i=0, oLexeme; this.aRules[i]; i++ ){
				if( this.searchToken( this.aRules[i])){
					if( this.haveLexeme( oLexeme={
						value: this.sValue,
						token: LexerRules.Translation[this.sToken]||this.sToken,
						css: LexerRules.CSS[this.sToken]||'',
						rule:this.sSyntax,
						index:this.nPos,
						lineStart:this.nLine,
						lineEnd:this.nLine
						})) return false
					this.nPos += this.sValue.length
					return Actions( this, oLexeme )
					}
				}
			return this.stack.pop() ? true : null
			},
		scan :function( sText, sSyntax ){
			this.init( sText, sSyntax )
			while( this.readToken());
			return this.end()
			},
		searchToken :function( mTokenOrTokens ){ /* TODO */ },
		setSyntax :function( sSyntax ){
			this.aRules = LexerRules.Rules.list[ this.sSyntax = sSyntax ]
							|| [ LexerRules.Tokens.list[sSyntax] ]
			},
		getInfo :function(){
			console.info([
				'Lexer.ID :'+ Lexer.ID,
				'this.nPos :'+ this.nPos,
				'this.nLine :'+ this.nLine,
				'this.sSyntax :'+ this.sSyntax,
				'this.stack.getSize() :'+ this.stack.getSize(),
				'this.sToken :'+ this.sToken,
				'this.sValue :'+ this.sValue
				].join("\n"))
			
			}
		}

	// INCREMENTAL SCANNING only
	var sWSTokens ='|WHITE_SPACES|SPACES|SPACE|NEW_LINE|L_NEW_LINE|TAB|'
	Lexer.prototype.union({
		eEndToken:null,
		nShift:null,
		nLineShift:null,
		getTokenAfter :function( e ){
			var eNext
			do{ if( e===this.eRoot ) return null
				eNext = e.nextSibling
				e = e.parentNode
				}while( ! eNext )
			return eNext
			},
		getTokenBefore :function( e ){
			var ePrevious
			do{ if( e===this.eRoot ) return null
				ePrevious = e.previousSibling
				e = e.parentNode
				}while( ! ePrevious )
			return ePrevious
			},
		getNextEndToken :function(){
			var eNext = this.getTokenAfter( this.eEndToken )
			this.removeToken( this.eEndToken )
			this.eEndToken = eNext
			},
		haveLexeme :function( oLexeme ){
			if( ! this.eEndToken ) return false
			// Efface les éléments dépassés par le lexème trouvé
			while( this.eEndToken && this.eEndToken.oValue.index + this.nShift < oLexeme.index )
			// pas <= sinon autant faire une analyse totale
			// mais... a voir
				this.getNextEndToken()
			var o = this.eEndToken && this.eEndToken.oValue
			// Si le nouveau token est 'identique' à eEndToken
			if( o && oLexeme.token==o.token && oLexeme.value==o.value && oLexeme.index==o.index+this.nShift ){
				// 1. Contrôle si les tokens sont bien identique = ont le même parent
				if( this.eParent !== this.eEndToken.parentNode )
					this.getNextEndToken()
				// 2. FIN ANALYSE: Met à jour les éléments suivant ( index et ligne ) 
				else{
					this.nLineEnd = o.lineEnd
					this.nLineShift = oLexeme.lineStart - o.lineStart
					return true
					}
				}
			return false  // Continue l'analyse
			},
		isPartOfRange :function( e, nStart, nLength ){ // Intervalle ouvert
			var nEnd = nStart + (nLength||0) /* - 1 */
			, nTokenStart = e.oValue.index
			while( e.oValue.bParent ) e=e.lastChild
			var nTokenEnd = e.oValue.index + e.oValue.value.length
			return nStart <= nTokenStart && nTokenStart <= nEnd	// Le début du token est dans l'intervalle
				|| nTokenStart <= nStart && nEnd <= nTokenEnd	// L'intervalle est dans le token
				|| nStart <= nTokenEnd && nTokenEnd <= nEnd		// La fin du token est dans l'intervalle
			},
		isWhiteSpace :function( sToken ){
			return ~sWSTokens.indexOf( '|'+sToken+'|' )
			},
		nodeAt :function( nPos, eParent ){
			//initialisation
			eParent = eParent || this.eRoot
			var a = eParent.childNodes
			, nStart = 0, nMiddle, nEnd = a.length-1
			
			// Recherche dichotomique
			if( a.length )
				do{
					nMiddle = Math.round( nStart + ( nEnd - nStart ) / 2 )
					var e = a[nMiddle]
					if( this.isPartOfRange( e, nPos ))
						return e.oValue.bParent ? this.nodeAt( nPos, e ) : e
					else if( nPos < e.oValue.index ) nEnd = nMiddle - 1
					else nStart = nMiddle + 1
				} while ( nStart <= nEnd )
			return null
			},
		removeDeletedNodes :function( nPos, nDeleted ){
			var e = this.nodeAt( nPos, this.eRoot )
			, ePrevious
			, eNext 
			, remove =CallBack( this, function( e ){
				if( e.oValue.bParentLimit || e.parentNode.oValue.bRescan ){
					var eParent = e.parentNode
					ePrevious = eParent.previousSibling
					eNext = eParent.nextSibling
					return remove( eParent )
					}
				ePrevious = e.previousSibling
				eNext = e.nextSibling
				return this.removeToken( e )
				})
			// Efface le premier élément à la position nPos
			if( e ) remove( e )
			// Efface à gauche jusqu'au premier espace trouvé
			while( ePrevious ){
				if( this.isWhiteSpace( ePrevious.oValue.token )) break;
				remove( ePrevious )
				}
			// Efface à droite les éléments inclus dans l'intervalle effacé
			// et efface à droite jusqu'au premier espace trouvé
			while( eNext ){
				if( this.isWhiteSpace( eNext.oValue.token ) && ! this.isPartOfRange( eNext, nPos, nDeleted )) break;
				remove( eNext )
				}
			/* Normalement ePrevious et eNext ont les mêmes parents !!!
			if( ePrevious && eNext && ePrevious.parentNode != eNext.parentNode )
				throw Error( 'Pas le même parent ! final' )
			*/
			return {
				before: ! e ? this.eRoot.lastChild : ePrevious,
				after: eNext
				}
			},
		removeToken :function( e ){
			return e.parentNode.removeChild( e )
			},
		rescan :function( eRoot, sSource, nPos, nDeleted, nAdded ){
			if( ! nDeleted && ! nAdded ) return false;
			
			this.bIncremental = true
			this.appendNode =function( eNode ){
				if( this.skip( eNode.oValue.token )) return true
				return this.eEndToken && this.eEndToken.parentNode==this.eParent
					? this.eParent.insertBefore( eNode, this.eEndToken )
					: this.eParent.appendChild( eNode )
				}
			
			this.eRoot = eRoot
			this.sText = sSource
			this.previous = Previous()
			var nRootOldLineEnd = eRoot.oValue.lineEnd
			this.nShift = nAdded-nDeleted
			this.nLineShift = this.nLineEnd = null // ! important

			var oScanLimit = this.removeDeletedNodes( nPos, nDeleted )
			, eBefore = oScanLimit.before
			, eParent

			if( eBefore ){
				var o = eBefore.oValue
				eParent = eBefore.parentNode
				this.eEndToken = this.getTokenAfter( eBefore )
				// Calcul de la position courante
				for(var e = eBefore; e.oValue.bParent ; e = e.lastChild );
				this.nPos = e.oValue.index + e.oValue.value.length
				this.nLine = o.token=='NEW_LINE' ? o.lineEnd+1 : o.lineEnd
				// Recherche la valeur du "previous token"...
				for(
					var e = eBefore;
					e && ! this.previous.set( e.oValue.token );
					e = this.getTokenBefore( e )
					);
				}
			else{ // Start from beginning
				eParent = oScanLimit.after ? oScanLimit.after.parentNode : eRoot
				this.eEndToken = oScanLimit.after || eRoot.firstChild
				this.nPos = 0
				this.nLine = 1
				}

			var nLineStart = this.nLine
			
			// Création de la pile des ancêtres
			this.stack = Stack(this)
			this.stack.push( eParent )
			if( eParent!=eRoot )
				for(var e=eParent.parentNode; e; e=e.parentNode ){
					this.stack.unshift( e )
					if( e==eRoot ) break;
					}
			//	console.warn( this.eEndToken, this.eParent, this.sSyntax )
			
			// Analyse lexicale partielle
			while( this.readToken( true ));

			this.updateValues()

			this.eEndToken = this.bIncremental = null
			/* this.nShift = this.nLineShift = null */
			
			return {
				lineStart: nLineStart,
				lineEnd: this.nLineEnd || nRootOldLineEnd,
				lineShift: this.nLineShift || eRoot.oValue.lineEnd - nRootOldLineEnd 
				}
			},
		updateValues :function(){
			if( ! this.nShift || ! this.eEndToken ) return ;

			if( this.nLineShift ){
				// màj un elt + ceux suivants et les enfants des éléments parents
				var update =CallBack( this, function( eFirst ){
					for(var e=eFirst, o ; e ; e=e.nextSibling ){
						if( o=e.oValue ){
							o.index += this.nShift
							o.lineEnd += this.nLineShift
							o.lineStart += this.nLineShift
							if( e.setTitle ) e.setTitle()
							if( e.oValue.bParent ) update( e.firstChild )
							}
						}
					})
			
				update( this.eEndToken )
				for(var e=this.eEndToken.parentNode; e; e=e.parentNode ){
					e.oValue.lineEnd += this.nLineShift
					if( e.setTitle ) e.setTitle()
					if( e == this.eRoot ) break;
					update( e.nextSibling )
					}
				}
			else{
				// màj un elt + ceux suivants et les enfants des éléments parents
				var update =CallBack( this, function( eFirst ){
					for(var e=eFirst, o ; e ; e=e.nextSibling ){
						if( o=e.oValue ){
							o.index += this.nShift
							if( e.setTitle ) e.setTitle()
							if( e.oValue.bParent ) update( e.firstChild )
							}
						}
					})
			
				update( this.eEndToken )
				for(var e=this.eEndToken.parentNode; e; e=e.parentNode ){
					if( e == this.eRoot ) break;
					update( e.nextSibling )
					}
				}
			}
		})
	return Lexer
	}