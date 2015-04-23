declare module Prompt {
    interface Base {
        name: string;
        type: string;
        message: string;
    }

    interface List extends Base {
        choices: { name: string; value: string; }[];
    }

    interface Text extends Base {
        default: string;
    }
}
