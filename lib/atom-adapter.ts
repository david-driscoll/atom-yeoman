import ListView = require('./prompts/list-view');
import TextView = require('./prompts/text-view');
import _ = require('lodash');
var logger = require('./logger')

class AtomAdapter {
    private questions: Prompt.Base[];
    private callback: (answers: any) => void;
    public answers: { [key: string]: string; } = {};

    public prompt(questions: Prompt.Base[], callback: (answers: any) => void) {
        //this.answers = {};
        this.questions = questions.concat();
        this.callback = callback;

        console.log(questions);
        this.runNextQuestion();
    }

    public runNextQuestion() {
        if (!this.questions.length) {
            return this.callback(this.answers);
        }
        var currentQuestion = this.questions.shift();
        if (currentQuestion.type === "list") {
            new ListView(<Prompt.List>currentQuestion, (answer) => this.saveAnswer(currentQuestion.name, answer)).show();
        } else if (_.isUndefined(currentQuestion.type)) { // Text
            new TextView(<Prompt.Text>currentQuestion, (answer) => this.saveAnswer(currentQuestion.name, answer)).show();
        } else {
            throw new Error(currentQuestion.type + ' not supported yet.');
        }
    }

    public saveAnswer(name: string, answer: string) {
        this.answers[name] = answer;
        this.runNextQuestion();
    }

    public diff(actual, expected) {
        throw new Error('need to add diff support');
    }

    public log = logger();
}

export = AtomAdapter;
