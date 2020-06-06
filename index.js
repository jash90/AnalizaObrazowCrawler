var request = require("request");
var nodeparse = require("node-html-parser");
var fs = require('fs');
var url = require('url');

var download = function (uri, filename, callback) {
    request.head(uri, function () {
        request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
    });
};

var main = function () {
    var downloadurl = "http://192.168.64.2/gallery1.html";

    const baseUrl = url.parse(downloadurl).hostname;



    request(downloadurl, (err, res, body) => {
        const root = nodeparse.parse(String(res.body));

        if (!fs.existsSync('images')) {
            fs.mkdirSync("images");
        }


        root.querySelectorAll('img').forEach((img, index) => {
            download("http://" + baseUrl +"/"+ img.rawAttributes.src, "images/img" + Number(index + 1) + ".jpeg", function () {
                console.log('done img' + Number(index + 1) + ".jpeg");
            });
        })
    })
}

main()