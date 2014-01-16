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

				// Google Doc format sniffing.
				if ( ( googleHtml = data[ 'html' ] )
					 && ( forceFromGoogle || ( /((strong|b) id="internal-source-marker(.*))/ ).test( googleHtml ) ) )
				{
					result = googleHtml.replace(/<(strong|b) id="internal-source-marker(.*?);">(.*)/gi, "$3");
					
					result = result.replace(/<p>((\s|\t|\r|\n)*)<\/p>/i, "");
					
					result = result.replace(/color\: rgb\(17, 85, 204\)\;/gi, "");
					result = result.replace(/vertical-align\: baseline\;/gi, "");
					result = result.replace(/background-color\: transparent\;/gi, "");
					result = result.replace(/white-space\: pre-wrap\;/gi, "");
					result = result.replace(/line-height\:(.*?)\;/gi, "");
					result = result.replace(/margin(.*?)\;/gi, "");
					result = result.replace(/text-decoration(.*?)\;/gi, "");
					
					if (!editor.config.keepCustomFormattingFromPaste){
						// strip out all tags except basic formatting
						result = result.replace(/font-(family|size)\:(.*?)\;/gi, "");
					}

					result = result.replace(/<br \/>((\s|\t|\r|\n)*)<br \/>/gi, "</p><p>");
					
					
					result = result.replace(/style="(\s*)"/gi, "");
					
					result = result.replace(/<span(\s*)>/gi, "");
					
					result = result.replace(/<span style="((\s|\t|\r|\n)*)font-style: italic;((\s|\t|\r|\n)*)">(.*?)<\/span>/gi, "<em>$5<\/em>");
					
					result = result.replace(/<span style="((\s|\t|\r|\n)*)font-weight: bold;((\s|\t|\r|\n)*)">(.*?)<\/span>/gi, "<b>$5<\/b>");
					
					result = result.replace(/<\/p>((\s|\t|\r|\n)*)<br><\/span>((\s|\t|\r|\n)*)/gi, "</p>");
										
					data[ 'html' ] = result;
				}
			}, this );
		},

		requires : [ 'clipboard' ]
	});
})();

