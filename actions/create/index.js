var Q = require('q'),
    spinner = require("char-spinner"),
    inquirer = require('inquirer'),
    chalk = require('chalk'),
    cordova = require('cordova'),
    fs = require('fs'),
    path = require('path'),
    argsHelper = require('../../lib/args'),

    mainQuestions = [
        require('./questions/path'),
        require('./questions/id'),
        require('./questions/name'),
        require('./questions/description'),
        require('./questions/platforms'),
        require('./questions/plugins'),
        require('./questions/deploy')
    ],

    deployQuestions = [
        require('./questions/deploy/apple_id.js'),
        require('./questions/deploy/apple_password.js'),
        require('./questions/deploy/hockeyapp_user.js'),
        require('./questions/deploy/hockeyapp_token.js'),
        require('./questions/deploy/keystore_path.js'),
        require('./questions/deploy/keystore_alias.js')
    ],

    tasks = [
        require('./tasks/tarifa'),
        require('./tasks/cordova'),
        require('./tasks/platforms'),
        require('./tasks/plugins'),
        require('./tasks/ant-properties')
    ],

    verbose = false;

function askQuestions(questions, type) {
    return function (answers) {
        return questions.reduce(function (promise, question) {
            var d = Q.defer();

            promise.then(function (val) {
                if (val.platforms && question.dependency && val.platforms.indexOf(question.dependency) < 0) {
                    // pass to the next question
                    d.resolve(val);
                }
                else {
                    if (val.options.verbose){
                        var helpPath =  path.join(__dirname, 'help', type, question.name + '.txt');
                        if(fs.existsSync(helpPath))
                            console.log(fs.readFileSync(helpPath, 'utf-8'));
                    }
                    inquirer.prompt([question], function (answer) {
                        val[question.name] = answer[question.name];
                        d.resolve(val);
                    });
                }
            });
            return d.promise;
        }, Q.resolve(answers));
    };
}

function printBanner() {
    console.log(
        chalk.bold(chalk.red('t')
        + chalk.green('a')
        + chalk.magenta('r')
        + chalk.cyan('i')
        + chalk.yellow('f')
        + chalk.blue('a'))
        + '\n'
    );
}

function create(argv) {

    if(argsHelper.matchSingleOptions(argv, 'h', 'help')) {
        console.log(fs.readFileSync(path.join(__dirname, 'usage.txt'), 'utf-8'));
        return Q.resolve();
    }

    if(argsHelper.matchSingleOptions(argv, 'V', 'verbose')) {
        verbose = true;
    } else if(argv.length > 1) {
        console.log(fs.readFileSync(path.join(__dirname, 'usage.txt'), 'utf-8'));
        return Q.resolve();
    }

    if(verbose) printBanner();

    return askQuestions(mainQuestions, '')({ options : { verbose : verbose } })
        .then(function (resp) {
            if(resp.deploy) return askQuestions(deployQuestions, 'deploy')(resp);
            else return resp;
        })
        .then(function (resp) {
            console.log();
            spinner();
            return tasks.reduce(function (val, task){ return Q.when(val, task); }, resp);
        });
};

module.exports = create;
