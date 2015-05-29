import _ = require('./lodash');
import fs = require('fs')
import EventKit = require("event-kit");

var Generator;
import GeneratorView = require("./generator-view");

class Yeoman {
    private emitter: EventKit.Emitter;
    private disposable: EventKit.CompositeDisposable;

    public activate(state) {
        var view: GeneratorView;
        this.disposable = new EventKit.CompositeDisposable();
        this.disposable.add(
            atom.commands.add('atom-workspace', 'yo:yeoman', () => {
                if (!Generator) Generator = require("./generator");
                _.defer(() => new Generator().start());
            }));
    }

    public deactivate() {
        this.disposable.dispose();
    }
}

var instance = new Yeoman;
export = instance;
