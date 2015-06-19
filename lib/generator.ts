import _ = require('./lodash');
import {join, relative, extname, dirname, sep} from 'path';
import fs = require('fs');
var loophole = require("loophole");
// Loophole the loophole...
loophole.Function.prototype = Function.prototype;
var Environment = (function() {
    var referencingPackages: Atom.Package[];
    loophole.allowUnsafeNewFunction(() => {
        var template = require('lodash/string/template');
        var path = require('path');

        referencingPackages = _(atom.packages.getLoadedPackages())
            .filter(package => {
                var providedServices = package.metadata && package.metadata.providedServices;
                if (providedServices && !!providedServices['yeoman-environment']) {
                    return true;
                }

                var consumedServices = package.metadata && package.metadata.consumedServices;
                if (consumedServices && !!consumedServices['yeoman-environment']) {
                    return true;
                }
            })
            .value();

        var paths = _(referencingPackages)
            .map(package => {
                var packagePath = package.path;
                var lstat = fs.lstatSync(packagePath);
                if (lstat && lstat.isSymbolicLink()) {
                    packagePath = fs.readlinkSync(packagePath);
                }

                return [
                    join(packagePath, 'node_modules/lodash/index.js'),
                    join(packagePath, 'node_modules/dist/lodash.js')
                ];
            })
            .flatten<string>()
            .value();

        paths = _(require.cache).keys().filter(z => _.contains(z, "babel-core") && _.contains(z, 'lodash')).value().concat(paths);

        // Dirty hack
        // Replace any references to lodash (in referencing packages only)
        // without safe lodash version.
        _.each(paths, path => {
            var m = require.cache[path];
            if (require.cache[path]) {
                m.exports.template = template;
                //m.exports = _;
            }
        });
    });

    var res;
    loophole.allowUnsafeNewFunction(() => {
        res = require('yeoman-environment');
        require('yeoman-generator');
    });

    var defaultGetNpmPaths = res.prototype.getNpmPaths;
    var defaultCreate = res.prototype.create;

    res.prototype.getNpmPaths = function() {
        // we're in atom... which is not node... if installed locally.
        var paths: any[] = defaultGetNpmPaths.apply(this, arguments);
        // drop the atom path
        paths.pop();

        _.each(getAllConsumingPackages(), x => paths.push(x));
        // add the default path for the user.
        if (process.platform === 'win32') {
            paths.push(join(process.env.APPDATA, 'npm/node_modules'));
        } else {
            paths.push('/usr/lib/node_modules');
            paths.push('/usr/local/lib/node_modules');
        }

        return paths;
    };

    res.prototype.create = function() {
        var result, args = arguments;
        var options = arguments[1];
        if (options) {
            if (options.options && !options.options.cwd) {
                options.options.cwd = this.cwd;
            } else if (!options.options && !options.cwd) {
                options.cwd = this.cwd;
            }
        }
        loophole.allowUnsafeNewFunction(() => result = defaultCreate.apply(this, args));
        return result;
    };

    function getAllConsumingPackages() {
        return referencingPackages.map(z => join(z.path, 'node_modules'));
    }

    return res;
})();

import AtomAdapter = require("./atom-adapter");
import Promise = require("bluebird");
import EventKit = require("event-kit");
import GeneratorView = require("./generator-view");
import TextViews = require("./prompts/text-view");

interface IOptions { promptOnZeroDirectories?: boolean }

class Generator {
    private _metadata: { [key: string]: { namespace: string; resolved: string; displayName: string; }; };
    private env: any;
    private startPath = process.cwd();
    private adapter: AtomAdapter;
    public generators: Promise<{ displayName: string; name: string; resolved: string; }[]>;

    public loaded = false;

    // Allow to limit the generator to a specific subset.
    // aspnet:, jquery:, etc.
    constructor(private prefix?: string, private path?: string, private options: IOptions = {}) {

    }

    public start() {
        this.selectPath();
    }

