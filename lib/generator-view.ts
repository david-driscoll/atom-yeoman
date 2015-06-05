import spacePen = require("atom-space-pen-views");
import _ = require('./lodash');

// TS 1.4 issue (not in 1.5)
declare var _super: any;
declare var _this: any;

class GeneratorView extends spacePen.SelectListView {
    private panel: Atom.Panel;
    private previouslyFocusedElement: Node;
    private eventElement: any;
    public message: JQuery;

    constructor(private _items: { displayName: string; name: string; }[], private invokeNext: (result: any) => void) {
        super();
    }

    public static content() {
        return this.div({}, () => {
            this.p({
                outlet: 'message'
            }, '');

            // TS 1.4 issue
            (<any>spacePen.SelectListView).content.call(this);
        });
    }

    public keyBindings = null;

    public initialize() {
        // TS 1.4 issue
        (<any>spacePen.SelectListView).prototype.initialize.call(this);
        this.addClass('generator');
    }

    public getFilterKey() {
        return 'displayName';
    }

    public cancelled() {
        return this.hide();
    }

    public toggle() {
        if (this.panel && this.panel.isVisible()) {
            this.cancel();
        } else {
            this.show();
        }
    }

    public show() {
        if (this.panel == null) {
            this.panel = atom.workspace.addModalPanel({ item: this });
        }
        this.panel.show();
        this.storeFocusedElement();

        if (this.previouslyFocusedElement[0] && this.previouslyFocusedElement[0] !== document.body) {
            this.eventElement = this.previouslyFocusedElement[0];
        } else {
            this.eventElement = atom.views.getView(atom.workspace);
        }


        this.keyBindings = atom.keymaps.findKeyBindings({
            target: this.eventElement
        });

        // infer the generator somehow? based on the project information?  store in the project system??
        var commands = _.sortBy(this._items, 'displayName');
        this.setItems(commands);
        this.focusFilterEditor();
    }

    public hide() {
        this.panel && this.panel.hide();
        this.panel.destroy();
        this.panel = null;
    }

    public viewForItem(item: { displayName: string; name: string; }) {
        var keyBindings = this.keyBindings;
        return spacePen.$$(function() {
            return this.li({
                "class": 'event',
                'data-event-name': item.name
            }, () => {
                    return this.span(item.displayName, {
                        title: item.name
                    });
                });
        });
    }

    public confirmed(item?: any): spacePen.View {
        this.cancel();

        if (this.invokeNext) {
            this.invokeNext(item.name);
        }

        return null;
    }
}

export = GeneratorView;
