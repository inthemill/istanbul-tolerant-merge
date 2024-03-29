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
const allPact = require('./resources/pact.json');
const allKarmaClone = _.cloneDeep(allKarma);
const allMochaClone = _.cloneDeep(allMocha);
const allPactClone = _.cloneDeep(allPact);
const problemFile = path.normalize('src\\kachelVertrag\\gui\\kachelVertrag.service.ts');

function getCoverageOfFile(coverage, fileName) {
    return coverage[fileName] || coverage[normalize(fileName)] || coverage[path.normalize(fileName)];
}

function getProblemCoverage(coverage) {
    return getCoverageOfFile(coverage, problemFile);
}

describe('istanbul-prepare-merge', () => {
    test('merged json has all needed keys', () => {
        const result = merge([allKarma, allMocha]);
        _([merge([allKarma]), merge([allMocha])]).map(_.keys).flatten().uniq().forEach(k => expect(result[k]).toBeDefined());
        checkUnchanged();
    });

    test('problemFile`s statementMap`s size is 22', () => {
        const result = merge([allKarma, allMocha]);
        expect(_.size(getProblemCoverage(result).statementMap)).toBe(22);
        checkUnchanged();
    });

    test('merges branch coverage sucessfully', () => {
        const result = merge([allKarma, allMocha]);
        expect(getProblemCoverage(result).b[1]).toEqual([6, 4]);
        checkUnchanged();
    });

    test('merges function coverage sucessfully', () => {
        const result = merge([allKarma, allMocha]);
        expect(getProblemCoverage(result).f[1]).toEqual(2);
        checkUnchanged();
    });

    test('merge line coverage sucessfully', () => {
        const result = merge([allMocha, allPact]);
        const file = path.normalize('src\\vertragReadModel\\vertrag.readModel.integrationservices.ts');
        expect(getCoverageOfFile(result, file).l[1]).toEqual(2);
        checkUnchanged();
    });

    test('path.relative', () => {
        let abs = path.resolve('src', 'index');
        expect(abs).toEqual(path.join(process.cwd(), 'src', 'index'));
        expect(path.relative(process.cwd(), abs)).toEqual(path.join('src', 'index'));
    });

    test('can read from list of files', () => {
        const result = merge([__dirname + '/resources/karma.normalized.json', __dirname + '/resources/mocha.json']);
        expect(getProblemCoverage(result).f[1]).toEqual(2);
    });

    test('can read from list of globs', () => {
        const result = merge([__dirname + '/resources/*.normalized.*', __dirname + '/resources/mocha.*']);
        expect(getProblemCoverage(result).f[1]).toEqual(2);
    });

    test('can read glob', () => {
        const result = merge(__dirname + '/resources/*.json');
        expect(getProblemCoverage(result).f[1]).toEqual(2);
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
            merge([__dirname + '/resources/*.normalized.*', __dirname + '/resources/mocha.*'], {
                out: path
            });

            const result = JSON.parse(fs.readFileSync(path, {
                encoding: 'utf-8'
            }));
            expect(getProblemCoverage(result).f[1]).toEqual(2);
        } finally {
            fs.unlinkSync(path);
        }
    });

    test('can find problem in bad files', () => {
        const result = merge([__dirname + '/resources/bad1/*.json']);
        expect(result[path.normalize('src/produktauswahl/produktauswahlNeugeschaeft.component.ts')].s[1]).toEqual(2);
    });

});


function checkUnchanged() {
    expect(allKarma).toEqual(allKarmaClone);
    expect(allMocha).toEqual(allMochaClone);
    expect(allPact).toEqual(allPactClone);
}