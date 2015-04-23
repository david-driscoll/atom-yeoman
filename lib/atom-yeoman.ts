import _ = require('lodash')
import fs = require('fs')
import EventKit = require("event-kit");

import dependencyChecker = require('./dependency-checker');
import Generator = require("./generator");
import GeneratorView = require("./generator-view");

class Yeoman {
    private emitter: EventKit.Emitter;
    private disposable: EventKit.CompositeDisposable;
    private generator: Generator;

    public activate(state) {
        var view: GeneratorView;
        this.disposable = new EventKit.CompositeDisposable();
        var generator = this.generator = new Generator();
        this.disposable.add(
            atom.commands.add('atom-workspace', 'yeoman:toggle', () => {
                generator.start();
            }));

        if (dependencyChecker.findAllDeps(this.getPackageDir())) {
            this.emitter = new EventKit.Emitter;
        } else {
            _.map(dependencyChecker.errors() || [], missingDependency => console.error(missingDependency))
        }
    }

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
