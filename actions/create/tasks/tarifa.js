var Q = require('q'),
    fs = require('fs'),
    exec = require('child_process').exec,
    path = require('path'),
    chalk = require('chalk'),
    ncp = require('ncp').ncp,
    tarifaFile = require('../../../lib/tarifa-file'),
    settings = require('../../../lib/settings');

function log(response) {
    if (response.options.verbose)
        console.log(chalk.green('✔') + ' project folders created ' + response.path);
    return Q.resolve(response);
}

function copyWWWProject(response) {
    // create tarifa web app folder
    fs.mkdirSync(path.join(response.path, settings.webAppPath));

    // copy template project to web app folder
    ncp.limit = 42;
    var source = path.join(__dirname, '../../../template/project');
    var destination = path.join(response.path, settings.webAppPath);
    var defer = Q.defer();

    ncp(source, destination, function (err) {
        if (err) return defer.reject(err);
        if (response.options.verbose)
            console.log(chalk.green('✔') + ' copied template www project');
        defer.resolve(response);
    });

    return defer.promise;
}

function npm_install(response) {
    var destination = path.join(response.path, settings.webAppPath);
    var cwd = process.cwd();
    var defer = Q.defer();

    process.chdir(destination);

    exec('npm install',
        function (error, stdout, stderr) {
            process.chdir(cwd);
            if (error !== null) {
                defer.reject(error);
                console.log('npm install error in project' + error);
                return;
            }
            if (response.options.verbose)
                console.log(chalk.green('✔') + ' npm install www project');
            defer.resolve(response);
    });
    return defer.promise;
}

module.exports = function (response) {
    if(!fs.existsSync(response.path)) fs.mkdirSync(response.path);
    return copyWWWProject(response)
        .then(npm_install)
        .then(tarifaFile.createFileFromResponse)
        .then(log);
};
