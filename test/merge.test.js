const _ = require('lodash');
const path = require('path');
const merge = require('../index.js').merge;
const temp = require('temp');
const fs = require('fs');
const normalize = require('normalize-path');

const allKarma = _(require('./resources/karma.json')).mapKeys((v, k) => k.replace('${pwd}', process.cwd())).mapValues((v, k) => ({
    ...v,
    path: k
})).value();

const allMocha = require('./resources/mocha.json');
const allKarmaClone = _.cloneDeep(allKarma);
const allMochaClone = _.cloneDeep(allMocha);
const problemFile = normalize('src\\kachelVertrag\\gui\\kachelVertrag.service.ts');

describe('istanbul-prepare-merge', () => {
    test('merged json has all needed keys', () => {
        const result = merge([allKarma, allMocha]);
        _([merge([allKarma]), merge([allMocha])]).map(_.keys).flatten().uniq().forEach(k => expect(result[k]).toBeDefined());
        checkUnchanged();
    });

    test('problemFile`s statementMap`s size is 22', () => {
        const result = merge([allKarma, allMocha]);
        expect(_.size(result[problemFile].statementMap)).toBe(22);
        checkUnchanged();
    });

    test('merges branch coverage sucessfully', () => {
        const result = merge([allKarma, allMocha]);
        expect(result[problemFile].b[1]).toEqual([6, 4]);
        checkUnchanged();
    });

    test('merges function coverage sucessfully', () => {
        const result = merge([allKarma, allMocha]);
        expect(result[problemFile].f[1]).toEqual(2);
        checkUnchanged();
    });

    test('normalize file path', () => {
        const pathToBeModified = process.cwd() +  '\\src\\kachelVertrag\\gui\\kachelVertrag.service.ts';
        expect(allKarma[pathToBeModified]).not.toBeUndefined();

        expect(allKarma[problemFile]).toBeUndefined();

        const result = merge([allKarma, allMocha], {base: process.cwd()});
        expect(result[pathToBeModified]).toBeUndefined();
        expect(result[problemFile].f[1]).toEqual(2);
        expect(result[problemFile].path).toEqual(problemFile);
        const result2 = merge([allMocha, allKarma]);
        expect(result2[problemFile].path).toEqual(problemFile);
    });

    test('path.relative', () => {
        let abs = path.resolve('src','index');
        expect(abs).toEqual(path.join(process.cwd(), 'src', 'index'));
        expect(path.relative(process.cwd(), abs)).toEqual(path.join('src','index'));
    });

    test('can read from list of files', () => {
        const result = merge([__dirname + '/resources/karma.normalized.json', __dirname + '/resources/mocha.json']);
        expect(result[problemFile].f[1]).toEqual(2);
    });

    test('can read from list of globs', () => {
        const result = merge([__dirname + '/resources/*.normalized.*', __dirname + '/resources/mocha.*']);
        expect(result[problemFile].f[1]).toEqual(2);
    });

    test('can read glob', () => {
        const result = merge(__dirname + '/resources/*.json');
        expect(result[problemFile].f[1]).toEqual(2);
    });

    test('fails on empty glob', () => {
        expect(() => merge(__dirname + '/resourcess/*')).toThrow();
    });

    test('fails on empty glob', () => {
        expect(() => merge([__dirname + '/resources/*.normaldized.*', __dirname + '/resources/mocha.*'])).toThrow();
    });


    test('can safe file', () => {
        const path = temp.path();
        try {
            merge([__dirname + '/resources/*.normalized.*', __dirname + '/resources/mocha.*'], {out: path});

            const result = JSON.parse(fs.readFileSync(path, {encoding: 'utf-8'}));
            expect(result[problemFile].f[1]).toEqual(2);
        } finally {
            fs.unlinkSync(path);
        }
    });

    test('can find problem in bad files', () => {
        const result = merge([__dirname + '/resources/bad1/*.json']);
        expect(result['src/produktauswahl/produktauswahlNeugeschaeft.component.ts'].s[1]).toEqual(2);
    });

});


function checkUnchanged() {
    expect(allKarma).toEqual(allKarmaClone);
    expect(allMocha).toEqual(allMochaClone)
}