var fs = require('fs'),
    Q = require('q'),
    format = require('util').format,
    xml2js = require('xml2js');

function parse(file) {
    var xml = fs.readFileSync(file, 'utf-8'),
        defer = Q.defer();

    xml2js.parseString(xml, function (err, result) {
        if(err) return defer.reject(err);
        defer.resolve(result);
    });
    return defer.promise;
}

function has_format(xml, filePath) {
    var defer = Q.defer(),
        err = new Error(format('%s has a wrong format, searching for Deployment xml root', filePath));

    if(xml.Deployment && xml.Deployment.App && xml.Deployment.App[0].Tokens[0].PrimaryToken[0].TemplateFlip[0].Title)
        defer.resolve(xml);
    else defer.reject(err);
    return defer.promise;
}

function get(filePath) {
    return parse(filePath).then(function (xml) {
        return has_format(xml, filePath).then(function (xml) {
            return {
                title: xml.Deployment.App[0].Tokens[0].PrimaryToken[0].TemplateFlip[0].Title[0],
                guid: xml.Deployment.App[0].$.ProductID.replace(/\{/g, '').replace(/\}/g, '')
            };
        });
    });
}

function set(file, title, guid) {
    return parse(file).then(function (xml) {
        return has_format(xml, file).then(function () {
            xml.Deployment.App[0].Tokens[0].PrimaryToken[0].TemplateFlip[0].Title[0] = title;
            xml.Deployment.App[0].$.Title = title;
            xml.Deployment.App[0].$.ProductID = format('{%s}', guid);
            return xml;
        });
    }).then(build(file));
}

function build(file) {
    return function (xml) {
        var builder = new xml2js.Builder({
            renderOpts: { pretty: true, indent: '    ', newline: '\n' },
            headless: true
        });
        var xmlString = builder.buildObject(xml);
        fs.writeFileSync(file, "<?xml version='1.0' encoding='utf-8'?>\n" + xmlString, 'utf-8');
    };
}

module.exports.set = set;
module.exports.get = get;
