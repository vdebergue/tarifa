var Q = require('q'),
    path = require('path'),
    mkdirp = require('mkdirp'),
    tarifaFile = require('../../lib/tarifa-file'),
    pathHelper = require('../../lib/helper/path'),
    settings = require('../../lib/settings'),
    colorHelper = require('../../lib/helper/color'),
    generateIcons = require('../../lib/cordova/icon').generate,
    generateIconsFromFile = require('../../lib/cordova/icon').generateFromFile,
    generateSplashscreens = require('../../lib/cordova/splashscreen').generate,
    generateSplashscreensFromFile = require('../../lib/cordova/splashscreen').generateFromFile,
    createFolders = require('../../lib/cordova/assets').createFolders;

function generate(color, config, f, verbose) {
    config = config || 'default';
    var root = pathHelper.root();
    if(!colorHelper.validate(color)) return Q.reject('invalid color!');

    return tarifaFile.parse(root).then(function (localSettings) {
        var platforms = localSettings.platforms.filter(function (platform) {
            return platform !== 'web';
        });
        return Q.all(createFolders(root, platforms, config)).then(function () {
            return f(color, root, platforms, config, verbose);
        });
    });
}

function generateFromFile(file, config, f, verbose) {
    config = config || 'default';
    var root = pathHelper.root();

    return tarifaFile.parse(root).then(function (localSettings) {
        var platforms = localSettings.platforms.filter(function (platform) {
            return platform !== 'web';
        });
        return Q.all(createFolders(root, platforms, config)).then(function () {
            return f(file, root, platforms, config, verbose);
        });
    });
}

module.exports.generateIcons = function (color, config, verbose) {
    return generate(color, config, generateIcons, verbose);
};

module.exports.generateIconsFromFile = function (file, config, verbose) {
    return generateFromFile(file, config, generateIconsFromFile, verbose);
};

module.exports.generateSplashscreens = function (color, config, verbose) {
    return generate(color, config, generateSplashscreens, verbose);
};

module.exports.generateSplashscreensFromFile = function (file, config, verbose) {
    return generateFromFile(file, config, generateSplashscreensFromFile, verbose);
};
