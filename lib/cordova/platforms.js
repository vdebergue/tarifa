var path = require('path'),
    cordova_platform_add = require('cordova/src/platform').add,
    cordova_platform_remove = require('cordova/src/platform').remove,
    cordova_util = require('cordova/src/util'),
    cordova_hooker = require('cordova/src/hooker'),
    Q = require('q'),
    chalk = require('chalk'),
    os = require('os'),
    settings = require('../settings');

function addPlatforms (platforms, verbose) {
    var cwd = process.cwd();

    process.chdir(path.join(cwd, settings.cordovaAppPath));

    var projectRoot = cordova_util.cdProjectRoot(),
        hooks = new cordova_hooker(projectRoot),
        opts = {
            platforms: platforms,
            spawnoutput: {
                stdio: 'ignore'
            }
        };

    return cordova_platform_add(hooks, projectRoot, platforms, opts).then(function (err) {
        process.chdir(cwd);
        if(err) return Q.reject(err);
        if (verbose) {
            platforms.forEach(function (target) {
                console.log(chalk.green('✔') + ' cordova platform ' + target + ' added');
            });
        }
        return platforms;
    });
}

function removePlatforms (platforms, verbose) {
    var cwd = process.cwd();

    process.chdir(path.join(cwd, settings.cordovaAppPath));

    var projectRoot = cordova_util.cdProjectRoot(),
    hooks = new cordova_hooker(projectRoot),
    opts = {
        platforms: platforms,
        spawnoutput: {
            stdio: 'ignore'
        }
    };

    return cordova_platform_remove(hooks, projectRoot, platforms, opts).then(function (err) {
        process.chdir(cwd);
        if(err) return Q.reject(err);
        if (verbose) {
            platforms.forEach(function (target) {
                console.log(chalk.green('✔') + ' cordova platform ' + target + ' removed');
            });
        }
        return platforms;
    });
}

function listPlatforms(verbose) {
    var cwd = process.cwd();

    process.chdir(path.join(cwd, settings.cordovaAppPath));

    var projectRoot = cordova_util.cdProjectRoot(),
    platforms_on_fs = cordova_util.listPlatforms(projectRoot);

    return Q.resolve(platforms_on_fs).then(function(platforms) {
        if (verbose) {
            console.log(chalk.green(platforms.join(', ')));
        }
        process.chdir(cwd);
        return platforms;
    });
}

var isAvailableOnHost = function (platform) {
    if(!settings.os_platforms[platform]) return Q.reject("platform name does not exist");
    var available = settings.os_platforms[platform].indexOf(os.platform()) > -1;
    return available ? Q.resolve() : Q.reject("platform not available on your os");
};

module.exports = {
    add: addPlatforms,
    remove: removePlatforms,
    list: listPlatforms,
    isAvailableOnHost: isAvailableOnHost
};