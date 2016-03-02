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
 *    ["cook-string",{cook:function(content){
 *      ...
 *      return dosomething(content)
 *    }}]
 * ]
 *
 */

const crypto = require("crypto");
const SPLITERID = crypto.randomBytes(20).toString('hex');
const SPLITER = "${"+SPLITERID+"...}"

module.exports = function(babel){
    let types = babel.types;

    const visitor = {
        CallExpression: function(path, state) {
            let options = state.opts;
            let cookPipeline = options.cook

            if(typeof cookPipeline !== "function")return;

            if(path.node.callee.name==="__cook"){
                let htmlLiteral = path.node["arguments"][0];
                //let compileOptions = ppath.get('arguments')[1];

                if(types.isTemplateLiteral(htmlLiteral)){
                    return path.replaceWith(cookTemplateLiteral(htmlLiteral,cookPipeline))
                }else if(types.isStringLiteral(htmlLiteral)){
                    htmlLiteral.value = cookPipeline(htmlLiteral.value);
                    return path.replaceWith(htmlLiteral)
                }else if(types.isBinaryExpression(htmlLiteral)){
                    let literalArray = binaryExpressionToArray(htmlLiteral);
                    if(literalArray.some(literal=>types.isTemplateLiteral(literal)||types.isStringLiteral(literal))){
                        let literal = cookTemplateLiteral(literalArrayToTemplateLiteral(literalArray),cookPipeline)
                        return path.replaceWith(literal)
                    }
                }
            }
        }
    }

    return {
        visitor: visitor
    };

    function cookTemplateLiteral(literal,cookFn){
        //console.log(literal.expressions)
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
