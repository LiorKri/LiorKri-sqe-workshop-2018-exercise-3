import assert from 'assert';
import {parseCode} from '../src/js/code-analyzer';

describe('The javascript parser', () => {
    it('testE2E', () => {
        assert.equal(
            parseCode('function foo(x, y, z){\n' +
                '    let a = x + 1;\n' +
                '    let b = a + y;\n' +
                '    let c = 0;\n' +
                '    if (b < z) {\n' +
                '        c = c + 5;\n' +
                '        return x + y + z + c;\n' +
                '    } else if (b < z * 2) {\n' +
                '        c = c + x + 5;\n' +
                '        return x + y + z + c;\n' +
                '    } else {\n' +
                '        c = c + z + 5;\n' +
                '        return x + y + z + c;\n' +
                '    }\n' +
                '}','(x=1, y=2, z=3)'),
            'function foo(x, y, z) {\n' +
            '<markRed>    if (x + 1 + y < z) {</markRed>\n' +
            '        return x + y + z + 0 + 5;\n' +
            '<markGreen>    } else if (x + 1 + y < z * 2) {</markGreen>\n' +
            '        return x + y + z + 0 + x + 5;\n' +
            '    } else {\n' +
            '        return x + y + z + 0 + z + 5;\n' +
            '    }\n' +
            '}'
        );
    });

    it('testAlternateIf1', () => {
        assert.equal(
            parseCode('function f(x, y, z){\n' +
                ' let a = 1;\n' +
                ' let b = a + y; \n' +
                ' x = y;\n' +
                ' if(x > 1){\n' +
                '  a = x + 1;}\n' +
                ' else{\n' +
                '  a = y + 1;}\n' +
                ' return a;\n' +
                '}','(x=1, y=2, z=1)'),
            'function f(x, y) {\n' +
            '    x = y;\n' +
            '<markGreen>    if (x > 1) {</markGreen>\n' +
            '    } else {\n' +
            '    }\n' +
            '    return x + 1;\n' +
            '}'
        );
    });

     it('testAlternateIf2', () => {
            assert.equal(
                parseCode('function foo(x, y, z){\n' +
                    ' let a = y + 1;\n' +
                    ' if(x != y){\n' +
                    '  if(y == z){\n' +
                    '   a = z + 1;\n' +
                    '  }\n' +
                    '  else if(y == x + 1){\n' +
                    '   a = 1;\n' +
                    '  }\n' +
                    ' }\n' +
                    ' else{\n' +
                    '  a = 2;\n' +
                    ' }\n' +
                    '    return z + a;\n' +
                    '}','(x=1, y=2, z=3)'),
                'function foo(x, y, z) {\n' +
                '<markGreen>    if (x != y) {</markGreen>\n' +
                '<markRed>        if (y == z) {</markRed>\n' +
                '<markGreen>        } else if (y == x + 1) {</markGreen>\n' +
                '        }\n' +
                '    } else {\n' +
                '    }\n' +
                '    return z + 2;\n' +
                '}'
            );
        });

    it('testWhile1', () => {
        assert.equal(
            parseCode('function foo(x, y, z){\n' +
                '    let a = x + 1;\n' +
                '    let b = a + y;\n' +
                '    let c = 0;\n' +
                '    \n' +
                '    while (a < z) {\n' +
                '        c = a + b;\n' +
                '        z = c * 2;\n' +
                '    }\n' +
                '    \n' +
                '    return z;\n' +
                '}\n','(x=1, y=2, z=3)'),
            'function foo(x, y, z) {\n' +
            '    while (x + 1 < z) {\n' +
            '        z = (x + 1 + x + 1 + y) * 2;\n' +
            '    }\n' +
            '    return z;\n' +
            '}'
        );
    });

    it('testWhile2', () => {
        assert.equal(
            parseCode('function foo(x, y, z){\n' +
                '    let a = x + 1;\n' +
                '    let b = a + y;\n' +
                '    let c = 0;\n' +
                '    \n' +
                '    while (a < z) {\n' +
                '        c = a + b;\n' +
                '        z = 5 * c;\n' +
                '    }\n' +
                '    \n' +
                '    return z;\n' +
                '}','(x=1, y=2, z=3)'),
            'function foo(x, y, z) {\n' +
            '    while (x + 1 < z) {\n' +
            '        z = 5 * (x + 1 + x + 1 + y);\n' +
            '    }\n' +
            '    return z;\n' +
            '}'
        );
    });
    it('testWhile3', () => {
        assert.equal(
            parseCode('function foo(x, y, z){\n' +
                '    let a = x + 1;\n' +
                '    let b = a + y;\n' +
                '    let c = 0;\n' +
                '    \n' +
                '    while (a < z) {\n' +
                '        c = a + b;\n' +
                '        z = c + c;\n' +
                '    }\n' +
                '    \n' +
                '    return z;\n' +
                '}','(x=1, y=2, z=3)'),
            'function foo(x, y, z) {\n' +
            '    while (x + 1 < z) {\n' +
            '        z = (x + 1 + x + 1 + y) + (x + 1 + x + 1 + y);\n' +
            '    }\n' +
            '    return z;\n' +
            '}'
        );
    });
    it('testFuncDec1', () => {
        assert.equal(
            parseCode('let a = 1;\n' +
                'function f(x){\n' +
                ' let a = 1;\n' +
                '  \n' +
                ' if(true){\n' +
                '  a = 5;\n' +
                ' }\n' +
                ' else{\n' +
                '  a = 2;\n' +
                ' }\n' +
                'return x + a;\n' +
                '}','(x=1, y=2)'),
            'function f(x) {\n' +
            '<markGreen>    if (true) {</markGreen>\n' +
            '    } else {\n' +
            '    }\n' +
            '    return x + 5;\n' +
            '}'
        );
    });
    it('testFuncDec2', () => {
        assert.equal(
            parseCode('let a = 1;\n' +
                'function f(x){\n' +
                ' let a ;\n' +
                ' let d = x - 1;\n' +
                ' let arr = [1, 2, 3];\n'+
                '  \n' +
                ' if(x[0] === 1){\n' +
                '  a = 2;\n' +
                ' }\n' +
                ' else{\n' +
                '  a = 4;\n' +
                ' }\n' +
                'return a;\n' +
                '}','(x=[1])'),
            'function f(x) {\n' +
            '<markGreen>    if (x[0] === 1) {</markGreen>\n' +
            '    } else {\n' +
            '    }\n' +
            '    return 2;\n' +
            '}'
        );
    });
    it('testArr1', () => {
        assert.equal(
            parseCode('function foo(z){ \n' +
                '  let a = 1;\n' +
                '  let b = z[0] - 1;\n' +
                '  let arr = [1,2,3];\n' +
                '  let c = 2 * a + 4;\n' +
                '  z[1] = 2;\n' +
                '  if (a == b){\n' +
                '     a = b;\n' +
                '     return b;\n' +
                '  }\n' +
                '  return a / -5;\n' +
                '}','(z=[1,2,3])'),
            'function foo(z) {\n' +
            '    z[1] = 2;\n' +
            '<markRed>    if (1 == 0) {</markRed>\n' +
            '        return 0;\n' +
            '    }\n' +
            '    return 1 / -5;\n' +
            '}'
        );
    });
    it('testArr2', () => {
        assert.equal(
            parseCode('function foo(z){ \n' +
                '  let a = 1;\n' +
                '  let b = z[2] - 2;\n' +
                '  let arr = [1,2,3];\n' +
                '  let c = 4 + 2 * a;\n' +
                '  z[1] = 2;\n' +
                '  if (a == b){\n' +
                '     a = b * 2;\n' +
                '     return b;\n' +
                '  }\n' +
                '  else if(a == b + 1){\n' +
                '    a = b;\n' +
                '  }\n' +
                '  return a;\n' +
                '}','(z=[1,2,3])'),
            'function foo(z) {\n' +
            '    z[1] = 2;\n' +
            '<markGreen>    if (1 == 1) {</markGreen>\n' +
            '        return 1;\n' +
            '<markRed>    } else if (1 == -1) {</markRed>\n' +
            '    }\n' +
            '    return 2;\n' +
            '}'
        );
    });
    it('testNoArgs', () => {
        assert.equal(
            parseCode('function foo(){ \n' +
                '    let a = 2;\n' +
                '    let b = 1;\n' +
                '    let c = 0;\n' +
                '    if (b < a) {\n' +
                '        c = c + 5;\n' +
                '        return a + c;\n' +
                '    } else if (b < a * 2) {\n' +
                '        c = c + 5;\n' +
                '        return b + c;}\n' +
                '    }\n' +
                '}',''),
            'function foo() {\n' +
            '<markGreen>    if (1 < 2) {</markGreen>\n' +
            '        return 2 + 5;\n' +
            '<markRed>    } else if (1 < 2 * 2) {</markRed>\n' +
            '        return 1 + 5;}\n' +
            '    }\n' +
            '}'
        );
    });

});