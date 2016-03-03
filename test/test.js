/* Created by tommyZZM on 2016/3/2. */
"use strict"

import fs from "fs"
import { transformFileSync } from 'babel-core'
import { expect } from 'chai';
import * as cheerio from 'cheerio'
import { minify } from "html-minifier"

describe('decorators', function(){
    this.slow(100);
    describe("string", function(){
        it("should cook string",function(){
            let resultCooked = ""
            var result = transformFileSync("./test/target/templateLiteral.js",{
                plugins:[
                    ["../index.js",{cook:function(content){
                        let cooked = minify(content,{
                            collapseWhitespace:true
                        });
                        console.log("before cook",content)
                        console.log("cook success!",cooked)
                        expect(content).to.be.a('string');
                        return resultCooked = cooked
                    }}]
                ]
            });
            //expect(result.code).to.be.include(resultCooked)
        })

        it("should cook string ,too!",function(){
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

        it("should cook string ,also!",function(){
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

    describe("scoped", function(){
        it("shouldn't cook because __cook is scoped",function(){
            var result = transformFileSync("./test/target/scokedCookFunction.js",{
                plugins:[
                    ["../index.js",{cook:function(content){
                        //console.log(content)
                        expect(content).to.not.be.a('string');
                        return content
                    }}]
                ]
            });
        })
    })

    describe("options", function(){
        it("should get cook options",function(){
            var result = transformFileSync("./test/target/cookOptions.js",{
                plugins:[
                    ["../index.js",{cook:function(content,fileName,options){
                        expect(options.ishtml).to.be.true;
                        return content
                    }}]
                ]
            });
        })
    })
})


