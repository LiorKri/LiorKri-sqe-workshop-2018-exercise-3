import * as esprima from 'esprima';
import * as escodegen from 'escodegen';

let vars = [];
let vals = [];
let args = [];
let updated_env = [];
let colors = [];


const parseCode = (codeToParse, args_json) => {
    args = [];
    vars = [];
    vals = [];
    updated_env = [];
    colors = [];
    let parsed_args = esprima.parseScript(args_json)
    parse_args_func(parsed_args);
    let json_obj = esprima.parseScript(codeToParse, {loc: true});
    json_obj.body.map((x) => rec_parse_func[x.type](x,[vars,vals]));
    json_obj.body = json_obj.body.filter((x) =>  !(x.type === 'VariableDeclaration') && !(x.type === 'ExpressionStatement'));
    return color(escodegen.generate(json_obj));

};

function args_obj (name, val){
    this.name = name;
    this.val = val;
}

const parse_args_func = (js) => {
    if(js.body[0].expression.expressions.length == 1){
        let arg = new args_obj(js.body[0].expression.left.name, escodegen.generate(js.body[0].expression.right));
        args.push(arg);
    }
    else if(js.body[0].expression.expressions.length > 1){
         let i;
         for (i = 0; i < js.body[0].expression.expressions.length; i++) {
            let arg = new args_obj(js.body[0].expression.expressions[i].left.name,escodegen.generate(js.body[0].expression.expressions[i].right));
            args.push(arg);
          }
    }
};

const filter_func = (x) => {
    return x.type === 'VariableDeclaration'? false :
        x.type === 'ExpressionStatement' ? ((is_arg_func(x.expression.left.name)) ||
            (x.expression.left.type === 'MemberExpression' ? (is_arg_func(x.expression.left.object.name)) : false)) :
            true;
};

const parse_bloc_state = (js,env) => {
    let i;
    for(i = 0; i <  js.body.length; i++){
        rec_parse_func[js.body[i].type](js.body[i],env);
    }
    js.body = js.body.filter(filter_func);
};


const parse_func_dec = (js,env) => {
    rec_parse_func[js.body.type](js.body,env);
};

const parse_var_dec = (js,env) => {
    let i;
    for (i = 0; i < js.declarations.length; i++) {
        let val;
        if(js.declarations[i].init == null) {
            val = null;
        }
        else {
            val = parse_exp[js.declarations[i].init.type](js.declarations[i].init,env);
        }
        let env_var = js.declarations[i].id.name;
        env[0].push(env_var);
        env[1].push(val);
    }
};

const parse_assignment_expr = (js,env) =>{
    let val = parse_exp[js.right.type](js.right,env);
    env[0].push(js.left.name);
    env[1].push(val);
    js.right = esprima.parseScript(val).body[0].expression;
};

const parse_expr_statement = (js,env) => {
    parse_assignment_expr(js.expression,env);
};

const clone_env_func = (env) =>{
    let new_vars = env[0].map((x) => x);
    let new_vals = env[1].map((x) => x);
    return [new_vars,new_vals];
};

const parse_while_state = (js,env) => {
    let cond = parse_exp[js.test.type](js.test, env);
    js.test = esprima.parseScript(cond).body[0].expression;
    let clone_env = clone_env_func(env);
    rec_parse_func[js.body.type](js.body,clone_env);
};

const run_cond_with_args = (js,env) => {
    let code;
    code = args.reduce(((str, line) => str + 'let ' + line.name + ' = ' + line.val + '; '), '');
    let i;
    for( i = 0; i < env[0].length; i++){
        if(is_arg_func(env[0][i]))
            code += env[0][i] + ' = ' + env[1][i] + '; ';
    }
    code += js + ';';
    return eval(code);
};

const add_env = (env,new_env) => {
    let i;
    for(i = 0 ; i < new_env[0].length; i++){
        env[0].push(new_env[0][i]);
        env[1].push(new_env[1][i]);
    }
};

const parse_alternate_if_state = (js,env) => {
    let cond = parse_exp[js.test.type](js.test,env);
    js.test = esprima.parseScript(cond).body[0].expression;
    let clone_env = clone_env_func(env);
    colors.push(run_cond_with_args(cond,env));
    rec_parse_func[js.consequent.type](js.consequent,clone_env);
    if(run_cond_with_args(cond,env) && updated_env.length === 0) {
        updated_env = clone_env;
    }
    if (js.alternate != null)
        parse_alternate_if[js.alternate.type](js.alternate,env);
};

