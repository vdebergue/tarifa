var Q = require('q'),
    path = require('path'),
    chalk = require('chalk'),
    exec = require('child_process').exec,
    os = require('os'),
    print = require('../helper/print'),
    settings = require('../settings');

// TODO we need to do more, revove also all binary stuff and generated apps!
function clean(platform, verbose) {
    return function () {
        if(platform === 'web') return Q.resolve();
        var defer = Q.defer(),
            cmd = os.platform() === 'win32' ? 'clean' : './clean',
            cwd = path.join(process.cwd(), settings.cordovaAppPath, 'platforms', platform, 'cordova'),
            options = {
                cwd: cwd,
                timeout : 0,
                maxBuffer: 1024 * 4000
            };

        var child = exec(cmd, options, function (err, stdout, stderr) {
            if(err) {
                if(verbose) {
                    print.error('command: clean');
                    print.error('command stderr ' + stderr);
                }
                defer.reject('command stderr ' + err);
                return;
            }
            if(verbose)
                print.success(' cleaning platform %s', platform);
            defer.resolve();
        });

        if (verbose) child.stdout.pipe(process.stdout);

        return defer.promise;
    }
};

module.exports = function (platforms, verbose) {
    return platforms.reduce(function (promise, platform) {
        return promise.then(clean(platform, verbose));
    }, Q.resolve());
};
