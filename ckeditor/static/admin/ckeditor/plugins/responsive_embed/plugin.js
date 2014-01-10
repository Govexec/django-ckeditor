(function() {

    var EMBED_WRAPPER_CLS = 'embed-wrapper';
    var CKE_RESPONSIVE_EMBED = 'cke-embed';

    var add_listeners = function(dialog){
        var source = dialog.getContentElement('main', 'source');
        if(!dialog.on_change){
            dialog.on_change = source.getInputElement().on('change', function() {
                switch(source.getValue()){
                case ResponsiveEmbed.GENERIC:
                    break;
                case ResponsiveEmbed.YOUTUBE:
                    show_youtube(dialog);
                    break;
                case ResponsiveEmbed.BRIGHTCOVE:
                    show_brightcove(dialog);
                    break;
                default:
                    break;
                }
            });
        }
    }

    var handle_fake_swap = function(editor, dialog){
        // Clear previously saved elements.
        dialog.fake_image = null;
        dialog.real_node = null;

        var fake_image = dialog.getSelectedElement();

        if(fake_image && fake_image.hasClass(CKE_RESPONSIVE_EMBED))
        {
            var real_node = editor.restoreRealElement(fake_image);
            if(real_node.hasClass(EMBED_WRAPPER_CLS))
            {
                dialog.fake_image = fake_image;
                dialog.real_node = real_node;
                dialog.setupContent(real_node);

                var embed_container = real_node.getChild(0);
                if(embed_container.hasClass(ResponsiveEmbed.BRIGHTCOVE))
                {
                    show_brightcove(dialog);
                }
                else
                {
                    show_youtube(dialog);
                }
            }
        }
        else
        {
            show_youtube(dialog);
        }
    }

    var show_youtube = function(dialog) {
        var source = dialog.getContentElement('main', 'source');
        var url = dialog.getContentElement('main', 'url');
        var publish_code = dialog.getContentElement('main', 'publish_code');

        publish_code.getElement().hide();
        publish_code.setValue('');
        publish_code.disable();

        url.enable();
        url.getElement().show();
    }
    var show_brightcove = function(dialog) {
        var source = dialog.getContentElement('main', 'source');
        var url = dialog.getContentElement('main', 'url');
        var publish_code = dialog.getContentElement('main', 'publish_code');

        url.getElement().hide();
        url.setValue('');
        url.disable();

        publish_code.enable();
        publish_code.getElement().show();
    }

    var construct_embed_from_ui = function(ui_element, real_element) {
        if(ui_element.isEnabled())
        {
            var dialog = ui_element.getDialog();
            var source = dialog.getContentElement('main', 'source');
            var Embed;
            switch(source.getValue()) {
            case ResponsiveEmbed.YOUTUBE:
                Embed = ResponsiveEmbed.youtubeEmbed;
                break;
            case ResponsiveEmbed.BRIGHTCOVE:
                Embed = ResponsiveEmbed.brightCoveEmbed;
                break;
            default:
                Embed = ResponsiveEmbed.genericEmbed;
                break;
            }
            real_element.setHtml(Embed(ui_element.getValue()).generate().get_code());
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
                                ['BrightCove', ResponsiveEmbed.BRIGHTCOVE],
                            ],
                            'default': ResponsiveEmbed.YOUTUBE,
                            setup: function(element)
                            {
                                var child = element.getChild(0);
                                if(child)
                                {
                                    var items = [ResponsiveEmbed.YOUTUBE, ResponsiveEmbed.BRIGHTCOVE];
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
                                var items = [ResponsiveEmbed.YOUTUBE, ResponsiveEmbed.BRIGHTCOVE];
                                for(var i = 0; i < items.length; ++i)
                                {
                                    var cls = items[i];
                                    child.removeClass(cls);
                                }
                                child.addClass(this.getValue());
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
                        {
                            id: 'url',
                            type: 'text',
                            label: 'URL',
                            labelLayout: 'horizontal',
                            setup: function(element)
                            {
                                var embed_container = element.getChild(0);
                                var embed = embed_container.getChild(0);
                                if(embed_container.hasClass(ResponsiveEmbed.YOUTUBE))
                                {
                                    this.setValue(embed.data('embed-src'));
                                }
                            },
                            commit: function(element)
                            {
                                construct_embed_from_ui(this, element);
                            },
                            validate: function(){
                                var source = this.getDialog().getContentElement('main', 'source');
                                if(source.getValue() == ResponsiveEmbed.YOUTUBE)
                                {
                                    var val = this.getValue();
                                    if(!val)
                                    {
                                        alert('URL cannot be blank');
                                        return false;
                                    }
                                }
                                return true;
                            }
                        },
                        {
                            id: 'publish_code',
                            type: 'textarea',
                            label: 'Publishing Code',
                            labelLayout: 'horizontal',
                            setup: function(element)
                            {
                                var embed_container = element.getChild(0);
                                if(embed_container.hasClass(ResponsiveEmbed.BRIGHTCOVE))
                                {
                                    var html = embed_container
                                        .getHtml()
                                        .replace(/<cke:/g, '<')
                                        .replace(/<\/cke:/g, '</');

                                    this.setValue(html);
                                }
                            },
                            commit: function(element)
                            {
                                construct_embed_from_ui(this, element);
                            },
                            validate: function(){
                                var source = this.getDialog().getContentElement('main', 'source');
                                if(source.getValue() == ResponsiveEmbed.BRIGHTCOVE)
                                {
                                    var val = this.getValue();
                                    if(!val)
                                    {
                                        alert('Publishing code cannot be blank');
                                        return false;
                                    }
                                }
                                return true;
                            }
                        },
                    ]
                }
            ],
            onLoad: function()
            {
                show_youtube(this);
                add_listeners(this);
            },
            onShow: function()
            {
                handle_fake_swap(editor, this);
            },
            onOk: function()
            {
                var real_node;
                if(!this.fake_image)
                {
                    var dialog = this;
                    var source = dialog.getValueOf('main', 'source');
                    var size = dialog.getValueOf('main', 'size');

                    var url = dialog.getValueOf('main', 'url');
                    var publish_code = dialog.getValueOf('main', 'publish_code');

                    switch(source){
                    case ResponsiveEmbed.YOUTUBE:
                        var embed_code = ResponsiveEmbed.youtubeEmbed(url).generate().get_code();
                        break;
                    case ResponsiveEmbed.BRIGHTCOVE:
                        var embed_code = ResponsiveEmbed.brightCoveEmbed(publish_code).generate().get_code();
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
                'img.' + CKE_RESPONSIVE_EMBED
                 + '{'
                     + 'background-image: url(' + CKEDITOR.getUrl(this.path + 'icons/placeholder.png') + ');'
                     + 'background-position: center center;'
                     + 'background-repeat: no-repeat;'
                     + 'border: 1px solid #a9a9a9;'
                     + 'width: 80px;'
                     + 'height: 80px;'
                 + '}'
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
                        if(element.is('img') && element.hasClass(CKE_RESPONSIVE_EMBED))
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
                            var class_attr = element.attributes.class;
                            if(class_attr && class_attr.indexOf(EMBED_WRAPPER_CLS) > -1)
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
