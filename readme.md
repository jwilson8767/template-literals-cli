# template-literals-cli

> Templates so literal, a barbarian can do it

Provides a simple way to build [ES6 Template Literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) into static html files with an optional yaml or json config/data file. 

## Getting started
1. Install via `npm install template-literals-cli -g`

2. Create a config/data file using either YAML or json. For example `mydata.yml`:
```yaml
fire_hot: true
exclamations: 
  - 'UYGH!'
  - 'GRRAH!'
  - 'OOAH!' 
colors:
  - 'red'
  - 'orange'
  - 'yellow'
```

3. Create a template file which exports a default function. For example `touchfire.js`:
```js
export default (config)=>`
<html>
    <body>
        <h1>${ config['fire_hot'] ? config['exclamations'][Math.floor(Math.random() * config['exclamations'].length)] : 'Wha'}</h1>
        
        <h3>${ config['exclamations'].join(' ') }</h3>
        
        <div>
            ${ config['fire_hot'] ? config['exclamations'].map((exclamation, index)=>`
                <span style="color: ${config.colors[index]}; padding: 1rem;">${exclamation}</span>
            `).join(''):'' }
        </div>
    </body>
</html>
`
```

3. Build the file into `dist/touchfire.html` using `template-literals --config config.yml --outdir dist touchfire.js`

4. (optional) Start the http server of your choice in `dist/` and visit `http://localhost/touchfire.html`. Optionally you can build again using `template-literals --config config.yml --outdir dist --indexes touchfire.js` and then visit `http://localhost/touchfire/` if you want a prettier url.

5. (optional) Add the npm script below to your project's `package.json` so can just run `npm run build` instead of remembering your exact build command:
```json
{
"scripts": {
    "build": "template-literals --config config.yml --outdir dist --indexes src/*.js"
    }
}
``` 
Note that the wildcard is expanded by your terminal and therefore may not work on Windows/wherever glob is not available.

## Importing other templates
Using templates from other files is easy, just import the desired template like this:
```js
// File: templates/header.js
export default (config)=>`
<nav class="menu">
  <ul>
    <li><a href="#">Home</a></li>
    <li><a href="#">About</a></li>
    <li><a href="#">Contact</a></li>
  </ul>
</nav>
`
// end file

// File: index.js
import header from 'templates/header';
export default (config)=>`
<html>
    <body>
        ${ header(config) }
        
        <!-- more content here -->
    </body>
</html>
`
// endfile
```

## Complex logic
If your templates start to get complicated you can always fall back to javascript to handle complex bits - so long as the default export returns a string.
```js
import item_card from 'templates/item_card.js';
export default (config)=> {
  let x = 0;
  let cards = config['items'].map((item)=>{
    return item_card(item, x++);
  });
  return `
     <html>
         <body>
             ${ cards.join('') }
             
             <!-- more content here -->
         </body>
     </html>
  `
}
```