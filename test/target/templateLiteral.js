/* Created by tommyZZM on 2016/3/2. */
"use strict"

let target= __cook(`
    <div :is="{{tag}}">
        <p>hello world!</p>
        <p>${"variable"}</p>
    </div>
`)
