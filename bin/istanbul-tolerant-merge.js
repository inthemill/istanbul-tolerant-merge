#!/usr/bin/env node

const merge = require('../index').merge;

const options = require('yargs')
    .string('out')
    .describe('out', 'output path for merged raw coverage report JSON file')
    .normalize('out')
    .string('base')
    .describe('base', 'if pathes in coverage report JSON files are absolute, they will be rewritten relative based to this value')
    .normalize('base')
    .default('base', process.cwd())
    .require('out', 'output JSON path is required')
    .require(1, 'at least one path to raw coverage report JSON files is required')
    .string('_')
    .describe('_', 'paths to raw coverage report JSON files to merge')
    .help()
    .usage('Usage: istanbul-tolerant-merge --out path/to/output.json "a/**.json" b/input.json')
    .version()
    .argv;

merge(options._, options);