    private static getPath(p: string, options: IOptions) {
        return new Promise<string>((resolve, reject) => {
            if (p) return resolve(<any>p);


            var directories = [];
            var selectedTreeViewDirectory = this.getTreeViewDirectory();
            if (selectedTreeViewDirectory)
                directories.push(selectedTreeViewDirectory);

            var projectPaths = atom.project.getDirectories().map(z => z.getPath());
            directories = _.unique(directories.concat(projectPaths));

            if (directories.length === 0) {
                if (options.promptOnZeroDirectories) {
                    atom.pickFolder((directories: string[]) => {
                        atom.project.setPaths(directories);
                        resolve(<any>directories[0]);
                    });
                } else {
                    atom.notifications.addWarning("You must have a folder open!");
                    reject("You must have a folder open!");
                }
            } else if (directories.length > 1) {

                function getRelativePath(path) {
                    var basePath = _.find(projectPaths, projectPath => _.startsWith(path, projectPath));
                    return relative(dirname(basePath), path);
                }

                // select from list
                var dirs = directories.map(z => ({
                    displayName: getRelativePath(z),
                    name: z
                }));
                var view = new GeneratorView(dirs, (result: string) => {
                    resolve(<any>result);
                });
                view.message.text('Select Directory');
                view.toggle();
            } else {
                // assume
                resolve(<any>directories[0]);
            }
        });
    }

    private static getTreeViewDirectory() {
        var treeView = this.getTreeView();
        if (treeView === null || !treeView.length) return;

        if (extname(treeView[0].item.selectedPath) !== "")
            return dirname(treeView[0].item.selectedPath);

        return treeView[0].item.selectedPath;
    }

    // Holy hell this is hacky. Is there a better way to get the TreeView?
    private static getTreeView() {
        var panels = atom.workspace.getTopPanels().concat(atom.workspace.getLeftPanels()).concat(atom.workspace.getBottomPanels()).concat(atom.workspace.getRightPanels());

        return panels.filter(function(d) {
            return d.item.selectedPath;
        });
    }

    private selectPath() {
        Generator.getPath(this.path, this.options).then((path) => this.loadEnvironment(path)).then((generators) => this.selectGenerator(generators));
    }

    private selectGenerator(generators: { displayName: string; name: string; }[]) {
        var view = new GeneratorView(generators, (result) => this.run(result, this.path));
        view.message.text('Generator');
        view.toggle();
    }

    private loadEnvironment(path: string) {
        if (!this.env) {
            process.chdir(path);
            this.path = path;
            this.adapter = new AtomAdapter();
            this.env = Environment.createEnv(undefined, { cwd: path }, this.adapter);
            this.generators = this.getMetadata().then(metadata => {
                var generators = metadata
                    .map(z => ({
                        displayName: z.namespace.replace(":app", "").replace(/:/g, ' '),
                        name: z.namespace,
                        resolved: z.resolved
                    }));

                if (this.prefix) {
                    generators = generators.filter(z => _.startsWith(z.name, this.prefix));
                }

                return generators;
            });
        }

        return this.generators;
    }

    public run(generator: string, path?: string) {
        if (!path) {
            Generator.getPath(this.path, this.options)
                .then(p => this.run(generator, p));
            return;
        }

        this.loadEnvironment(path).then((generators) => {
            loophole.allowUnsafeNewFunction(() => {
                process.chdir(path);
                try {
                    this.runGenerator(generator, path);
                } catch (error) {
                    // Tried to do class detection... that was unreliable across all use cases.
                    // this isn't the best, but it works.
                    if (error.message === "Did not provide required argument name!") {
                        var def = _.last(generator.split(':'))
                        var view = new TextViews.TextView({
                            name: 'name',
                            type: undefined,
                            message: def + " name?",
                            default: def
                        }, (value) => {
                            this.runGenerator(generator + ' ' + value, path);
                        });
                        view.show();
                    }
                }
            });
        })
    }

    private runGenerator(args: string, path: string) {
        loophole.allowUnsafeNewFunction(() => {
            var genny = this.env.run(args, { cwd: path }, () => {
                process.chdir(this.startPath);
                // TODO: Find out what directory was created and open a newinstance there.
                //if (_.endsWith(generator, ":app")) {
                //    atom.open({ pathsToOpen: [join(this.path, this.adapter.answers['name'])] });
                //}
            });
        });
    }

    private getPackagePath(resolved: string) {
        var pieces = resolved.split(sep);
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

        return results.join(sep);
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
