import _ = require('./lodash');
var Generator;

class GeneratorService {
    public start(prefix?: string, cwd?: string, options?: { promptOnZeroDirectories?: boolean }) {
        if (!Generator) Generator = require('./generator');
        _.defer(() => new Generator(prefix, cwd, options).start());
    }

    public run(generator: string, cwd?: string, options?: { promptOnZeroDirectories?: boolean }) {
        if (!Generator) Generator = require('./generator');
        _.defer(() => new Generator(undefined, undefined, options).run(generator, cwd));
    }
}

export = GeneratorService;
