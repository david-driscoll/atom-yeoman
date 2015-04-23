import Generator = require('./generator');

class GeneratorService {
    public start(prefix: string, path?: string) {
        var genny = new Generator(prefix, path);

        genny.start();
    }

    public run(generator: string, path?: string) {
        var genny = new Generator();

        genny.run(generator, path);
    }
}

export = GeneratorService;
