import Generator = require('./generator');

class GeneratorService {
    public start(prefix?: string, cwd?: string) {
        var genny = new Generator(prefix, cwd);

        genny.start();
    }

    public run(generator: string, cwd?: string) {
        var genny = new Generator();

        genny.run(generator, cwd);
    }
}

export = GeneratorService;
