var request = require("request");
var nodeparse = require("node-html-parser");
var fs = require('fs');
var url = require('url');

var Jimp = require('jimp');

const downloadUrl = "http://192.168.64.2/gallery1.html";

const baseUrl = url.parse(downloadUrl).hostname;

const defaultFolderImage = "images";

const downloadSingleFile = function (uri, filename, callback) {
    request.head(uri, function () {
        request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
    });
};

const downloadAllFile = function () {
    request(downloadUrl, (err, res, body) => {
        const root = nodeparse.parse(String(res.body));

        if (!fs.existsSync(defaultFolderImage)) {
            fs.mkdirSync(defaultFolderImage);
        }


        root.querySelectorAll('img').forEach((img, index) => {
            download("http://" + baseUrl + "/" + img.rawAttributes.src, `${defaultFolderImage}/img` + Number(index + 1) + ".jpeg", function () {
                console.log('done img' + Number(index + 1) + ".jpeg");
            });
        })
    })
}

const calculateSize = function (bitmap) {
    return { width: bitmap.width, height: bitmap.height };
}

const calculateSquare = function (size) {
    return { width: Math.floor(size.width / 3), height: Math.floor(size.height / 3) };
}

const compareSquare = function (square1, square2) {
    if (square1.width < square2.width && square1.height < square2.height)
        return square1;

    if (square1.width > square2.width && square1.height > square2.height)
        return square2;

    return square1;
}

const getColorPixelFromImage = function (image, width, height) {
    return Jimp.intToRGBA(image.getPixelColor(width, height));
}

const compareRGBA = function (color1, color2) {
    if (Math.abs(color1.r - color2.r) > 30)
        return false
    if (Math.abs(color1.g - color2.g) > 30)
        return false

    if (Math.abs(color1.b - color2.b) > 30)
        return false

    if (Math.abs(color1.a - color2.a) > 30)
        return false

    return true;
}

var oneSquare = async function (imagePath, secondImagePath) {
    const image1 = await Jimp.read(imagePath);
    const image2 = await Jimp.read(secondImagePath);

    const image1Size = calculateSize(image1.bitmap);
    const image2Size = calculateSize(image2.bitmap);

    const square1 = calculateSquare(image1Size);

    const square2 = calculateSquare(image2Size);

    const defaultSquare = compareSquare(square1, square2);

    var sumCompare = 0;

    for (var i = 0; i < defaultSquare.width; i++)
        for (var j = 0; j < defaultSquare.height; j++) {
            const color1 = getColorPixelFromImage(image1, square1.width + i, square1.height + j);
            const color2 = getColorPixelFromImage(image2, square2.width + i, square2.height + j);

            if (compareRGBA(color1, color2)) {
                sumCompare += 1;
            }
        }

    console.log(sumCompare, defaultSquare.width * defaultSquare.height);
}


var main = function () {
    oneSquare("images/img2.jpeg", "images/img4.jpeg");

}

main()