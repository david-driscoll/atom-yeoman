var loophole = require("loophole");
var Environment = (function() {
    var path = require('path');

    var res;
    loophole.allowUnsafeNewFunction(() => res = require('yeoman-environment'));
    var defaultGetNpmPaths = res.prototype.getNpmPaths;

    res.prototype.getNpmPaths = function() {
        // we're in atom... which is not node... if installed locally.
        var paths: any[] = defaultGetNpmPaths.call(this);
        // drop the atom path
        paths.pop();
        // add the default path for the user.
        if (process.platform === 'win32') {
            paths.push(path.join(process.env.APPDATA, 'npm/node_modules'));
        } else {
            paths.push('/usr/lib/node_modules');
        }

        return paths;
    }
    return res;
})();
import AtomAdapter = require("./atom-adapter");
import Promise = require("bluebird");
import _ = require('lodash');
import path = require('path');
import EventKit = require("event-kit");
import GeneratorView = require("./generator-view");

class Generator {
    private _metadata: { [key: string]: { namespace: string; resolved: string; displayName: string; } };
    private env: any;
    private startPath = process.cwd();
    private adapter: AtomAdapter;
    public generators: Promise<{ displayName: string; name: string; }[]>;

    public loaded = false;

    // Allow to limit the generator to a specific subset.
    // aspnet:, jquery:, etc.
    constructor(private prefix?: string, private path?: string) {

    }

    public start() {
        this.selectPath();
    }

    private selectPath() {
        var directories = atom.project.getDirectories().map(z => z.getPath());
        if (directories.length === 0) {
            // might be annoying...
            //atom.pickFolder((directories: string[]) => {
            //    atom.project.setPaths(directories);
            //    this.selectPath();
            //});
            atom.notifications.addWarning("You must have a folder open!");
        } else if (directories.length > 1) {
            // select from list
            var dirs = directories.map(z => ({
                displayName: path.basename(path.dirname(z)),
                name: z
            }));
            var view = new GeneratorView(dirs, (result) => {
                this.path = result;
                this.loadEnvironment();
            });
            view.message.text('Select Project');
            view.toggle();
        } else {
            // assume
            this.path = directories[0];
            this.loadEnvironment().then((generators) => this.selectGenerator(generators));
        }
    }

    private selectGenerator(generators: { displayName: string; name: string; }[]) {
        var view = new GeneratorView(generators, (result) => this.run(result, this.path));
        view.message.text('Generator');
        view.toggle();
    }

    private loadEnvironment() {
        process.chdir(this.path);
        if (!this.env) {
            this.adapter = new AtomAdapter();
            this.env = Environment.createEnv(undefined, { cwd: this.path }, this.adapter);
            this.generators = this.getMetadata().then(metadata => {
                var generators = metadata
                    .map(z => ({
                    displayName: z.namespace.replace(":app", "").replace(/:/g, ' '),
                    name: z.namespace
                }));

                if (this.prefix) {
                    generators = generators.filter(z => _.startsWith(z.name, this.prefix));
                }

                return generators;
            });
        }

        return this.generators;
    }

    public run(generator: string, path: string) {
        loophole.allowUnsafeNewFunction(() => {
            process.chdir(path);
            var result = this.env.run(generator, { cwd: path }, () => {
                process.chdir(this.startPath);
                // TODO: Find out what directory was created and open a newinstance there.
                //if (_.endsWith(generator, ":app")) {
                //    atom.open({ pathsToOpen: [path.join(this.path, this.adapter.answers['name'])] });
                //}
            });
        });
    }

    private getPackagePath(resolved: string) {
        var pieces = resolved.split(path.sep);
        var results = [];

        while (pieces.length) {
            if (pieces[0] === "node_modules") {
                results.push(pieces.shift(), pieces.shift());
                results.push('package.json');
                pieces = [];
            } else {
                results.push(pieces.shift());
            }
        }

        return results.join(path.sep);
    }

    private getMetadata() {
        var result = new Promise((resolver) => {
            this.env.lookup(resolver);
        })
            .then(() => this.env.getGeneratorsMeta())
            .then((metadata) => _.map(metadata, (item: { namespace: string; resolved: string; }) => {
            return {
                namespace: item.namespace,
                resolved: item.resolved,
                package: this.getPackagePath(item.resolved)
            };
        }));
        return result;
    }
}

export = Generator;
