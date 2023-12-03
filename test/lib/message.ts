'use strict';

import Message, {MessageWriteOptionsLine} from '../../src/lib/message.js';
import type {BoardCharArray} from 'vestaboard-api/lib/cjs/values.js';
import * as assert from 'assert';

describe('Message', function () {
    describe('write()', function () {
        it('should start writing from top/left', function () {
            const msg = new Message();
            msg.write('Hello World');

            assert.strictEqual(msg.toString(),
                '#==============================================#\n' +
                '# H E L L O   W O R L D                        #\n' +
                '#                                              #\n' +
                '#                                              #\n' +
                '#                                              #\n' +
                '#                                              #\n' +
                '#                                              #\n' +
                '#==============================================#\n'
            );
        });
        it('should accept line & row for positioning', function () {
            const msg = new Message();
            msg.write('Hello World', {
                line: 2,
                row: 5
            });

            assert.strictEqual(msg.toString(),
                '#==============================================#\n' +
                '#                                              #\n' +
                '#                                              #\n' +
                '#           H E L L O   W O R L D              #\n' +
                '#                                              #\n' +
                '#                                              #\n' +
                '#                                              #\n' +
                '#==============================================#\n'
            );
        });
        it('should add another line if text is too long', function () {
            const msg = new Message();
            msg.write(
                'Lorem ipsum dolor sit amet, ' +
                'consetetur sadipscing elitr, sed ' +
                'diam nonumy eirmod tempor invidunt'
            );

            assert.strictEqual(msg.toString(),
                '#==============================================#\n' +
                '# L O R E M   I P S U M   D O L O R   S I T    #\n' +
                '# A M E T ,   C O N S E T E T U R              #\n' +
                '# S A D I P S C I N G   E L I T R ,   S E D    #\n' +
                '# D I A M   N O N U M Y   E I R M O D          #\n' +
                '# T E M P O R   I N V I D U N T                #\n' +
                '#                                              #\n' +
                '#==============================================#\n'
            );
        });
        it('should work with words > board length', function () {
            const msg = new Message();
            msg.write('Lorem-ipsum-dolor-sit-amet');

            assert.strictEqual(msg.toString(),
                '#==============================================#\n' +
                '# L O R E M - I P S U M - D O L O R - S I T -  #\n' +
                '#                                              #\n' +
                '#                                              #\n' +
                '#                                              #\n' +
                '#                                              #\n' +
                '#                                              #\n' +
                '#==============================================#\n'
            );
        });
        it('should allow to use CURRENT and NEXT line flags', function () {
            const msg = new Message();
            msg.write('13:00', {line: MessageWriteOptionsLine.CURRENT});
            msg.write('Daily', {line: MessageWriteOptionsLine.CURRENT, row: 6});

            msg.write('', {line: MessageWriteOptionsLine.NEXT});

            msg.write('18:00', {line: MessageWriteOptionsLine.NEXT});
            msg.write('Fischstäbchen, Spinat & Ei', {line: MessageWriteOptionsLine.CURRENT, row: 6});

            msg.write('', {line: MessageWriteOptionsLine.NEXT});

            msg.write('20:00', {line: MessageWriteOptionsLine.NEXT});
            msg.write('Sandmännchen', {line: MessageWriteOptionsLine.CURRENT, row: 6});

            assert.strictEqual(msg.toString(),
                '#==============================================#\n' +
                '# 1 3 : 0 0   D A I L Y                        #\n' +
                '#                                              #\n' +
                '# 1 8 : 0 0   F I S C H S T A E B C H E N ,    #\n' +
                '#             S P I N A T   &   E I            #\n' +
                '#                                              #\n' +
                '# 2 0 : 0 0   S A N D M A E N N C H E N        #\n' +
                '#==============================================#\n'
            );
        });
        it('should remove unsupported words', function () {
            const msg = new Message();
            msg.write('💪🏼 Gym');

            assert.strictEqual(msg.toString(),
                '#==============================================#\n' +
                '# G Y M                                        #\n' +
                '#                                              #\n' +
                '#                                              #\n' +
                '#                                              #\n' +
                '#                                              #\n' +
                '#                                              #\n' +
                '#==============================================#\n'
            );
        });
    });
    describe('repeat()', function () {
        it('should work', function () {
            const msg = new Message();
            msg.repeat('🟧', {line: 2});

            assert.strictEqual(msg.toString(),
                '#==============================================#\n' +
                '#                                              #\n' +
                '#                                              #\n' +
                '# 🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧 #\n' +
                '#                                              #\n' +
                '#                                              #\n' +
                '#                                              #\n' +
                '#==============================================#\n'
            );
        });
    });
    describe('word2char()', function () {
        it('should work', function () {
            assert.deepStrictEqual(Message.word2chars('Hello'), [8, 5, 12, 12, 15]);
        });
        it('should handle german Umlaute', function () {
            assert.deepStrictEqual(Message.word2chars('Käse'), [11, 1, 5, 19, 5]);
        });
        it('should handle color emojis', function () {
            assert.deepStrictEqual(Message.word2chars('🟥🟧🟨🟩🟦🟪⬜⬛'), [63, 64, 65, 66, 67, 68, 69, 0]);
        });
        it('should remove special chars', function () {
            assert.deepStrictEqual(Message.word2chars('Héllo'), [8, 60, 12, 12, 15]);
        });
    });
    describe('centerLines()', function () {
        it('should work', function () {
            const msg = new Message();
            msg.write('Hello World');
            msg.write('This is a test.', {line: MessageWriteOptionsLine.NEXT});
            msg.centerLines();

            assert.strictEqual(msg.toString(),
                '#==============================================#\n' +
                '#           H E L L O   W O R L D              #\n' +
                '#       T H I S   I S   A   T E S T .          #\n' +
                '#                                              #\n' +
                '#                                              #\n' +
                '#                                              #\n' +
                '#                                              #\n' +
                '#==============================================#\n'
            );
        });
    });
    describe('center()', function () {
        it('should work', function () {
            const msg = new Message();
            msg.write('Hello World');
            msg.write('This is a test.', {line: MessageWriteOptionsLine.NEXT});
            msg.center();

            assert.strictEqual(msg.toString(),
                '#==============================================#\n' +
                '#                                              #\n' +
                '#                                              #\n' +
                '#       H E L L O   W O R L D                  #\n' +
                '#       T H I S   I S   A   T E S T .          #\n' +
                '#                                              #\n' +
                '#                                              #\n' +
                '#==============================================#\n'
            );
        });
    });
    describe('isEmpty()', function () {
        it('should work', function () {
            const msg = new Message();
            assert.strictEqual(msg.isEmpty(), true);

            msg.write('Hi');
            assert.strictEqual(msg.isEmpty(), false);
        });
    });
    describe('toString()', function () {
        it('should work with empty board', function () {
            const result = new Message().toString();
            const expected = `#==============================================#
#                                              #
#                                              #
#                                              #
#                                              #
#                                              #
#                                              #
#==============================================#
`;
            assert.strictEqual(result, expected);
        });
        it('should work with any supported char', function () {
            const board: BoardCharArray = [
                [
                    0,
                    1,
                    2,
                    3,
                    4,
                    5,
                    6,
                    7,
                    8,
                    9,
                    10,
                    11,
                    12,
                    13,
                    14,
                    15,
                    16,
                    17,
                    18,
                    19,
                    20,
                    21
                ],
                [
                    22,
                    23,
                    24,
                    25,
                    26,
                    27,
                    28,
                    29,
                    30,
                    31,
                    32,
                    33,
                    34,
                    35,
                    36,
                    37,
                    38,
                    39,
                    40,
                    41,
                    42,
                    44
                ],
                [
                    46,
                    47,
                    48,
                    49,
                    50,
                    52,
                    53,
                    54,
                    55,
                    56,
                    59,
                    60,
                    62,
                    63,
                    64,
                    65,
                    66,
                    67,
                    68,
                    69,
                    70,
                    0
                ],
                [
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0
                ],
                [
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0
                ],
                [
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0
                ]
            ];

            const result = new Message(board).toString();
            const expected = `#==============================================#
#   A B C D E F G H I J K L M N O P Q R S T U  #
# V W X Y Z 1 2 3 4 5 6 7 8 9 0 ! @ # $ ( ) -  #
# + & = ; : ' " % , . / ? ° 🟥🟧🟨🟩🟦🟪⬜️     #
#                                              #
#                                              #
#                                              #
#==============================================#
`;
            assert.strictEqual(result, expected);
        });
    });
});
