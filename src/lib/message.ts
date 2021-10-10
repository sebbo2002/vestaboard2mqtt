import {BoardCharArray, characterCode, emptyBoard, LINE_LENGTH} from 'vestaboard-api/lib/cjs/values';

export enum MessageWriteOptionsLine {
    CURRENT = 'CURRENT',
    NEXT = 'NEXT'
}

export interface MessageWriteOptions {
    line?: number | MessageWriteOptionsLine;
    row?: number;
}

export interface MessageDrawOptions {
    line?: number;
}


const SPECIAL_CHAR_MAP = [
    ['ä', [1, 5]],
    ['Ä', [1, 5]],
    ['ö', [15, 5]],
    ['Ö', [15, 5]],
    ['ü', [21, 5]],
    ['Ü', [21, 5]],
    ['ß', [19, 19]],
    ['🟥', [63]],
    ['🟧', [64]],
    ['🟨', [65]],
    ['🟩', [66]],
    ['🟦', [67]],
    ['🟪', [68]],
    ['⬜️', [69]],
    ['⬜', [69]],
    ['⬛️', [0]],
    ['⬛', [0]]
];


export default class Message {
    private board: BoardCharArray;
    private currentLine: number | null = null;
    private isFilled = false;

    constructor(board: BoardCharArray = Message.newBoardCharArray()) {
        this.board = board;
    }

    static newBoardCharArray(): BoardCharArray {
        return JSON.parse(JSON.stringify(emptyBoard));
    }

    write(text: string, options: MessageWriteOptions = {}) : void{
        let firstLine = 0;
        if(this.isFilled) {
            return;
        }

        if(options.line === MessageWriteOptionsLine.CURRENT) {
            firstLine = this.currentLine || 0;
        }
        else if(options.line === MessageWriteOptionsLine.NEXT && this.currentLine === null) {
            this.currentLine = 0;
            firstLine = this.currentLine;
        }
        else if(
            options.line === MessageWriteOptionsLine.NEXT &&
            typeof this.currentLine === 'number' &&
            this.currentLine < this.board.length - 1
        ) {
            // console.log('write() → current line + 1');
            this.currentLine++;
            firstLine = this.currentLine;
        }
        else if(options.line === MessageWriteOptionsLine.NEXT) {
            this.isFilled = true;
            return;
        }
        else if(options.line !== undefined) {
            firstLine = options.line;
        }

        const status = {
            firstLine,
            lastLine: this.board.length - 1,
            firstRow: options.row || 0,
            lastRow: LINE_LENGTH - 1
        };
        const pointer = [status.firstRow, status.firstLine];

        const words = text.split(/\s+/);
        words.forEach((word, i) => {

            // Space
            if(i !== 0 && pointer[0] !== status.firstRow) {
                this.board[pointer[1]][pointer[0]] = 0;
                pointer[0]++;
            }

            let charsLeftInLine = status.lastRow - pointer[0] + 1;
            const chars = Message.word2chars(word);
            // console.log(
            //     'write()',
            //     'chars =', chars,
            //     'left =', charsLeftInLine,
            //     `(${status.lastRow} - ${pointer[0]})`,
            //     'pointer =', pointer,
            //     'charsLeftInLine =', charsLeftInLine
            // );

            // Unsupported Word / emoji?
            if(chars.filter(c => c === 60).length === chars.length && chars.length > 0) {
                return;
            }

            // New Line?
            if(
                chars.length > charsLeftInLine &&
                chars.length <= status.lastRow - status.firstRow + 1 &&
                pointer[1] < status.lastLine
            ) {
                pointer[0] = status.firstRow;
                pointer[1]++;
                charsLeftInLine = status.lastRow - pointer[0];
                // console.log('write() → new line', 'chars =', chars, 'left =', charsLeftInLine, `(${status.lastRow} - ${pointer[0]})`, 'pointer =', pointer);
            }

            // Add Word
            if(chars.length <= charsLeftInLine) {
                this.board[pointer[1]].splice(pointer[0], chars.length, ...chars);
                pointer[0] += chars.length;
            }
            else if(chars.length > charsLeftInLine && charsLeftInLine > 5) {
                this.board[pointer[1]].splice(pointer[0], charsLeftInLine, ...chars.slice(0, charsLeftInLine));
                pointer[0] += charsLeftInLine;
            }
        });
        this.currentLine = pointer[1];
    }

