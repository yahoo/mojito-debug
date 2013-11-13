YUI.add('mojito-debug-hook-container', function (Y) {
    'use strict';
    var HookContainer = function (hookName, hook) {
        var title = hook.config.title,
            description = hook.config.description,
            container = Y.Node.create('<div/>').addClass('maximized hook-container').set('id', hookName + '-hook'),
            header = Y.Node.create('<div/>').addClass('header no-select'),
            titleNode = Y.Node.create('<span/>').addClass('title').set('text', title).set('title', description),
            closeButton = Y.Node.create('<span/>').addClass('close button').set('text', 'x'),
            minimize = Y.Node.create('<span/>').addClass('minimize button').set('innerHTML', '&ndash;'),
            maximize = Y.Node.create('<span/>').addClass('maximize button').set('innerHTML', '&#9634;'),
            content = Y.Node.create('<div/>').addClass('content'),
            contentWrapper = Y.Node.create('<div/>').addClass('content-wrapper');

        this.opened = true;
        this.maximized = true;
        this.content = content;
        this.contentWrapper = contentWrapper;
        this.hook = hookName;

        closeButton.on('click', function () {
            container.close(true);
        });

        minimize.on('click', function () {
            container.toggle();
        });

        maximize.on('click', function () {
            container.toggle();
        });

        header.append(titleNode)
              .append(closeButton)
              .append(minimize)
              .append(maximize);

        contentWrapper.append(content);

        container.append(header)
                 .append(contentWrapper);

        Y.mix(container, this);
        Y.mix(container, HookContainer.prototype);

        if (hook) {
            container.update(hook);
        }

        return container;
    };

    HookContainer.prototype = {
        update: function (hook) {
            // certain hooks will specifically say to append instead of replace
            this.content.set('innerHTML', '');
            this.content.append(new Y.mojito.debug.GenericHook(hook.debugData));
        },

        close: function (anim) {
            Y.Debug.binder.removeHook(this.hook);
            if (anim) {
                this.hide({duration: 0.2});
            } else {
                this.setStyle('opacity', 0)
                    .setStyle('display', 'none')
                    .set('hidden', true);
            }
            this.opened = false;
        },

        open: function (anim) {
            Y.Debug.binder.addHook(this.hook);
            if (anim) {
                this.show({duration: 0.2});
            } else {
                this.setStyle('opacity', 1)
                    .setStyle('display', 'block')
                    .set('hidden', false);
            }
            this.opened = true;
        },

        toggle: function (state) {
            if (!state) {
                this.maximized = !this.maximized;
            } else if (state === 'maximize') {
                this.maximized = true;
            } else {
                this.maximized = false;
            }

            var contentWrapper = this.contentWrapper;

            if (this.maximized) {
                this.addClass('maximized');
            } else {
                this.removeClass('maximized');
            }

            contentWrapper.transition({
                easing: 'ease-out',
                duration: 0.3,
                height:  this.maximized ? contentWrapper.get("scrollHeight") + "px" : "0px"
            });
        }
    };

    Y.namespace('mojito.debug').HookContainer = HookContainer;
}, '0.0.1', {
    requires: [
        'mojito-debug-generic-hook',
        'transition'
    ]
});
