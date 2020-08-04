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

const calculateBigSquare = function (size) {
    return { width: Math.floor(size.width / 2), height: Math.floor(size.height / 2) };
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

const getDefaultSquare = function (image1, image2) {

    const image1Size = calculateSize(image1.bitmap);
    const image2Size = calculateSize(image2.bitmap);

    const square1 = calculateSquare(image1Size);

    const square2 = calculateSquare(image2Size);

    return compareSquare(square1, square2);
}

const getBigDefaultSquare = function (image1, image2) {

    const image1Size = calculateSize(image1.bitmap);
    const image2Size = calculateSize(image2.bitmap);

    const square1 = calculateBigSquare(image1Size);

    const square2 = calculateBigSquare(image2Size);

    return compareSquare(square1, square2);
}

const compareImages = function (image1, image2, x, y, sumCompare) {
    const color1 = getColorPixelFromImage(image1, x, y);
    const color2 = getColorPixelFromImage(image2, x, y);

    if (compareRGBA(color1, color2)) {
        return 1;
    } else {
        return 0;
    }
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

    const defaultSquare = getDefaultSquare(image1, image2);

    var sumCompare = 0;

    for (var i = 0; i < defaultSquare.width; i++)
        for (var j = 0; j < defaultSquare.height; j++) {
            sumCompare = sumCompare + compareImages(image1, image2, defaultSquare.width + i, defaultSquare.height + j);
        }

    return `One Square Compare : Similarity ${(sumCompare / (defaultSquare.width * defaultSquare.height) * 100).toFixed(2)} %`;
}

var fiveSquare = async function (imagePath, secondImagePath) {
    const image1 = await Jimp.read(imagePath);
    const image2 = await Jimp.read(secondImagePath);

    const defaultSquare = getDefaultSquare(image1, image2);

    var sumCompare = 0;

    for (var i = 0; i < defaultSquare.width; i++)
        for (var j = 0; j < defaultSquare.height; j++) {
            sumCompare = sumCompare + compareImages(image1, image2, i, j, sumCompare) +
                compareImages(image1, image2, defaultSquare.width + i, defaultSquare.height + j, sumCompare) +
                compareImages(image1, image2, defaultSquare.width * 2 + i, j, sumCompare) +
                compareImages(image1, image2, i, defaultSquare.height * 2 + j, sumCompare) +
                compareImages(image1, image2, defaultSquare.width * 2 + i, defaultSquare.height * 2 + j, sumCompare);

        }

    return `Five Square Compare : Similarity ${(sumCompare / (defaultSquare.width * defaultSquare.height * 5) * 100).toFixed(2)} %`;
}

var bigSquare = async function (imagePath, secondImagePath) {
    const image1 = await Jimp.read(imagePath);
    const image2 = await Jimp.read(secondImagePath);

    const defaultSquare = getBigDefaultSquare(image1, image2);

    var sumCompare = 0;

    for (var i = 0; i < defaultSquare.width; i++)
        for (var j = 0; j < defaultSquare.height; j++) {
            sumCompare = sumCompare + compareImages(image1, image2, defaultSquare.width + i, defaultSquare.height + j, sumCompare);
        }

    return `Big Square Compare : Similarity ${(sumCompare / (defaultSquare.width * defaultSquare.height) * 100).toFixed(2)} %`;
}

var main = async function () {
    console.log(await oneSquare("images/img2.jpeg", "images/img4.jpeg"));
    console.log(await fiveSquare("images/img2.jpeg", "images/img4.jpeg"));
    console.log(await bigSquare("images/img2.jpeg", "images/img4.jpeg"));

}

main()