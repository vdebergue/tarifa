var Q = require('q'),
    spinner = require("char-spinner"),
    inquirer = require('inquirer'),
    chalk = require('chalk'),
    cordova = require('cordova-lib/src/cordova/cordova'),
    fs = require('q-io/fs'),
    path = require('path'),
    argsHelper = require('../../lib/helper/args'),
    print = require('../../lib/helper/print'),

    mainQuestions = [
        require('./questions/path'),
        require('./questions/id'),
        require('./questions/name'),
        require('./questions/description'),
        require('./questions/author_name'),
        require('./questions/author_email'),
        require('./questions/author_href'),
        require('./questions/platforms'),
        require('./questions/plugins'),
        require('./questions/www'),
        require('./questions/color'),
        require('./questions/deploy')
    ],

    deployQuestions = [
        require('./questions/deploy/apple_id'),
        require('./questions/deploy/apple_password'),
        require('./questions/deploy/has_apple_developer_team'),
        require('./questions/deploy/apple_developer_identity'),
        require('./questions/deploy/provisioning_profile_name'),
        require('./questions/deploy/keystore_path'),
        require('./questions/deploy/keystore_alias')
    ],

    isHockeyApp = [
        require('./questions/hockeyapp')
    ],

    hockeyAppQuestions = [
        require('./questions/hockeyapp/token')
    ],

    tasks = [
        require('./tasks/tarifa'),
        require('./tasks/cordova'),
        require('./tasks/platforms'),
        require('./tasks/fetch-provisioning-file'),
        require('./tasks/tarifa-file'),
        require('./tasks/git'),
        require('./tasks/plugins'),
        require('./tasks/assets')
    ];

function help(questionName, questionType, verbose) {
    if(!verbose) return Q.resolve();
    var helpFile = questionName + '.txt',
        helpPath =  path.join(__dirname, 'help', questionType, helpFile);

    return fs.isFile(helpPath).then(function (exists) {
        if(exists) return fs.read(helpPath).then(print);
    });
}

function ask(defer, question, type, value, verbose) {
    help(question.name, type, verbose).then(function () {
        inquirer.prompt([question], function (answer) {
            value[question.name] = answer[question.name];
            // linked question
            if(question.question && value[question.name]){
                return ask(
                    defer,
                    require(path.join(__dirname, question.question)),
                    type,
                    value,
                    verbose
                );
            }
            else {
                defer.resolve(value);
            }
        });
    });
}

function askQuestions(questions, type) {
    return function (answers) {
        return questions.reduce(function (promise, question) {
            var d = Q.defer();
            promise.then(function (val) {
                if (val.platforms
                    && question.dependency
                    && val.platforms.indexOf(question.dependency) < 0) {
                    // pass to the next question
                    d.resolve(val);
                }
                else {
                    // if the question is a function it must retrun a promise
                    // that means, the question needs to do some async tasks
                    // in order to populate the choices
                    if(typeof question === 'function') {
                        question(val, val.options.verbose).then(function (qst) {
                            ask(d, qst, type, val, val.options.verbose);
                        }, function (err) { print.error(err); });
                    }
                    else {
                        ask(d, question, type, val, val.options.verbose);
                    }
                }
            });
            return d.promise;
        }, Q.resolve(answers));
    };
}

function create(verbose) {
    if(verbose) print.banner();
    return askQuestions(mainQuestions, '')({ options : { verbose : verbose } })
        .then(function (resp) {
            if(resp.deploy) return askQuestions(deployQuestions, 'deploy')(resp);
            else return resp;
        })
        .then(function (resp) {
            return askQuestions(isHockeyApp, '')(resp);
        })
        .then(function (resp) {
            if (resp.hockeyapp) return askQuestions(hockeyAppQuestions, 'hockeyapp')(resp);
            else return resp;
        })
        .then(function (resp) {
            print();
            spinner();
            return tasks.reduce(function (val, task){
                return Q.when(val, task);
            }, resp);
        });
}

function action(argv) {
    var helpPath = path.join(__dirname, 'usage.txt');

    if(argsHelper.matchArgumentsCount(argv, [0])
            && argsHelper.checkValidOptions(argv, ['V', 'verbose'])) {
        return create(argsHelper.matchOption(argv, 'V', 'verbose'));
    }

    return fs.read(helpPath).then(print);
}

action.create = create;
module.exports = action;
