/*
Copyright (c) 2013 Llewellyn Hinkes-Jones borrowed heavily from pastefromgoogle by Frederico Knabben. 
*/
(function()
{
	function forceHtmlMode( evt ) { evt.data.mode = 'html'; }

	CKEDITOR.plugins.add( 'pastefromgoogle',
	{
		init : function( editor )
		{

			// Flag indicate this command is actually been asked instead of a generic
			// pasting.
			var forceFromGoogle = 0;
			var resetFromGoogle = function( evt )
				{
					evt && evt.removeListener();
					editor.removeListener( 'beforePaste', forceHtmlMode );
					forceFromGoogle && setTimeout( function() { forceFromGoogle = 0; }, 0 );
				};

			// Features bring by this command beside the normal process:
			// 1. No more bothering of user about the clean-up.
			// 2. Perform the clean-up even if content is not from MS-Google.
			// (e.g. from a MS-Google similar application.)
			editor.addCommand( 'pastefromgoogle',
			{
				canUndo : false,
				exec : function()
				{
					// Ensure the received data format is HTML and apply content filtering. (#6718)
					forceFromGoogle = 1;
					editor.on( 'beforePaste', forceHtmlMode );

					if ( editor.execCommand( 'paste', 'html' ) === false )
					{
						editor.on( 'dialogShow', function ( evt )
						{
							evt.removeListener();
							evt.data.on( 'cancel', resetFromGoogle );
						});

						editor.on( 'dialogHide', function( evt )
						{
							evt.data.removeListener( 'cancel', resetFromGoogle );
						} );
					}

					editor.on( 'afterPaste', resetFromGoogle );
				}
			});

			// Register the toolbar button.
			editor.ui.addButton( 'PasteFromGoogle',
				{
					label : 'Paste from Google',
					command : 'pastefromgoogle'
				});

			editor.on( 'pasteState', function( evt )
				{
					editor.getCommand( 'pastefromgoogle' ).setState( evt.data );
				});

			editor.on( 'paste', function( evt )
			{
				var data = evt.data,
					googleHtml;
				console.log("On paste");
				// Google Doc format sniffing.
				if ( ( googleHtml = data[ 'html' ] )
					 && ( forceFromGoogle || ( /((strong|b) id="internal-source-marker(.*))/ ).test( googleHtml ) ) )
				{
					console.log("Caught the format");
					var isLazyLoad = this.loadFilterRules( function()
						{
							// Event continuation with the original data.
							if ( isLazyLoad )
								editor.fire( 'paste', data );
							else if ( !editor.config.pasteFromGooglePromptCleanup
							  || ( forceFromGoogle || confirm( 'The text you want to paste seems to be copied from Google Docs. Do you want to clean it before pasting?' ) ) )
							 {
							 	window.test = googleHtml;
								data[ 'html' ] = googleHtml.replace(/<(strong|b) id="internal-source-marker(.*?);">(.*)/gi, "$3"); 
							}
						});

					// The cleanup rules are to be loaded, we should just cancel
					// this event.
					isLazyLoad && evt.cancel();
				}
			}, this );
		},

		loadFilterRules : function( callback )
		{

			var isLoaded = CKEDITOR.cleanGoogle;

			if ( isLoaded )
				callback();
			else
			{
				var filterFilePath = CKEDITOR.getUrl(
						CKEDITOR.config.pasteFromGoogleCleanupFile
						|| ( this.path + 'filter/default.js' ) );

				// Load with busy indicator.
				CKEDITOR.scriptLoader.load( filterFilePath, callback, null, true );
			}

			return !isLoaded;
		},

		requires : [ 'clipboard' ]
	});
})();

