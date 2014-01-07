(function() {

    var EMBED_WRAPPER_CLS = 'embed-wrapper';
    var CKE_RESPONSIVE_EMBED = 'cke-embed';

    var ancestor_with_class = function(element, classname, include_element)
    {
        var closer_first = true;
        var parents = element.getParents(closer_first);
        if(include_element)
        {
            parents.unshift(element);
        }
        for(var i = 0; i < parents.length; ++i)
        {
            var parent = parents[i];
            if(parent.hasClass(classname))
            {
                return parent;
            }
        }
    }

    var responsive_embed_dialog = function(editor){
        return {
            title: 'Embed content',
            minHeight: 100,
            contents: [
                {
                    id: 'main',
                    elements: [
                        {
                            id: 'source',
                            type: 'select',
                            required: true,
                            validate: CKEDITOR.dialog.validate.notEmpty("Source cannot be empty"),
                            label: 'Select source of content',
                            labelLayout: 'horizontal',
                            items: [
                                ['YouTube', ResponsiveEmbed.YOUTUBE],
//                                ['BrightCove', ResponsiveEmbed.BRIGHTCOVE],
                            ],
                            'default': ResponsiveEmbed.YOUTUBE,
                            setup: function(element)
                            {
                                var child;
                                if(element && child = element.getChild(0))
                                {
                                    var items = [ResponsiveEmbed.YOUTUBE];//, 'embed-brightcove'];
                                    for(var i = 0; i < items.length; ++i)
                                    {
                                        var cls = items[i];
                                        if(child.hasClass(cls))
                                        {
                                            this.setValue(cls);
                                            break;
                                        }
                                    }
                                }
                            },
                            commit: function(element)
                            {
                                var child = element.getChild(0);
                                var items = [ResponsiveEmbed.YOUTUBE];//, 'embed-brightcove'];
                                for(var i = 0; i < items.length; ++i)
                                {
                                    var cls = items[i];
                                    child.removeClass(cls);
                                }
                                child.addClass(this.getValue());
                            },
                        },
                        {
                            id: 'url',
                            type: 'text',
                            required: true,
                            validate: CKEDITOR.dialog.validate.notEmpty("URL cannot be empty"),
                            label: 'URL',
                            labelLayout: 'horizontal',
                            setup: function(element)
                            {// UGLY!!!
                                if(!element)
                                {
                                    return;
                                }
                                var wrapper = element.getChild(0);
                                if(wrapper)
                                {
                                    var embed = wrapper.getChild(0);
                                    if(embed)
                                    {
                                        var data = embed.data('cke-realelement');
                                        if(data)
                                        {
                                            embed = CKEDITOR.dom.element.createFromHtml(decodeURIComponent(data));
                                        }
                                        this.setValue(embed.data('embed-src'));
                                    }
                                }
                            },
                            commit: function(element)
                            {
                                var embed_container = element.getChild(0);
                                var embed = embed_container.getChild(0);
                                if(embed_container.hasClass(ResponsiveEmbed.YOUTUBE))
                                {
                                    var r_embed = ResponsiveEmbed.youtubeEmbed(this.getValue());
                                    var source = r_embed.source;

                                    embed.data('embed-src', source);
                                    embed.setAttribute('src', source);
                                }
                                else
                                {
                                    embed.data('embed-src', this.getValue());
                                    embed.setAttribute('src', this.getValue());
                                }
                            },
                        },
                        {
                            id: 'size',
                            type: 'select',
                            required: true,
                            validate: CKEDITOR.dialog.validate.notEmpty("Size cannot be empty"),
                            label: 'Select size of content',
                            labelLayout: 'horizontal',
                            items: [
                                ['Normal', 'normal'],
                                ['Big', 'big'],
                                ['Huge', 'huge']
                            ],
                            'default': 'big',
                            setup: function(element)
                            {
                                if(element)
                                {
                                    var items = ['normal', 'big', 'huge'];
                                    for(var i = 0; i < items.length; ++i)
                                    {
                                        var cls = items[i];
                                        if(element.hasClass(cls))
                                        {
                                            this.setValue(cls);
                                            return;
                                        }
                                    }
                                }
                            },
                            commit: function(element)
                            {
                                var items = ['normal', 'big', 'huge'];
                                for(var i = 0; i < items.length; ++i)
                                {
                                    var cls = items[i];
                                    element.removeClass(cls);
                                }
                                element.addClass(this.getValue());
                            },
                        },
                    ]
                }
            ],
            onShow: function()
            {
				// Clear previously saved elements.
				this.fake_image = null;
                this.real_node = null;

				var fake_image = this.getSelectedElement();

				if(fake_image && fake_image.data( 'cke-real-element' ))
                {
                    var real_node = editor.restoreRealElement(fake_image);
                    if(real_node.hasClass(EMBED_WRAPPER_CLS))
                    {
                        this.fake_image = fake_image;
                        this.real_node = real_node;
                        this.setupContent(real_node);
                    }
                }
            },
            onOk: function()
            {
                var real_node;
                if(!this.fake_image)
                {
                    var dialog = this;
                    var source = dialog.getValueOf('main', 'source');
                    var url = dialog.getValueOf('main', 'url');
                    var size = dialog.getValueOf('main', 'size');

                    switch(source){
                    case ResponsiveEmbed.YOUTUBE:
                        var embed_code = ResponsiveEmbed.youtubeEmbed(url).generate().get_code();
                        break;
                    default:
                        var embed_code = ResponsiveEmbed.genericEmbed(url).generate().get_code();
                        break;
                    }
                    var wrapped_code = (
                        '<div class="' + EMBED_WRAPPER_CLS + ' ' + size + '">'
                        + embed_code
                        + '</div>'
                    );
                    real_node = CKEDITOR.dom.element.createFromHtml(wrapped_code);
                }
                else
                {
                    real_node = this.real_node;
                }
                this.commitContent(real_node);

				var new_fake_image = editor.createFakeElement(real_node, CKE_RESPONSIVE_EMBED, 'div', true);
				if(this.fake_image)
				{
					new_fake_image.replace(this.fake_image);
					editor.getSelection().selectElement(new_fake_image);
				}
				else
                {
					editor.insertElement(new_fake_image);
                }
            },
        };
    }

	CKEDITOR.plugins.add('responsive_embed',
	{
        requires: ['dialog', 'fakeobjects'],
		init: function(editor)
		{
            var DIALOG_EMBED_CMD = 'embed_dialog';

            editor.addCommand(DIALOG_EMBED_CMD, new CKEDITOR.dialogCommand(DIALOG_EMBED_CMD));
			editor.ui.addButton('Embed',
            {
                label: 'Embed',
                command: DIALOG_EMBED_CMD,
                icon: this.path + 'icons/embed_icon.png'
            });
            CKEDITOR.dialog.add(DIALOG_EMBED_CMD, responsive_embed_dialog);

            editor.addCss(
				'img.' + CKE_RESPONSIVE_EMBED +
				'{' +
					'background-image: url(' + CKEDITOR.getUrl(this.path + 'icons/placeholder.png') + ');' +
					'background-position: center center;' +
					'background-repeat: no-repeat;' +
					'border: 1px solid #a9a9a9;' +
					'width: 80px;' +
					'height: 80px;' +
				'}'
			);
			editor.on('doubleclick', function(evt)
            {
                var element = evt.data.element;
                if(element.is('img') && element.hasClass(CKE_RESPONSIVE_EMBED))
                {
                    evt.data.dialog = DIALOG_EMBED_CMD;
                }
            });

            if(editor.contextMenu)
            {
                var MENU_GROUP = 'responsive_embed';
                var MENU_ITEM = MENU_GROUP;

                editor.addMenuGroup(MENU_GROUP);
                editor.addMenuItem(MENU_ITEM,
                {
                    label: 'Edit Embed',
                    command: DIALOG_EMBED_CMD,
                    group: MENU_GROUP,
                    icon: this.path + 'icons/embed_icon.png'
                });

                editor.contextMenu.addListener(function(element)
                {
                    if(element)
                    {
                        if(element.is('img') && element.hasClass(EMBED_WRAPPER_CLS))
                        {
                            response = {};
                            response[MENU_ITEM] = CKEDITOR.TRISTATE_OFF;
                            return response;
                        }
                    }
                });
            }
		},
        afterInit: function(editor)
        {
			var dataProcessor = editor.dataProcessor;
			var	dataFilter = dataProcessor && dataProcessor.dataFilter;

			if(dataFilter)
			{
				dataFilter.addRules(
				{
					elements:
					{
						div: function(element)
						{
                            if(element.attributes.class.indexOf(EMBED_WRAPPER_CLS) > -1)
                            {
                                return editor.createFakeParserElement(element, CKE_RESPONSIVE_EMBED, 'div', true);
                            }
						}
					}
				});
			}
        }
	});

})();
