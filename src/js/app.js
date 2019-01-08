import $ from 'jquery';
import {parseCode} from './code-analyzer';
import  Viz from 'viz.js';
import  render from 'viz.js/full.render.js';

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let args = $('#codePlaceholder2').val();
        let viz = new Viz(render);
        viz.renderString('digraph {' + parseCode(codeToParse,args) + '}').then(function(res) {
            document.getElementById('result').innerHTML = res;
        });
    });
});
