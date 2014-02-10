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
                     && ( forceFromGoogle || ( /((.*)id="docs-internal-guid(.*))/ ).test( googleHtml ) ) )
                {
                    result = '<div>'+googleHtml+'</div>';

                    var cleanedResult = "";

                    whitelist = {'span': [], 'a': ['href'], 'p': [], 'li': [], 'ul': [], 'ol': [] };
                    changeToPList = {'h1': [], 'h2': [], 'h3': [], 'h4': [], 'h5': [], 'div': [] };

                    function trimAttributes(node, allowedAttrs) {
                        $.each(node.attributes, function() {
                            var attrName = this.name;
                            if ($.inArray(attrName, allowedAttrs) == -1) {
                                $(node).removeAttr(attrName);
                            }
                            $(node).removeAttr('style');
                            $(node).removeAttr('dir');
                        });
                    }
                    function sanitize(html, whitelist, changeToPList) {
                        var output = $('<div>'+html+'</div>');
                        output.find('*').each(function() {
                            var allowedAttrs = whitelist[this.nodeName.toLowerCase()];
                            if(!allowedAttrs) {
                                if($(this).is(":empty")) { $(this).remove(); }
                                else {
                                    if(changeToPList[this.nodeName.toLowerCase()] && $(this).parent().get(0).nodeName.toLowerCase() != 'li'){
                                        $(this).wrapInner("<p></p>");
                                    }
                                    $(this).contents().unwrap();
                                }
                            } else {
                                if(this.nodeName.toLowerCase() == 'p' && $(this).parent().get(0).nodeName.toLowerCase() == 'li') {
                                    $(this).contents().unwrap();
                                }
                                else if(this.nodeName.toLowerCase() == 'span') {
                                    if($(this).is(":empty")) { $(this).remove(); }
                                    else {
                                        italic = ($(this).css("font-style") == "italic") ? true : false;
                                        bold = ($(this).css("font-weight") == "bold" || $(this).css("font-weight") == 700) ? true : false;
                                        if(italic) {$(this).wrapInner("<em></em>");}
                                        if(bold){$(this).wrapInner("<strong></strong>");}
                                        $(this).contents().unwrap();
                                    }
                                }
                                trimAttributes(this, allowedAttrs);
                            }
                        });
                        return output.html();
                    }

                    cleanedResult = sanitize($(result).html(), whitelist, changeToPList);

                    data[ 'html' ] = cleanedResult;
                }
            }, this );
        },

        requires : [ 'clipboard' ]
    });
})();

