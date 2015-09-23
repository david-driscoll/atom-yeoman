import _ = require('./lodash');
var Generator;

class GeneratorService {
    public start(prefix?: string, cwd?: string, options?: { promptOnZeroDirectories?: boolean }) {
        if (!Generator) Generator = require('./generator');
        return new Promise((resolve) => {
            _.defer(() => new Generator(prefix, cwd, options).start().then(resolve));
        });
    }

    public run(generator: string, cwd?: string, options?: { promptOnZeroDirectories?: boolean }) {
        if (!Generator) Generator = require('./generator');
        return new Promise<IMessages>((resolve) => {
            _.defer(() => new Generator(undefined, undefined, options).run(generator, cwd).then(resolve));
        });
    }

    public list(prefix: string, cwd?: string, options?: { promptOnZeroDirectories?: boolean }) {
        if (!Generator) Generator = require('./generator');

        return new Promise<IMessages>(resolve => {
            _.defer(() => new Generator(prefix, cwd, options).listGenerators(cwd).then(resolve));
        });
    }
}

export = GeneratorService;
