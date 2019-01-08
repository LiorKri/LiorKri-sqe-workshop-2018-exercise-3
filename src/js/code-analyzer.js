import * as esprima from 'esprima';
import * as esgraph from 'esgraph';
import * as escodegen from 'escodegen';
let args = [];
let r_val = ['Literal' , 'Identifier', 'BinaryExpression', 'MemberExpression', 'UnaryExpression', 'ArrayExpression', 'LogicalExpression'];
let color_paths  = [];
let expr_nodes = [];
let globals = [];

const parseCode = (codeToParse, arg) => {
    args = [];
    color_paths = [];
    expr_nodes = [];
    globals = [];

    let code = removeDec(codeToParse);
    read_args(esprima.parseScript(arg));
    let parsed_code_body = esprima.parse(code, { range: true }).body[0].body

    let cfg = esgraph(parsed_code_body);
    let dot_g = esgraph.dot(cfg, { counter: 0, source: code });
    let expr_dot = esgraph.dot(cfg, {counter: 0});

    color_paths =  discover_path(prepare_graph(dot_g.toString()),prepare_graph(expr_dot.toString()),globals.join(' '));

    let pre_graph = prepare_graph(dot_g.toString())
    let arr = pre_graph.split('\n');
    let edges = arr.filter(x => x.includes('->'));
    let nodes = arr.filter(x => (!x.includes('->')));
    nodes = nodes.map(x => color_paths.includes(x.split(' ')[0])? x.substr(0, x.length-1) + ', fillcolor = green, style = filled]' : x);
    nodes = nodes.map(x => x.split('"')).map((y,z) => y[0] + '"-' + (z + 1) + '-\n' + y[1] + '"' + y[2]);
    nodes = create_shape(nodes);
    nodes = nodes.join('\n');
    edges = edges.join('\n');
    return nodes + edges;

};

function arg_obj (name, val){
    this.name = name;
    this.val = val;
}

const removeDec = (funcCode) => {
    let arr = funcCode.split('\n');
    let i = 0;
    for(i; i < arr. length; i++){
        if(arr[i].split(' ')[0] === 'function')
            break;
        else
            globals.push(arr[i]);
    }
    return arr.slice(i).join(' ');

};

const read_args = (obj) => {
    if(obj.body[0].expression.expressions.length == 1){
        let arg = new arg_obj(obj.body[0].expression.left.name, escodegen.generate(obj.body[0].expression.right));
        args.push(arg);
    }
    else{
        let i;
        for (i = 0; i < obj.body[0].expression.expressions.length; i++) {
            let arg = new arg_obj(obj.body[0].expression.expressions[i].left.name,escodegen.generate(obj.body[0].expression.expressions[i].right));
            args.push(arg);
        }
    }
};

const prepare_graph = (g) => {
    let arr = g.split('\n').filter(x => !x.includes('label=exception') && !(x.includes('n0')));
    let i;
    let s = '';
    for (i = 0; i < arr.length; i++) {
        if(arr[i].includes('exit'))
            s = arr[i].split(' ')[0];
    }
    return arr.filter(x => !x.includes(s) && !x.includes('exit')).join('\n').trim();
};

const parse_args = () => {
    return args.reduce(((str, line) => str + 'let ' + line.name + ' = ' + line.val + '; '), '');
};


const get_expr = (i) =>{
    let ans = expr_nodes.filter(x => x[0] === i + '');
    return ans[0][1];
};


const create_shape = (nodes) => {
    return nodes.map((x) => (r_val.includes(get_expr(parseInt(x.split(' ')[0].substr(1)))))? x.substr(0, x.length - 1) + ', shape = diamond]' : x.substr(0, x.length - 1) + ', shape = box]');
};

const get_node = (edges, cur) => {
    let i;
    for(i = 0; i < edges.length; i++){
        if((edges[i][0] === cur) && (edges[i][1][1] === '[]')) {
            return edges[i][1][0];
        }
    }
    return 'end';
};

const get_if_node = (edges, cur, val) => {
    let i;
    for(i = 0; i < edges.length; i++){
        if(edges[i][0] === cur && edges[i][1][1].includes(val.toString()))
            return edges[i][1][0];
    }
    return 'end';
};

const discover_path = (dot_graph,expr_graph, eval_str) => {
    let arr = dot_graph.split('\n');
    let expr_arr = expr_graph.split('\n');
    let edges = arr.filter(x => x.includes('->')).map((x) => x.split('->').map((y) => y.trim()));
    edges = edges.map(x => [x[0], x[1].split(' ')]);
    let nodes = arr.filter(x => (!x.includes('->')));
    expr_nodes = expr_arr.filter(x => !x.includes('->')).map(x => x.split(' ')).map(x => [x[0].substr(1), x[1].split('"')[1]]);
    let code_array = nodes.map(x => x.split('"')).map(x => [x[0].split(' ')[0].substr(1), x[1]]);
    nodes = nodes.map(x => x.split(' ')[0]);
    let eval_parsed = eval_str + parse_args();
    let color_paths = [];
    let i = 0;
    let next_node = nodes[0];
    let code_by_array;
    while(i < expr_nodes.length + 1){
        i = parseInt(next_node.slice(1));
        if(next_node === 'end'){
           break;}
        color_paths.push(next_node);
        code_by_array = code_array.filter(x => x[0] === i + '')[0][1];
        if(r_val.includes(get_expr(i))){
            let val = eval(eval_parsed + code_by_array);
            next_node = get_if_node(edges,next_node,val);}
        else{
            if(code_by_array.charAt(code_by_array.length - 1) === ';')
                eval_parsed += code_by_array + ' ';
            else
                eval_parsed += code_by_array + '; ';
            next_node = get_node(edges, next_node);
        }
    }
    return color_paths;
};


export {parseCode, removeDec, read_args,prepare_graph,create_shape };
