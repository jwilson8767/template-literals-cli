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
    'config': 'c'
  }
});

if (args.help || args['_'] === null || args['_'] === '') {
  console.log(`
Usage: \`template-literals --config "config.yml" --outdir "dist" ./src/*.js\`

Options:
    -c, --config, --data    YAML or JSON config file which will be passed to the default export function of all files.
    -o, --outdir            Path to output directory. Note that existing files will be overwritten.
        --indexes   Instead of naming output files like 'outdir/filename.html' they will be named 'outdir/filename/index.html'. Note that 'index.js' will named 'outdir/index.html'.
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
else {
  config = {};
  console.log('Config not specified, empty object will be passed to templates');
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
args['_'].forEach((f) => {
  if (fs.existsSync(f)) {
    let m = null;

    try {
      let m = esm(path.resolve(f.substring(0, f.lastIndexOf(path.extname(f)))));
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

      fs.writeFileSync(outfile, m.default(config));

      console.log(outfile);
    } catch (e) {

      console.error(`Failed to build file: ${f}`);
      console.error(e)
    }
  }
});




