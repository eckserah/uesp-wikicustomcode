/*( function ( M ) {
	// Remove './src/' from the requirement string path
	var SearchGateway = mw.mobileFrontend.require('mobile.search.api/SearchGateway');
	SearchGateway.prototype.searchNamespace = mw.config.get('wgContentNamespaces').join('|');
}( mw.mobileFrontend ) );*/

(function () {
   // Safely check if MobileFrontend's References gateway component is available
	mw.loader.using('mobile.startup').then(function () {
		const startupModule = mw.mobileFrontend.require('mobile.startup');
		
		if (!startupModule || !startupModule.ReferencesHtmlScraperGateway || !startupModule.search.SearchGateway) {
			return;
		}
		
		const SearchGateway = startupModule.search.SearchGateway;
		if (SearchGateway && SearchGateway.prototype) {
			SearchGateway.prototype.searchNamespace = mw.config.get('wgContentNamespaces').join('|');
		}
		
		// Require or grab the module instance from MobileFrontend's internal registry
		const referencesModule = startupModule.ReferencesHtmlScraperGateway;
		
		if (referencesModule && referencesModule.prototype) {
			
			// Store a reference to the original function if you still need it
			const originalGetReferenceFromContainer = referencesModule.prototype.getReferenceFromContainer;
			const originalGetReference = referencesModule.prototype.getReference;
			
			// Overload the prototype function with your custom implementation
			referencesModule.prototype.getReferenceFromContainer = function (id, $container, pageHTMLParser) {
				
				// 1. YOUR CUSTOM 'intnote' EXTENSION PATCH
				if (id && id.substr(1, 7) === 'intnote') {
					var util = startupModule.util;
					var result = util.Deferred();
					var $el = pageHTMLParser.$el.find('#' + util.escapeSelector(id.substr(1)));
					
					if ($el.length) {
						var $note = $el.parent().find('td:last-child');
						if ($note.length) {
							result.resolve({
								text: $note.first().html(),
								parentText: ''
							});
						}
					}
					return result.promise();
				}
				
				// 2. Fall back to the original MobileFrontend logic for standard footnotes
				return originalGetReferenceFromContainer.call(this, id, $container);
			};
			
			referencesModule.prototype.getReference = function ( id, page, pageHTMLParser ) {
				// If an id is not found it's possible the id passed needs decoding (per T188547).
				return this.getReferenceFromContainer( decodeURIComponent( id ), pageHTMLParser.$el.find( 'ol.references' ), pageHTMLParser );
			};
		}
	});
})();