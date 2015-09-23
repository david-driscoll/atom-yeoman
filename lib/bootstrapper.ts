import _ = require('./lodash');
var generatorService;
var atomYeoman;

class Bootstrapper {
    private emitter: EventKit.Emitter;
    private disposable: EventKit.CompositeDisposable;

    public activate(state) {
        if (!atomYeoman) atomYeoman = require('./atom-yeoman');
        atomYeoman.activate(state);
    }

    public generatorServiceV1() {
        if (!generatorService) generatorService = require("./generator-service");
        return new generatorService();
    }

    public deactivate() {
        atomYeoman.deactivate();
    }

    public config = {

    }
}

var instance = new Bootstrapper;
export = instance;
