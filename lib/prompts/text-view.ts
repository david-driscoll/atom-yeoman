import spacePen = require("atom-space-pen-views");
import _ = require('lodash');

class TextView extends spacePen.View {
    private panel: Atom.Panel;
    private miniEditor: spacePen.TextEditorView;
    private message: JQuery;

    constructor(private question: Prompt.Text, private invokeNext: (result: any) => void) {
        super();
        //this.buildGenerators();
        //_model.onGeneratorsUpdated(() => this.buildGenerators());
    }

    public static content() {
        return this.div({}, () => {
            this.p({
                outlet: 'message'
            }, '');
            return this.subview('miniEditor',
                new spacePen.TextEditorView({
                    mini: true
                }));
        });
    }

    public initialize() {
        this.addClass('prompt');
        this.on('core:confirm', () => this.confirmed());
        this.on('core:cancel', () => this.cancel());
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
        this.message.text(this.question.message);

        this.panel.show();
        this.miniEditor.setText(this.question.default);
        this.miniEditor.focus();
        var textEditor : Atom.TextEditor = <any>this.miniEditor.getModel();
        textEditor.selectAll();
    }

    public hide() {
        this.panel && this.panel.hide();
    }

    public cancel() {
        var filterEditorViewFocused = this.miniEditor.hasFocus();
        this.miniEditor.setText('');
        this.hide();
    }

    public confirmed() {

        if (this.invokeNext) {
            this.invokeNext(this.miniEditor.getText());
        }
        this.cancel();

        return null;
    }
}
export = TextView;
