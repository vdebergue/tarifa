var Q = require('q'),
    path = require('path'),
    fs = require('q-io/fs'),
    format = require('util').format,
    print = require('../../../../lib/helper/print'),
    settings = require('../../../../lib/settings');

module.exports = function (msg) {
    var product_name = msg.localSettings.configurations.android[msg.configuration]['product_file_name'],
        out_dir = path.join(process.cwd(), settings.cordovaAppPath, 'platforms', 'android', 'build', 'apk'),
        apk_name = msg.localSettings.mode ? 'android-release.apk' : 'android-debug-unaligned.apk';

    return fs.list(out_dir).then(function (files) {
        var apks = files.filter(function (file) { return file.match(/\.apk/); });
        if(apks.indexOf(apk_name) < -1) print.warning('apk %s not found in folder %s', apk_name, out_dir);
        return fs.copy(path.resolve(out_dir, apk_name), path.resolve(out_dir, '..', '..', product_name + '.apk'));
    }).then(function () {
        if(msg.verbose) print.success('copy apk %s.apk to %s', product_name, out_dir);
        return msg;
    });
};
