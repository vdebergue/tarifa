var Q = require('q'),
    find = require('findit'),
    rimraf = require('rimraf'),
    mkdirp = require('mkdirp'),
    path = require('path'),
    print = require('../../../../lib/helper/print'),
    fs = require('fs'),
    settings = require('../../../../lib/settings'),
    inferJavaClassNameFromProductName = require('../../../../lib/android/infer-classname'),
    AndroidManifestBuilder = require('../../../../lib/xml/android/AndroidManifest.xml');

module.exports = function (msg) {
    var defer = Q.defer();
    var cwd = process.cwd();
    var androidConfs = msg.localSettings.configurations.android;
    var androidName = androidConfs[msg.configuration]['product_name'] || androidConfs['default']['product_name'] || androidConfs['name'];
    var androidId = msg.localSettings.configurations.android[msg.configuration]['id'] || msg.localSettings.id;
    var srcPath = path.join(cwd, settings.cordovaAppPath, '/platforms/android/src/');
    var finder = find(path.join(cwd, settings.cordovaAppPath, '/platforms/android/src/'));
    var javaActivityTmpl = fs.readFileSync(path.join(__dirname, 'activity.java.tmpl'), 'utf-8');
    var androidManifestXmlPath = path.join(cwd, settings.cordovaAppPath, 'platforms/android/AndroidManifest.xml');
    var asbPath = path.join(srcPath, msg.localSettings.id.replace(/\./g, '/'));

    var currentActivityFile = path.join(
        srcPath,
        androidId.replace(/\./g, '/'),
        inferJavaClassNameFromProductName(androidName) + '.java'
    );

    rimraf.sync(currentActivityFile);

    var emptyFolder = fs.readdirSync(path.dirname(currentActivityFile)).length === 0;
    if(emptyFolder) fs.rmdirSync(path.dirname(currentActivityFile));

    mkdirp(asbPath, function (err) {
        if (err) {
            defer.reject("unable to create package " + asbPath);
        }
        else {
            var inferedName = inferJavaClassNameFromProductName(msg.localSettings.name);
            var activity = javaActivityTmpl.replace(/\$PACKAGE_NAME/, msg.localSettings.id).replace(/\$APP_NAME/, inferedName);
            fs.writeFileSync(path.join(asbPath, inferedName + '.java'), activity);
            AndroidManifestBuilder.setActivityInfo(androidManifestXmlPath, inferedName, msg.localSettings.id);
            defer.resolve(msg);
            if(msg.verbose)
                print.success('reset android cordova activity');
        }
    });
    return defer.promise;
};

