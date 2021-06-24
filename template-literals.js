#!/usr/bin/env node

const minimist = require('minimist');
const yamljs = require('yamljs');
const fs = require('fs');
const path = require('path');
const esm = require("esm")(module);

const args = minimist(process.argv.slice(2), {
  boolean: ['indexes'],
  alias: {
    'outdir': 'o',
    'help': 'h',
    'config': 'c',
    'verbose':'v'
  },
  '--':true
});

if (args.help || args['_'] === null || args['_'] === '') {
  console.log(`
Usage: \`template-literals --config "config.yml" --outdir "dist" ./src/*.js\`

Options:
    -c, --config, --data    YAML or JSON config file which will be passed to the default export function of all files.
    -o, --outdir            Path to output directory. Note that existing files will be overwritten.
    
        --indexes           Instead of naming output files like 'outdir/filename.html' they will be named 'outdir/filename/index.html'. Note that 'index.js' will be named 'outdir/index.html', not 'outdir/index/index.html'.
    -v, --verbose           Display verbose logging information 
    
    -- key1=value1 ...      Arguments after "--" are parsed as key=value pairs which should override those in the config file. Keys may use dot-notation to specify nested paths. Values may be provided as JSON.
    
Examples:
    template-literals --config "config.yml" --outdir "dist" ./src/myPage.js -- exclamations=["OW"]
    template-literals --outdir "dist" ./src/myPage.js -- app_config.domain="example.com" app_config.keys='{"client_id":"asdf123"}'
    `);
  return
}

//load the config
let config;
if (args['config']) {
  try {
    if (path.extname(args['config']) === '.json') {
      config = JSON.parse(fs.readFileSync(args['config']))
    }
    else {
      config = yamljs.load(args['config'] || args['c']);
    }
  }
  catch (ex) {
    console.error('Failed to load config file.');
    console.error(ex);
    return
  }
}

if (!config) {
  config = {};
}
// parse extra vars and attempt to override them in the config.
if (args['--']){
  for (const _var of args['--']) {
    let [k, v] = _var.split('=', 2);
    k = k.replace(/^['"](.+?)['"]$/, '$1') // crude quote removal
    try {
      v = JSON.parse(v);
    }
    catch {
      // do nothing, just take v as a string value
    }
    let key_path = k.split('.');
    let obj = config;
    while (key_path.length > 1){
      if (Array.isArray(obj)){
        key_path[0] = parseInt(key_path[0])
        if (key_path[0] > obj.length){
          throw new RangeError(`Failed to process variable "${k}": array index out of bounds of config.`)
        }
      } else {
        if (!(key_path[0] in obj)) {
          obj[key_path[0]] = {};
        }
      }
      obj = obj[key_path[0]];
      key_path.shift();
    }
    obj[key_path[0]] = v;
  }
}
if (!config){
  console.log('Config not specified, empty object will be passed to templates');
}
if (args['verbose']) {
  console.log(`config:\n${JSON.stringify(config)}\n`);
}

let outdir = args['outdir'];
if (!outdir) {
  console.error('Missing required parameter: outdir');
  return
}
if (!fs.existsSync(outdir)) {
  fs.mkdirSync(outdir);
}
// attempt to import each file and build it.
args['_'].forEach(async (f) => {
  if (fs.existsSync(f)) {
    if (args['verbose']){
      console.log('resolving module: '+f)
    }
    let m = null;

    try {
      let m;
      try {
        m = esm(path.resolve(f.substring(0, f.lastIndexOf(path.extname(f)))))['default'];
      } catch (e) {
        // handle cases where package.json has "type: 'module'"
        if (e.code && e.code === 'ERR_REQUIRE_ESM') {
          m = (await import(path.resolve(f)))['default'];
        } else {
          throw e
        }
      }
      let basename = path.basename(f).split('.').slice(0, -1).join('.');
      let outfile = null;
      if (args['indexes']) {
        if (path.basename(f).split('.').slice(0, -1)[0] !== 'index') {
          if (!fs.existsSync(path.join(outdir, basename))) {
            fs.mkdirSync(path.join(outdir, basename));
          }
          outfile = path.join(outdir, basename, 'index.html');
        }
        else {
          outfile = path.join(outdir, 'index.html');
        }
      }
      else {
        outfile = path.join(outdir, [basename, 'html'].join('.'));
      }
      let result = m(config);
      result = result.replace(/\n[ ]+\n/g,'\n\n').trim();
      fs.writeFileSync(outfile, result);

      console.log(`Generated page: ${outfile}`);
    } catch (e) {

      console.error(`Failed to build file: ${f}`);
      console.error(e)
    }
  }
});




