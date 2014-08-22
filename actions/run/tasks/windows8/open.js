var Q = require('q'),
    path = require('path'),
    exec = require('child_process').exec,
    print = require('../../../../lib/helper/print'),
    settings = require('../../../../lib/settings');

module.exports = function (conf) {
    var defer = Q.defer();
    var options = {
    	cwd: path.resolve('app/platforms/windows8/cordova'),
        timeout : 0,
        maxBuffer: 1024 * 400
    };
    var cmd = 'run.bat --nobuild';
    var child = exec(cmd, options, function (err, stdout, stderr) {
        if(err) {
            if(conf.verbose) {
                print.error('command: %s', cmd);
                print.error('run.bat --nobuild stderr %s', stderr);
            }
            defer.reject('run.bat --nobuild ' + err);
            return;
        }
        defer.resolve(conf);
    });

    if (conf.verbose) child.stdout.pipe(process.stdout);

    return defer.promise;
};