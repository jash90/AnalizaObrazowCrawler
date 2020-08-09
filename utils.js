const downloadUrl = "http://192.168.64.2/gallery1.html";

const baseUrl = url.parse(downloadUrl).hostname;

const defaultFolderImage = "images";

const downloadSingleFile = function (uri, filename, callback) {
    request.head(uri, function () {
        request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
    });
};

const downloadAllFile = function () {
    if (fs.existsSync(defaultFolderImage) && fs.lstatSync(defaultFolderImage).size > 1000) {
        return;
    }


    request(downloadUrl, (err, res, body) => {
        const root = nodeparse.parse(String(res.body));

        if (!fs.existsSync(defaultFolderImage)) {
            fs.mkdirSync(defaultFolderImage);
        }


        root.querySelectorAll('img').forEach((img, index) => {
            downloadSingleFile("http://" + baseUrl + "/" + img.rawAttributes.src, `${defaultFolderImage}/img` + Number(index + 1) + ".jpeg", function () {
                console.log('done img' + Number(index + 1) + ".jpeg");
            });
        })

        console.log("Download Complete.");
    })
}

module.exports = {downloadAllFile};