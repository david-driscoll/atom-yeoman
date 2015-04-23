declare module Prompt {
    interface Base {
        name: string;
        type: string;
        message: string;
    }

    interface List extends Base {
        default: string[];
        //filter: any;
        choices: { name: string; value: string; checked?: boolean; disabled?: boolean }[];
    }

    interface Checkbox extends List {
        //validate: (value: any) => boolean;
    }

    interface Text extends Base {
        //filter: any;
        //validate: (value: any) => boolean;
        default: string;
    }

    interface Confirm extends Base {
        //filter: any;
        //validate: (value: any) => boolean;
        default: boolean;
    }
}

interface JQuery {
    isOnDom() : boolean;
}
