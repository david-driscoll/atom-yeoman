import _ = require('./lodash');
var Generator;

class GeneratorService {
    public start(prefix?: string, cwd?: string) {
        if (!Generator) Generator = require('./generator');
        _.defer(() => new Generator(prefix, cwd).start());
    }

    public run(generator: string, cwd?: string) {
        if (!Generator) Generator = require('./generator');
        _.defer(() => new Generator().run(generator, cwd));
    }
}

export = GeneratorService;
