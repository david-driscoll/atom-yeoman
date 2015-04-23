import spacePen = require("atom-space-pen-views");
import _ = require('lodash');

class ListView extends spacePen.SelectListView {
    private panel: Atom.Panel;
    private previouslyFocusedElement: Node;
    private eventElement: any;
    private message: JQuery;

    constructor(private question: Prompt.List, private invokeNext: (result: any) => void) {
        super();
        //this.buildGenerators();
        //_model.onGeneratorsUpdated(() => this.buildGenerators());
    }

    public static content() {
        return this.div({}, () => {
            this.p({
                outlet: 'message'
            }, '');

            super.content();
        });
    }

    public keyBindings = null;

    public initialize() {
        super.initialize();
        this.addClass('prompt');
    }

    public getFilterKey() {
        return 'name';
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
        this.message.text(this.question.message);

        if (this.previouslyFocusedElement[0] && this.previouslyFocusedElement[0] !== document.body) {
            this.eventElement = this.previouslyFocusedElement[0];
        } else {
            this.eventElement = atom.views.getView(atom.workspace);
        }

        // infer the generator somehow? based on the project information?  store in the project system??
        this.setItems(this.question.choices);
        this.focusFilterEditor();
    }

    public hide() {
        this.panel && this.panel.hide();
    }

    public viewForItem(item :{ name:string; value:string; }) {
        var keyBindings = this.keyBindings;
        return spacePen.$$(function() {
            return this.li({
                "class": 'event',
                'data-event-name': item.value
            }, () => {
                    return this.span(item.name, {
                        title: item.name
                    });
                });
        });
    }

    public confirmed(item?:{ name:string; value:string; }): spacePen.View {
        this.cancel();

        if (this.invokeNext) {
            this.invokeNext(item.value);
        }

        return null;
    }
}

export = ListView;