const parse_alternate_block_state = (js,env) => {
    let clone_env = clone_env_func(env);
    let j;
    for(j = 0; j <  js.body.length; j++){
        rec_parse_func[js.body[j].type](js.body[j],clone_env);
    }
    if(updated_env.length === 0){
        updated_env = clone_env;

    }
    js.body = js.body.filter(filter_func);
};

const parse_return_state = (js,env) => {
    let var1 = parse_exp[js.argument.type](js.argument,env);
    js.argument = esprima.parseScript(var1).body[0].expression;
};

const parse_alternate_if = {
    'IfStatement' : parse_alternate_if_state,
    'BlockStatement' : parse_alternate_block_state,
    'ReturnStatement' : parse_return_state

};

const parse_if_state = (js,env) => {
    let cond = parse_exp[js.test.type](js.test,env);
    js.test = esprima.parseScript(cond).body[0].expression;
    let clone_env = clone_env_func(env);
    colors.push(run_cond_with_args(cond,env));
    rec_parse_func[js.consequent.type](js.consequent,clone_env);
    if(run_cond_with_args(cond,env) && updated_env.length === 0) {
        updated_env = clone_env;
    }
    if (js.alternate != null)
        parse_alternate_if[js.alternate.type](js.alternate,env,0);
    if(updated_env.length !== 0) {
        add_env(env, updated_env);
    }
};

const right_literal = (js) => {
    return js.raw;
};

const right_identifier = (js,env) => {
    try{
        let val = get_val_from_env_func(js.name, env);
        if(is_arg_func(js.name))
            return js.name;
        else
            return val;
    }
    catch (e){
        return js.name;
    }
};

const unary_exp = (js,env) => {
    return js.operator + (parse_exp[js.argument.type](js.argument,env));
};

const add_parer = (left,op,right) => {
    if(left.toString().length > 1 && right.toString().length > 1){
        return '(' + left + ') ' + op + ' (' + right + ')';
    }
    else if(left.toString().length > 1){
        return '(' + left + ') ' + op + ' ' + right ;
    }
    else{
        return left + ' ' + op + ' (' + right + ')';
    }
};
const right_binary = (js,env) => {
    let left = (parse_exp[js.left.type](js.left,env));
    let right = (parse_exp[js.right.type](js.right,env));
    if (js.operator === '*' || js.operator === '/'){
        return add_parer(left,js.operator,right);
    }
    return left + ' ' + js.operator + ' ' + right;
};

const array_exp = (js,env) => {
    let str = '[';
    let i;
    for(i = 0; i < js.elements.length - 1; i++){
        str = str + parse_exp[js.elements[i].type](js.elements[i],env);
        str = str + ', ';
    }
    str = str +parse_exp[js.elements[i].type](js.elements[i],env);
    str = str + ']';
    return str;
};

const member_exp = (js,env) => {
    return (parse_exp[js.object.type](js.object,env)) + '[' + (parse_exp[js.property.type](obj.property,env)) + ']';
};


const parse_exp =  {
    'Literal' : right_literal,
    'Identifier' : right_identifier,
    'UnaryExpression' : unary_exp,
    'BinaryExpression' : right_binary,
    'ArrayExpression' : array_exp,
    'MemberExpression' : member_exp
};

const rec_parse_func = {
    'FunctionDeclaration' : parse_func_dec,
    'BlockStatement' : parse_bloc_state,
    'VariableDeclaration' : parse_var_dec,
    'ExpressionStatement' : parse_expr_statement,
    'AssignmentExpression' : parse_assignment_expr,
    'WhileStatement' : parse_while_state,
    'IfStatement' : parse_if_state,
    'ReturnStatement' : parse_return_state
};

const get_val_from_env_func = (name,env) => {
    let idx = env[0].lastIndexOf(name);
    return env[1][idx];
};

const is_arg_func = (arg) => {
    let i;
    for(i = 0; i < args.length; i++){
        if((args[i].name === arg))
            return true;
    }
    return false;
};


const color = (str) => {
    let arr = str.split('\n');
    let i;
    let j = 0;
    for(i = 0; i < arr.length; i++){
        if(arr[i].includes('if') || arr[i].includes('else if')){
            arr[i] = colors[j] === false? '<markRed>' + arr[i] + '</markRed>' : '<markGreen>' + arr[i] + '</markGreen>';
            j++;
        }
    }
    return arr.join('\n');
};

export {parseCode};