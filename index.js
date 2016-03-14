/* Created by tommyZZM on 2016/3/2. */
"use strict"

/**
 * babel-plugin-cook-string 预处理一些字符串;
 *
 * @作用描述：
 *
 * @input
 * __cook(`something`);
 *
 * @compile
 * plugins:[
 *    ["cook-string",{cook:function(content,fileName){
 *      ...
 *      return dosomething(content)
 *    }}]
 * ]
 *
 */

const crypto = require("crypto");
const generate = require("babel-generator").default;
const objectPath = require("object-path")

const SPLITERID = "[expression]"+crypto.randomBytes(20).toString('hex').substring(10,20);
const SPLITER = "${"+SPLITERID+"...}"
const APINAME = "__cook";

module.exports = function(babel){
    let types = babel.types;

    const visitor = {
        CallExpression: function(path, state) {
            let options = state.opts;
            if(typeof options.cook !== "function")return;

            if(path.node.callee.name===APINAME){

                if(path.scope.hasOwnBinding/**hasBinding??**/(APINAME))return;

                //传入cook选项
                let htmlLiteral = path.node["arguments"][0];
                let compileOptions = cookOptionsFilter(path.node["arguments"][1]);
                let compileOptionsGenterate = generate(compileOptions);
                let compileOptionsObject = tryEval(compileOptionsGenterate.code);

                let fileName = objectPath.get(state,"file.opts.filename");
                let cookFn = cookPipeline(options.cook,fileName,compileOptionsObject);

                if(types.isTemplateLiteral(htmlLiteral)){
                    return path.replaceWith(cookTemplateLiteral(htmlLiteral,cookFn))
                }else if(types.isStringLiteral(htmlLiteral)){
                    htmlLiteral.value = cookFn(htmlLiteral.value);
                    return path.replaceWith(htmlLiteral)
                }else if(types.isBinaryExpression(htmlLiteral)){
                    let literalArray = binaryExpressionToArray(htmlLiteral);
                    if(literalArray.some(literal=>types.isTemplateLiteral(literal)||types.isStringLiteral(literal))){
                        let literal = cookTemplateLiteral(literalArrayToTemplateLiteral(literalArray),cookFn)
                        return path.replaceWith(literal)
                    }
                }

                return path.replaceWith(types.stringLiteral("undefined"))
            }
        }
    }

    return {
        visitor: visitor
    };

    function tryEval(code){
        try {
            return eval("("+code+")")
        }catch (e){
        }
        return {}
    }

    function cookOptionsFilter(compileOptions){
        if(!types.isObjectExpression(compileOptions) || compileOptions.properties.length===0){
            return types.objectExpression([])
        }

        //cookOptionOnlyAccept string or boolean or number
        let properties = compileOptions.properties.filter(prop=>{
            if( types.isObjectProperty(prop) ){
                if(types.isBooleanLiteral(prop.value)
                    || types.isStringLiteral(prop.value)
                    || types.NumericLiteral(prop.value)
                ){
                    return true
                }
            }
        })

        return types.objectExpression(properties)
    }

    function cookPipeline(cookFn,fileName,options){
        return input => {
            let result = cookFn(input,fileName,options);
            if(typeof result!=="string"){
                if(typeof result==="number" || typeof result==="boolean"){
                    return result+"";
                }
                return "";
            }
            return result;
        }
    }

    function cookTemplateLiteral(literal,cookFn){
        let quasisRawsArray = literal.quasis.map(quasi=>quasi.value.raw);
        let quasisRaw = quasisRawsArray.reduce((final ,curr, i)=>final+(i?SPLITER:"")+curr,"")

        let quasisRawCooked = cookFn(quasisRaw);
        let quasisRawCookedArray = quasisRawCooked.split(SPLITER);

        if(quasisRawCookedArray.length===quasisRawsArray.length){
            literal.quasis.forEach((quasi,i)=>{
                quasi.value.cooked = quasisRawCookedArray[i];
            })
        }
        return literal
    }

    function binaryExpressionToArray(literal){
        let left = literal.left;
        if(types.isBinaryExpression(left)){
            let resultArray = [];
            resultArray = resultArray.concat(binaryExpressionToArray(left))
            resultArray.push(literal.right);
            return resultArray;
        }else{
            return [left,literal.right]
        }
    }

    function literalArrayToTemplateLiteral(literalArray){

        let quasis = [];
        let expressions = [];
        let lastTemplateValue = "";
        let lastLiteralIsString = false;

        literalArray.forEach(literal=> {
            if (types.isStringLiteral(literal)) {
                lastTemplateValue += literal.value;
                lastLiteralIsString = true;
            } else if (types.isTemplateLiteral(literal)) {
                literal.quasis.forEach((quasi, j)=> {
                    lastTemplateValue += quasi.value.raw;
                    if (literal.expressions[j]) {
                        lastLiteralIsString = false;
                        quasis.push(templateElement(lastTemplateValue))
                        lastTemplateValue = "";
                        expressions.push(literal.expressions[j])
                    }
                })
            } else {
                if (lastLiteralIsString) {
                    lastLiteralIsString = false;
                    quasis.push(templateElement(lastTemplateValue))
                    lastTemplateValue = "";
                } else if (types.isExpression(literal)) {
                    expressions.push(literal)
                }
            }
        })

        //如果最后一个不是字符串则补一个字符串,或者如果lastTemplateValue还有具体的值则插补lastTemplateValue
        if(!lastLiteralIsString || !!lastTemplateValue){
            quasis.push(templateElement(lastTemplateValue,true))
        }

        return types.templateLiteral(quasis,expressions);

        function templateElement(content,tail){
            return types.templateElement({
                raw:content,
                cooked:content
            },tail)
        }
    }
}
