import _ = require('lodash')
import fs = require('fs')
import EventKit = require("event-kit");

import Generator = require("./generator");
import GeneratorView = require("./generator-view");
import generatorService = require("./generator-service");

class Yeoman {
    private emitter: EventKit.Emitter;
    private disposable: EventKit.CompositeDisposable;

    public activate(state) {
        var view: GeneratorView;
        this.disposable = new EventKit.CompositeDisposable();
        this.disposable.add(
            atom.commands.add('atom-workspace', 'yo:yeoman', () => {
                new Generator().start();
            }));
    }

    public generatorServiceV1() {
        console.log('generatorServiceV1')
        return new generatorService();
    }

    public getPackageDir() {
        return _.find(atom.packages.getPackageDirPaths(), function(packagePath) {
            return fs.existsSync(packagePath + "/atom-yeoman");
        });
    }

    public deactivate() {
        this.disposable.dispose();
    }
}

var instance = new Yeoman;
export = instance;
