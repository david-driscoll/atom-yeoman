import _ = require('lodash')
import fs = require('fs')
import EventKit = require("event-kit");

import dependencyChecker = require('./dependency-checker');
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
            atom.commands.add('atom-workspace', 'yeoman:toggle', () => {
                new Generator().start();
            }));

        if (dependencyChecker.findAllDeps(this.getPackageDir())) {
            this.emitter = new EventKit.Emitter;
        } else {
            _.map(dependencyChecker.errors() || [], missingDependency => console.error(missingDependency))
        }
    }

    public generatorServiceV1 = new generatorService();

    public getPackageDir() {
        return _.find(atom.packages.getPackageDirPaths(), function(packagePath) {
            return fs.existsSync(packagePath + "/atom-yeoman");
        });
    }

    public deactivate() {
        this.disposable.dispose();
    };
}

var instance = new Yeoman
export = instance;
