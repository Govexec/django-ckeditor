(function() {

    var EMBED_WRAPPER_CLS = 'embed-wrapper';

	function forceHtmlMode(evt) { evt.data.mode = 'html'; }

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
                                ['YouTube', 'embed-youtube'],
                                //['BrightCove', 'embed-brightcove'],
                            ],
                            'default': 'embed-youtube',
                            setup: function(element)
                            {
                                if(!element)
                                {
                                    return;
                                }
                                var child = element.getChild(0);
                                if(!child)
                                {
                                    return;
                                }
                                var items = ['embed-youtube'];//, 'embed-brightcove'];
                                for(var i = 0; i < items.length; ++i)
                                {
                                    var cls = items[i];
                                    if(child.hasClass(cls))
                                    {
                                        this.setValue(cls);
                                    }
                                }
                            },
                            commit: function(element)
                            {
                                var child = element.getChild(0);
                                var items = ['embed-youtube'];//, 'embed-brightcove'];
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
                                            console.log(data);
                                            embed = CKEDITOR.dom.element.createFromHtml(decodeURIComponent(data));
                                            console.log('fart');
                                        }
                                        this.setValue(embed.data('src'));
                                    }
                                }
                            },
                            commit: function(element)
                            {
                                var embed = element.getChild(0).getChild(0);
                                var data = embed.data('cke-realelement');
                                if(data)
                                {
                                    var real_ele = CKEDITOR.dom.element.createFromHtml(decodeURIComponent(data));
                                    real_ele.data('src', this.getValue());
                                    real_ele.setAttribute('src', this.getValue());

                                    embed.data('cke-realelement', encodeURIComponent(real_ele.getOuterHtml()));
                                }
                                else
                                {
                                    embed.data('src', this.getValue());
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
                var sel = editor.getSelection();
                var element = sel.getStartElement();
                if(element)
                {
                    var include_element = true;
                    element = ancestor_with_class(element, EMBED_WRAPPER_CLS, include_element);
                }
                if(element && element.hasClass(EMBED_WRAPPER_CLS) && !element.data('cke-realelement'))
                {
                    this.new_element = false;
                    this.setupContent(element);
                    this.element = element;
                }
                else
                {
                    this.new_element = true;
                }
            },
            onOk: function()
            {
                var dialog = this;
                var source = dialog.getValueOf('main', 'source');
                var url = dialog.getValueOf('main', 'url');
                var size = dialog.getValueOf('main', 'size');

                switch(source){
                case 'embed-youtube':
                    if(!this.new_element)
                    {
                        this.commitContent(this.element);
                    }
                    else
                    {
                        var embed_code = ResponsiveEmbed.youtubeEmbed(url).generate().get_code();
                        var wrapped_code = (
                            '<div class="' + EMBED_WRAPPER_CLS + ' ' + size + '">'
                            + embed_code
                            + '</div>'
                        );
                        var ele = CKEDITOR.dom.element.createFromHtml(wrapped_code);
                        editor.insertElement(ele);
                        this.element = ele;
                    }
                    break;
                default:
                    break;
                }
            },
        };
    }

	CKEDITOR.plugins.add('responsive_embed',
	{
		init : function(editor)
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
                });

                editor.contextMenu.addListener(function(element)
                {
                    if(element)
                    {
                        include_element = true;
                        var ancestor = ancestor_with_class(element, EMBED_WRAPPER_CLS, include_element);
                        if(ancestor && !ancestor.isReadOnly() && !ancestor.data('cke-realelement'))
                        {//if data-cke-realelement then it is a fake element
                         //with the real element stored in that attribute
                            response = {};
                            response[MENU_ITEM] = CKEDITOR.TRISTATE_OFF;
                            return response;
                        }
                    }
                });
            }
		}
	});

})();
