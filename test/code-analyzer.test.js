import assert from 'assert';
import {parseCode, removeDec, prepare_graph,create_shape } from '../src/js/code-analyzer';

describe('The javascript parser', () => {
    it('testRemoveDec', () => {
        assert.equal(
            removeDec('let a = 5;\n' +
                'function f(x , y, z){\n' +
                '   if(a === 4)\n' +
                '  {\n' +
                '    return 1;\n' +
                '  }else if(a === 5){ return 2;}\n' +
                '  else{ return 3;}\n' +
                '}'),
            'function f(x , y, z){' +
            ' if(a === 4)' +
            ' {' +
            ' return 1;' +
            ' }else if(a === 5){ return 2;}' +
            ' else{ return 3;}' +
            ' }'
        );
    });

    it('testParseCode1', () => {
        assert.equal(
            parseCode('function foo(x, y, z){\n' +
                '    let a = x + 1;\n' +
                '    let b = a + y;\n' +
                '    let c = 0;\n' +
                '    \n' +
                '    if (b < z) {\n' +
                '        c = c + 5;\n' +
                '    } else if (b < z * 2) {\n' +
                '        c = c + x + 5;\n' +
                '    } else {\n' +
                '        c = c + z + 5;\n' +
                '    }\n' +
                '    \n' +
                '    return c;\n' +
                '}\n', '(x=1, y=2, z=3)'),
            'n1 [label="-1-\n' +
            'let a = x + 1;", fillcolor = green, style = filled, shape = box]\n' +
            'n2 [label="-2-\n' +
            'let b = a + y;", fillcolor = green, style = filled, shape = box]\n' +
            'n3 [label="-3-\n' +
            'let c = 0;", fillcolor = green, style = filled, shape = box]\n' +
            'n4 [label="-4-\n' +
            'b < z", fillcolor = green, style = filled, shape = diamond]\n' +
            'n5 [label="-5-\n' +
            'c = c + 5", shape = box]\n' +
            'n6 [label="-6-\n' +
            'return c;", fillcolor = green, style = filled, shape = box]\n' +
            'n7 [label="-7-\n' +
            'b < z * 2", fillcolor = green, style = filled, shape = diamond]\n' +
            'n8 [label="-8-\n' +
            'c = c + x + 5", fillcolor = green, style = filled, shape = box]\n' +
            'n9 [label="-9-\n' +
            'c = c + z + 5", shape = box]n1 -> n2 []\n' +
            'n2 -> n3 []\n' +
            'n3 -> n4 []\n' +
            'n4 -> n5 [label="true"]\n' +
            'n4 -> n7 [label="false"]\n' +
            'n5 -> n6 []\n' +
            'n7 -> n8 [label="true"]\n' +
            'n7 -> n9 [label="false"]\n' +
            'n8 -> n6 []\n' +
            'n9 -> n6 []'
        );
    });

    it('testParseCode2', () => {
        assert.equal(
            parseCode('function foo(x, y){\n' +
                '  let a = x + 1;\n' +
                '  let b = a + y + 1;\n' +
                '  let c = 0;\n' +
                '\n' +
                '  while (a < x) {\n' +
                '    c = a + b;\n' +
                '    z = c * 2;\n' +
                '    a++;\n' +
                '  }\n' +
                '  return x;\n' +
                '}', '(x=1, y=2)'),
            'n1 [label="-1-\n' +
            'let a = x + 1;", fillcolor = green, style = filled, shape = box]\n' +
            'n2 [label="-2-\n' +
            'let b = a + y + 1;", fillcolor = green, style = filled, shape = box]\n' +
            'n3 [label="-3-\n' +
            'let c = 0;", fillcolor = green, style = filled, shape = box]\n' +
            'n4 [label="-4-\n' +
            'a < x", fillcolor = green, style = filled, shape = diamond]\n' +
            'n5 [label="-5-\n' +
            'c = a + b", shape = box]\n' +
            'n6 [label="-6-\n' +
            'z = c * 2", shape = box]\n' +
            'n7 [label="-7-\n' +
            'a++", shape = box]\n' +
            'n8 [label="-8-\n' +
            'return x;", fillcolor = green, style = filled, shape = box]n1 -> n2 []\n' +
            'n2 -> n3 []\n' +
            'n3 -> n4 []\n' +
            'n4 -> n5 [label="true"]\n' +
            'n4 -> n8 [label="false"]\n' +
            'n5 -> n6 []\n' +
            'n6 -> n7 []\n' +
            'n7 -> n4 []'
        );
    });

    it('testParseCode3', () => {
        assert.equal(
            parseCode('function foo(){\n' +
                '   let a = 1;\n' +
                '   let b = 2;\n' +
                '   let c = 3;\n' +
                '}', ''),
            'n1 [label="-1-\n' +
            'let a = 1;", shape = box]\n' +
            'n2 [label="-2-\n' +
            'let b = 2;", shape = box]\n' +
            'n3 [label="-3-\n' +
            'let c = 3;", shape = box]\n' +
            'n2 -> n3 []\n' +
        );
    });

    it('testParseCode4', () => {
        assert.equal(
            parseCode('function foo(x, z){\n' +
                '   \n' +
                '   let a = [1,2,3];\n' +
                '   if (x < z) {\n' +
                '       return a[1];\n' +
                '   }\n' +
                '   else{return a[0];}\n' +
                '}\n','(x = 2, z = 1)'),
            'n1 [label="-1-\n' +
            'let a = [1,2,3];", fillcolor = green, style = filled, shape = box]\n' +
            'n2 [label="-2-\n' +
            'x < z", fillcolor = green, style = filled, shape = diamond]\n' +
            'n3 [label="-3-\n' +
            'return a[1]", shape = box]\n' +
            'n4 [label="-4-\n' +
            'return a[0]", fillcolor = green, style = filled, shape = box]n1 -> n2 []\n' +
            'n2 -> n3 [label="true"]\n' +
            'n2 -> n4 [label="false"]\n' +
         );
    });

    it('testParseCode5', () => {
        assert.equal(
            parseCode('function foo(x, y, z){\n' +
                '   \n' +
                '   let a = [1,2,3];\n' +
                '   if (x < y + z) {\n' +
                '       return a[1];\n' +
                '   }\n' +
                '   else{return a[0];}\n' +
                '}\n','(x = 5, y= 3, z = 1)'),
            'n1 [label="-1-\n' +
            'let a = [1,2,3];", fillcolor = green, style = filled, shape = box]\n' +
            'n2 [label="-2-\n' +
            'x < y + z", fillcolor = green, style = filled, shape = diamond]\n' +
            'n3 [label="-3-\n' +
            'return a[1]",  fillcolor = green, style = filled, shape = box]\n' +
            'n4 [label="-4-\n' +
            'return a[0]", shape = box]n1 -> n2 []\n' +
            'n2 -> n3 [label="true"]\n' +
            'n2 -> n4 [label="false"]\n' +
         );
    });

    it('testParseCode6', () => {
        assert.equal(
            parseCode('function foo(x, y, z){\n' +
                '   \n' +
                '   let a = [1,2,3];\n' +
                '   if (x + y< y + z) {\n' +
                '       return a[1];\n' +
                '   }\n' +
                '   else{return a[0];}\n' +
                '}\n','(x = 5, y= 3, z = 1)'),
            'n1 [label="-1-\n' +
            'let a = [1,2,3];", fillcolor = green, style = filled, shape = box]\n' +
            'n2 [label="-2-\n' +
            'x + y< y + z", fillcolor = green, style = filled, shape = diamond]\n' +
            'n3 [label="-3-\n' +
            'return a[1]", shape = box]\n' +
            'n4 [label="-4-\n' +
            'return a[0]", fillcolor = green, style = filled, shape = box]n1 -> n2 []\n' +
            'n2 -> n3 [label="true"]\n' +
            'n2 -> n4 [label="false"]\n' +
         );
    });

    it('testParseCode7', () => {
        assert.equal(
            parseCode('function foo(x, y, z){\n' +
                '   \n' +
                '   let a = [1,2,3];\n' +
                '   if (x + y< y + z) {\n' +
                '       return a[1];\n' +
                '   }\n' +
                '   else{return a[0];}\n' +
                '}\n','(x = 1, y= 3, z = 4)'),
            'n1 [label="-1-\n' +
            'let a = [1,2,3];", fillcolor = green, style = filled, shape = box]\n' +
            'n2 [label="-2-\n' +
            'x + y< y + z", fillcolor = green, style = filled, shape = diamond]\n' +
            'n3 [label="-3-\n' +
            'return a[1]",  fillcolor = green, style = filled, shape = box]\n' +
            'n4 [label="-4-\n' +
            'return a[0]", shape = box]n1 -> n2 []\n' +
            'n2 -> n3 [label="true"]\n' +
            'n2 -> n4 [label="false"]\n' +
         );
    });

    it('testParseCode8', () => {
        assert.equal(
            parseCode('function foo(x, y, z){\n' +
                '   \n' +
                '   let a = [1,2,3];\n' +
                '   if (x < y + z) {\n' +
                '       return a[0];\n' +
                '   }\n' +
                '   else{return a[1];}\n' +
                '}\n','(x = 5, y= 3, z = 1)'),
            'n1 [label="-1-\n' +
            'let a = [1,2,3];", fillcolor = green, style = filled, shape = box]\n' +
            'n2 [label="-2-\n' +
            'x < y + z", fillcolor = green, style = filled, shape = diamond]\n' +
            'n3 [label="-3-\n' +
            'return a[0]",  fillcolor = green, style = filled, shape = box]\n' +
            'n4 [label="-4-\n' +
            'return a[1]", shape = box]n1 -> n2 []\n' +
            'n2 -> n3 [label="true"]\n' +
            'n2 -> n4 [label="false"]\n' +
         );
    });

    it('testParseCode9', () => {
        assert.equal(
            parseCode('function foo(x, y, z){\n' +
                '   \n' +
                '   let a = [1,2,3];\n' +
                '   if (x < y + z*2) {\n' +
                '       return a[1];\n' +
                '   }\n' +
                '   else{return a[0];}\n' +
                '}\n','(x = 4, y= 3, z = 1)'),
            'n1 [label="-1-\n' +
            'let a = [1,2,3];", fillcolor = green, style = filled, shape = box]\n' +
            'n2 [label="-2-\n' +
            'x < y + z*2", fillcolor = green, style = filled, shape = diamond]\n' +
            'n3 [label="-3-\n' +
            'return a[1]",  fillcolor = green, style = filled, shape = box]\n' +
            'n4 [label="-4-\n' +
            'return a[0]", shape = box]n1 -> n2 []\n' +
            'n2 -> n3 [label="true"]\n' +
            'n2 -> n4 [label="false"]\n' +
         );
    });

});
