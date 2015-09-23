import ListView = require('./prompts/list-view');
import TextViews = require('./prompts/text-view');
import CheckboxView = require("./prompts/checkbox-view");
import _ = require('./lodash');
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
        if (currentQuestion.type === "list" || currentQuestion.type === "rawlist" || currentQuestion.type === "expand") {
            // TODO: Make a real controls for both raw list and expand? Is it needed?
            new ListView(<Prompt.List>currentQuestion, (answer) => this.saveAnswer(currentQuestion.name, answer)).show();
        } else if (currentQuestion.type === "checkbox") { // Text
            new CheckboxView(<Prompt.Checkbox>currentQuestion, (answer) => this.saveAnswer(currentQuestion.name, answer)).show();
        } else if (currentQuestion.type === "confirm") { // Text
            new TextViews.ConfirmView(<Prompt.Text>currentQuestion, (answer) => this.saveAnswer(currentQuestion.name, _.trim(answer) || '')).show();
        } else if (_.isUndefined(currentQuestion.type) || currentQuestion.type === "input") { // Text
            new TextViews.TextView(<Prompt.Text>currentQuestion, (answer) => this.saveAnswer(currentQuestion.name, answer)).show();
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

    public messages: IMessages = this.log.messages;
}

export = AtomAdapter;
