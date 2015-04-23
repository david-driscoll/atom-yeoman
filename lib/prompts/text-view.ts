import spacePen = require("atom-space-pen-views");
import _ = require('lodash');

export class TextView extends spacePen.View {
    protected panel: Atom.Panel;
    protected miniEditor: spacePen.TextEditorView;
    protected message: JQuery;

    constructor(protected question: Prompt.Text, protected invokeNext: (result: any) => void) {
        super();
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

export class ConfirmView extends TextView {
    public show() {
        if (this.panel == null) {
            this.panel = atom.workspace.addModalPanel({ item: this });
        }
        this.message.text(this.question.message + ' ' + this.yesNo());

        this.panel.show();
        this.miniEditor.setText(this.question.default ? 'Y' : 'N');
        this.miniEditor.focus();
        var textEditor : Atom.TextEditor = <any>this.miniEditor.getModel();
        textEditor.selectAll();
    }

    private yesNo() {
        var question : Prompt.Confirm = <any>this.question;
        if (question.default === true) {
            return '(Y/n)';
        } else {
            return '(y/N)';
        }
    }
}
