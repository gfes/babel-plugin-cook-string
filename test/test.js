/* Created by tommyZZM on 2016/3/2. */
"use strict"

import fs from "fs"
import { transformFileSync } from 'babel-core'
import { expect } from 'chai';
import * as cheerio from 'cheerio'
import { minify } from "html-minifier"

describe('decorators', function(){
    describe("string", function(){
        it("should minify html string",function(){
            let resultCooked = ""
            var result = transformFileSync("./test/target/templateLiteral.js",{
                plugins:[
                    ["../index.js",{cook:function(content){
                        let cooked = minify(content,{
                            collapseWhitespace:true
                        });
                        //console.log("before",content)
                        //console.log("cooked",cooked)
                        expect(content).to.be.a('string');
                        return resultCooked = cooked
                    }}]
                ]
            });
            //expect(result.code).to.be.include(resultCooked)
        })

        it("should minify html string ,too!",function(){
            var result = transformFileSync("./test/target/stringLiteral.js",{
                plugins:[
                    ["../index.js",{cook:function(content){
                        let cooked = minify(content,{
                            collapseWhitespace:true
                        });
                        expect(content).to.be.a('string');
                        return cooked
                    }}]
                ]
            });
        })

        it("should minify html string ,also!",function(){
            var result = transformFileSync("./test/target/binaryLiteral.js",{
                plugins:[
                    ["../index.js",{cook:function(content){
                        let cooked = minify(content,{
                            collapseWhitespace:true
                        });
                        expect(content).to.be.a('string');
                        return cooked
                    }}]
                ]
            });
        })
    })
})


