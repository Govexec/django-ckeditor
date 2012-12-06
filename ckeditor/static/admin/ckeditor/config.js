/*
Copyright (c) 2003-2012, CKSource - Frederico Knabben. All rights reserved.
For licensing, see LICENSE.html or http://ckeditor.com/license
*/

CKEDITOR.editorConfig = function( config )
{
	// Define changes to default configuration here. For example:
	// config.language = 'fr';
	// config.uiColor = '#AADC6E';
	// config.enterMode = CKEDITOR.ENTER_BR;
	// config.autoParagraph = false;
	// config.fillEmptyBlocks = false;
};


CKEDITOR.on('instanceReady', function (ev) {
// Ends self closing tags the HTML4 way, like <br>.
ev.editor.dataProcessor.htmlFilter.addRules(
    {
        elements:
        {
            $: function (element) {
                if (element.name == 'img') {
                    // Output dimensions of images as width and height
                    var style = element.attributes.style;

                    if (style) {
                        // Get the width from the style.
                        var match = /(?:^|\s)width\s*:\s*(\d+)px/i.exec(style),
                            width = match && match[1];

                        // Get the height from the style.
                        match = /(?:^|\s)height\s*:\s*(\d+)px/i.exec(style);
                        var height = match && match[1];

                        if (width) {
                            element.attributes.style = element.attributes.style.replace(/(?:^|\s)width\s*:\s*(\d+)px;?/i, '');
                            element.attributes.width = width;
                        }

                        if (height) {
                            element.attributes.style = element.attributes.style.replace(/(?:^|\s)height\s*:\s*(\d+)px;?/i, '');
                            element.attributes.height = height;
                        }
                    }
                } else if (element.name == 'a') {

                    // Remove OREFs from links
                    var href = element.attributes.href;

                    if (href) {
                        var pattern = /(&amp;|&|\?)(oref=[a-z0-9\-]*)(&amp;|&|$|#)/i;
                        var match = pattern.exec(href);

                        if (match != null) {
                            var beforeOref = match[1];
                            var oref = match[2];
                            var afterOref = match[3];

                            if ((beforeOref == "?") && ((afterOref != "&") && (afterOref != "&amp;"))) {
                                // remove ?oref=whatever
                                var replace = beforeOref + oref;
                                element.attributes["data-cke-saved-href"] = href.replace(replace, "");
                            } else if ((afterOref == "&") || (afterOref == "&amp;")) {
                                // remove oref=whatever&
                                var replace = oref + afterOref;
                                element.attributes["data-cke-saved-href"] = href.replace(replace, "");
                            } else if ((beforeOref == "&") || (beforeOref == "&amp;")) {
                                // remove &oref=whatever
                                var replace = beforeOref + oref;
                                element.attributes["data-cke-saved-href"] = href.replace(replace, "");
                            }
                        }
                    }
                }



                if (!element.attributes.style)
                    delete element.attributes.style;

                return element;
            }
        }
    });
});
