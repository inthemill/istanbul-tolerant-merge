const _ = require('lodash');
const path = require('path');
const glob = require('glob');
const fs = require('fs');
const astar = require('a-star');
module.exports = {
    merge
};

const defaultConfig = {
    base: process.cwd()
};

function merge(inputs, config = {}) {
    config = { ...defaultConfig,
        ...config
    };
    return _.chain(_.isArray(inputs) ? inputs : [inputs])
        .flatMap(loadFromFS)
        .map(_.partial(normalizePath, config.base))
        .map(fixKarmaBug)
        .reduce(mergeTwo)
        .tap(merged => {
            if (!_.isNil(config.out)) {
                fs.writeFileSync(config.out, JSON.stringify(merged))
            }
        })
        .value();
}

function mergeTwo(one, two) {
    const allKeys = _.spread(_.union)([one, two].map(_.keys));
    return _.fromPairs(allKeys.map(key => [key, mergeFile(one[key], two[key])]));
}

function loadFromFS(pathOrObject) {
    if (_.isObject(pathOrObject)) {
        return [pathOrObject];
    } else {
        const files = glob.sync(pathOrObject);
        if (_.isEmpty(files)) {
            throw new Error(`could not find file or directory at ${pathOrObject}`);
        }
        return files
            .map(file => {
                let content = fs.readFileSync(file, {
                    encoding: 'utf-8'
                });
                if (_.isNil(content)) {
                    throw new Error(`Error reading file ${file}`);
                }
                return JSON.parse(content);
            })
    }
}

function mergeFile(one, two) {
    if (_.isNil(one)) {
        return two;
    }
    if (_.isNil(two)) {
        return one;
    }
    return {
        ...one,
        ...two,
        ...mergeFunctions(one, two),
        ...mergeBranchs(one, two),
        ...mergeStatements(one, two),
    };
}

function normalizePath(base, coverageJson, ) {
    return _(coverageJson)
        .mapKeys((v, key) => path.relative(base, path.resolve(base, key)))
        .mapValues((v, key) => ({ ...v,
            path: key
        })).value();
}

function fixKarmaBug(coverageJson) {
    return _.mapValues(coverageJson, (fileInfo) =>
        _.mapValues(fileInfo, (d) =>
            _.isObject(d) && !_.isNil(d['0']) ? _.mapKeys(d, (value, k) =>
                '' + (1 + parseInt(k, 10))) : d));
}


function mergeFunctions(one, two) {
    if (_.size(one.fnMap) !== _.size(two.fnMap)) {
        console.warn(`fnMaps of '${one.path}' cannot be merged, I will ignore the one with fewer entries`);
        return _.pick(_.size(one.fnMap) > _.size(two.fnMap) ? one : two, ['fnMap', 'f']);
    }
    return {
        fnMap: one.fnMap,
        f: _.mapValues(one.f, (n, k) => n + two.f[k])
    }
}

function mergeBranchs(one, two) {
    if (_.size(one.branchMap) !== _.size(two.branchMap)) {
        console.warn(`branchMaps of ${one.path} cannot be merged,  I will ignore the one with fewer entries`);
        return _.pick(_.size(one.branchMap) > _.size(two.branchMap) ? one : two, ['branchMap', 'b']);
    }
    return {
        branchMap: one.branchMap,
        b: _.mapValues(one.b, (c, id) => _.zipWith(one.b[id], two.b[id], _.add))
    }
}

function mergeStatements(one, two) {
    const mapping = getMapping(one.statementMap, two.statementMap, statementCost);
    return _(mapping)
        .map(([i1, i2], index) => ({
            statementMap: {
                [index + 1]: one.statementMap[i1] || two.statementMap[i2]
            },
            s: {
                [index + 1]: (one.s[i1] || 0) + (two.s[i2] || 0)
            }
        }))
        .reduce(_.merge)
}

function statementCost(s1, s2) {
    return Math.abs(s1.start.line - s2.start.line) * 5 +
        Math.abs(s1.end.line - s2.end.line) * 5 +
        Math.abs(s1.start.column - s2.start.column) +
        Math.abs(s1.end.column - s2.end.column)
}

function getMapping(sm1, sm2, costFn) {
    const end = [_.size(sm1), _.size(sm2)];
    const penalty = 100;
    const sol = astar({
        start: [1, 1],
        isEnd: pair => _.isEqual(pair, end),
        neighbor: ([i1, i2]) => [
            [i1 + 1, i2],
            [i1 + 1, i2 + 1],
            [i1, i2 + 1]
        ],
        distance: (from, to) => {
            if (from[0] === to[0] || from[1] === to[1]) {
                return penalty;
            }
            if (!sm1[to[0]] || !sm2[to[1]]) {
                return 100000000;
            }
            return costFn(sm1[to[0]], sm2[to[1]]);
        },
        heuristic: (pair) => Math.abs((end[0] - end[1]) - (pair[0] - pair[1])) * penalty,
        hash: pair => '' + pair[0] + '-' + pair[1]
    });

    return sol.path.reduce(mapSequentialIndexesToZero, []);

    function mapSequentialIndexesToZero(res, [i1, i2]) {
        const last = _.reduceRight(res, (last, [f1, f2]) => {
            if (!last[0] || !last[1]) {
                last[0] = last[0] || f1;
                last[1] = last[1] || f2;
            }
            return last
        }, [0, 0]);

        if (last[0] === i1) {
            res.push([0, i2]);
        } else if (last[1] === i2) {
            res.push([i1, 0]);
        } else {
            res.push([i1, i2]);
        }
        return res;
    }
}