    static word2chars(word: string): number[] {
        const result: number[] = [];
        for(const char of word) {
            result.push(...this.char2char(char));
        }

        return result;
    }

    static char2char(char: string): number[] {
        const fromVestaMap = Object.entries(characterCode)
            .find(([key]) => char === key);
        if(fromVestaMap) {
            return [ fromVestaMap[1]] ;
        }

        const fromMyMap = SPECIAL_CHAR_MAP
            .find(([mapChar]) => char === mapChar);
        if(fromMyMap && Array.isArray(fromMyMap[1])) {
            return fromMyMap[1];
        }

        return [60];
    }

    repeat(char: string, options: MessageDrawOptions = {}): void {
        const line = this.board[options.line || 0];
        line.fill(Message.char2char(char)[0]);
    }

    centerLines(): void {
        this.board.forEach(line => {
            const space = [line.findIndex(c => c !== 0), line.slice().reverse().findIndex(c => c !== 0)];

            // Line is completely full, continue…
            if(space[0] === -1 || space[1] === -1) {
                return;
            }

            const content = line.slice(space[0], line.length - space[1]);
            const padding = Math.floor((space[0] + space[1]) / 2);

            line.fill(0, 0, padding);
            line.splice(padding, content.length, ...content);
            line.fill(0, padding + content.length);
        });
    }

    center(): void {
        const space = [
            this.board.findIndex(l => l.find(c => c !== 0)),
            Math.min(...this.board.map(l => l.find(c => c !== 0) ? l.slice().reverse().findIndex(c => c !== 0) : l.length)),
            this.board.slice().reverse().findIndex(l => l.find(c => c !== 0)),
            Math.min(...this.board.map(l => l.find(c => c !== 0) ? l.findIndex(c => c !== 0) : l.length)),
        ];

        const padding = [
            Math.floor((space[0] + space[2]) / 2),
            Math.floor((space[1] + space[3]) / 2)
        ];

        // Move up/down
        if(space[0] !== padding[0]) {
            const add = padding[0] - space[0];
            this.board.splice(space[0] < padding[0] ? 0 : this.board.length - add, 0,
                ...this.board.splice(this.board.length - add, add)
            );
        }

        // Move left/right
        if(space[3] !== padding[1]) {
            const add = padding[1] - space[3];

            this.board.forEach(line => {
                line.splice(space[3] < padding[1] ? 0 : line.length - add, 0,
                    ...line.splice(line.length - add, add)
                );
            });
        }
    }

    isEmpty (): boolean {
        return !this.board.find(line =>
            line.find(char => char !== 0)
        );
    }

    toString(): string {
        return '#=' + '='.repeat(LINE_LENGTH * 2) + '=#\n' +
            this.board
                .map(line => '# ' + line.map(char => Message.charToString(char)).join('') + ' #\n')
                .join('') +
            '#=' + '='.repeat(LINE_LENGTH * 2) + '=#\n';
    }

    static charToString(char: number): string {
        const entry = Object.entries(characterCode)
            .filter(([name]) => name.length <= 2)
            .find(([, code]) => code === char);

        if (entry) {
            return entry[0].toUpperCase() + ' ';
        }

        switch (char) {
        case 63:
            return '🟥';
        case 64:
            return '🟧';
        case 65:
            return '🟨';
        case 66:
            return '🟩';
        case 67:
            return '🟦';
        case 68:
            return '🟪';
        case 69:
            return '⬜️';
        default:
            return '  ';
        }
    }

    export(): BoardCharArray {
        return this.board;
    }
}
