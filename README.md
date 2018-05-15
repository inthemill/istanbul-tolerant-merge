[![Build Status](https://travis-ci.org/inthemill/istanbul-tolerant-merge.svg?branch=master)](https://travis-ci.org/inthemill/istanbul-tolerant-merge)

# istanbul-tolerant-merge
Merges several istanbul coverage report JSON files into one. Additional to the built in merging capability of `istanbul report` istanbul-tolerant-merge has the following features:

- it normalizes absolute path to relative ones. This helps when you want to create html-output
- fixes a problem with karma-coverage-istanbul-reporter where statment ids start with 0 instead of 1
- Aligns list of statements, if they do not match exactly

## Installation

With [npm](https://www.npmjs.com/) do

    npm install istanbul-tolerant-merge --save-dev

## Usage

```bash
npx --out coverage/coverage.json "coverage/partial/*.json"
```

## Help

```
Usage: istanbul-tolerant-merge.js --out path/to/output.json "a/**.json"
b/input.json

Options:
  --out      output path for merged raw coverage report JSON file
                                                             [string] [required]
  --base     if pathes in coverage report JSON files are absolute, they will be
             rewritten relative based to this value
      [string] [default: "/home/emanuel/dev/opensource/istanbul-tolerant-merge"]
  --help     Show help                                                 [boolean]
  --version  Show version number                                       [boolean]

at least one path to raw coverage report JSON files is required
```