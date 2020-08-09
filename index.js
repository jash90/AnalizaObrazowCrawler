var request = require("request");
var nodeparse = require("node-html-parser");
var fs = require('fs');
var url = require('url');

var Jimp = require('jimp');

const {
    Image
} = require('image-js');

var flatMap = require('array.prototype.flatmap');

const sharp = require('sharp');

const downloadUrl = "http://192.168.64.2/gallery1.html";

const baseUrl = url.parse(downloadUrl).hostname;

const defaultFolderImage = "images";

const testPath1 = "test1.jpeg";
const testPath2 = "test2.jpeg";

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

const calculateSize = function (bitmap) {
    return {
        width: bitmap.width,
        height: bitmap.height
    };
}

const calculateSquare = function (size) {
    return {
        width: Math.floor(size.width / 3),
        height: Math.floor(size.height / 3)
    };
}

const calculateBigSquare = function (size) {
    return {
        width: Math.floor(size.width / 2),
        height: Math.floor(size.height / 2)
    };
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
    return compareSquare(calculateSquare(calculateSize(image1.bitmap)), calculateSquare(calculateSize(image2.bitmap)));
}

const getBigDefaultSquare = function (image1, image2) {
    return compareSquare(calculateBigSquare(calculateSize(image1.bitmap)), calculateBigSquare(calculateSize(image2.bitmap)));
}

const compareImages = function (image1, image2, x, y) {
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

var oneSquare = function (image1, image2) {

    const defaultSquare = getDefaultSquare(image1, image2);

    var sumCompare = 0;

    for (var i = 0; i < defaultSquare.width; i++)
        for (var j = 0; j < defaultSquare.height; j++) {
            sumCompare = sumCompare + compareImages(image1, image2, defaultSquare.width + i, defaultSquare.height + j);
        }

    return `One Square Compare : Similarity ${(sumCompare / (defaultSquare.width * defaultSquare.height) * 100).toFixed(2)} %`;
}

var fiveSquare = function (image1, image2) {

    const defaultSquare = getDefaultSquare(image1, image2);

    var sumCompare = 0;

    for (var i = 0; i < defaultSquare.width; i++)
        for (var j = 0; j < defaultSquare.height; j++) {
            sumCompare = sumCompare + compareImages(image1, image2, i, j) +
                compareImages(image1, image2, defaultSquare.width + i, defaultSquare.height + j) +
                compareImages(image1, image2, defaultSquare.width * 2 + i, j) +
                compareImages(image1, image2, i, defaultSquare.height * 2 + j) +
                compareImages(image1, image2, defaultSquare.width * 2 + i, defaultSquare.height * 2 + j);

        }

    return `Five Square Compare : Similarity ${(sumCompare / (defaultSquare.width * defaultSquare.height * 5) * 100).toFixed(2)} %`;
}

var bigSquare = function (image1, image2) {

    const defaultSquare = getBigDefaultSquare(image1, image2);

    var sumCompare = 0;

    for (var i = 0; i < defaultSquare.width; i++)
        for (var j = 0; j < defaultSquare.height; j++) {
            sumCompare = sumCompare + compareImages(image1, image2, defaultSquare.width + i, defaultSquare.height + j);
        }

    return `Big Square Compare : Similarity ${(sumCompare / (defaultSquare.width * defaultSquare.height) * 100).toFixed(2)} %`;
}

var random = function (image1, image2) {
    const square = getBigDefaultSquare(image1, image2);

    const countPixels = square.width * square.height;

    const defaultSquare = compareSquare(calculateSize(image1.bitmap), calculateSize(image2.bitmap));

    let pixelsToCompare = [];
    var h = ['|', '/', '-', '\\'];
    var i = 0;
    while (pixelsToCompare.length < countPixels) {
        const x = Number((Math.random() * defaultSquare.width).toFixed(0));
        const y = Number((Math.random() * defaultSquare.height).toFixed(0));
        if (pixelsToCompare.filter(f => f.x == x && f.y == y).length < 1) {
            pixelsToCompare.push({
                x,
                y
            });
        }

        process.stdout.write(`\rLoading ${h[i++]} ${(pixelsToCompare.length / countPixels * 100).toFixed(2)}%    `);
        i &= h.length - 1;

    }

    process.stdout.write("\r");

    var sumCompare = 0;

    for (var i = 0; i < pixelsToCompare.length; i++) {
        sumCompare = sumCompare + compareImages(image1, image2, pixelsToCompare[i].x, pixelsToCompare[i].y);
    }

    return `Random Compare : Similarity ${(sumCompare / pixelsToCompare.length * 100).toFixed(2)} %`;
}

var histogram = async function (imagePath, secondImagePath) {
    const image1 = await Image.load(imagePath);
    const image2 = await Image.load(secondImagePath);
    const image1Histogram = image1.getHistograms();
    const image2Histogram = image2.getHistograms();
    const countHistogram = flatMap(image1Histogram, (x) => x).length;

    var sumCompare = 0;

    for (var i = 0; i < image1Histogram.length; i++)
        for (var j = 0; j < image1Histogram[i].length; j++) {
            if (Math.abs(image1Histogram[i][j] - image2Histogram[i][j]) <= countHistogram * 0.1) {
                sumCompare = sumCompare + 1;
            }
        }

    return `Histogram Compare : Similarity ${(sumCompare / countHistogram * 100).toFixed(2)} %`;
}

var compareAll = async function (name, imagePath, secondImagePath) {
    const image1 = await Jimp.read(imagePath);
    const image2 = await Jimp.read(secondImagePath);

    console.log(`[ ${name} ]`);
    console.log(oneSquare(image1, image2));
    console.log(fiveSquare(image1, image2));
    console.log(bigSquare(image1, image2));
    console.log(random(image1, image2));
    console.log(await histogram(imagePath, secondImagePath));
}

var greyScale = async function (imagePath, secondImagePath) {
    await (await Jimp.read(imagePath)).grayscale().writeAsync(testPath1);
    await (await Jimp.read(secondImagePath)).grayscale().writeAsync(testPath2);

    await compareAll("Grey Scale", testPath1, testPath2);

    await fs.unlinkSync(testPath1);
    await fs.unlinkSync(testPath2);
}

var normalize = async function (imagePath, secondImagePath) {
    await (await Jimp.read(imagePath)).normalize().writeAsync(testPath1);
    await (await Jimp.read(secondImagePath)).normalize().writeAsync(testPath2);

    await compareAll("Normalize", testPath1, testPath2);

    await fs.unlinkSync(testPath1);
    await fs.unlinkSync(testPath2);
}

var blur = async function (imagePath, secondImagePath, r = 10) {
    await (await Jimp.read(imagePath)).blur(r).writeAsync(testPath1);
    await (await Jimp.read(secondImagePath)).blur(r).writeAsync(testPath2);

    await compareAll(`Blur ratio ${r}`, testPath1, testPath2);

    await fs.unlinkSync(testPath1);
    await fs.unlinkSync(testPath2);
}

var gaussianBlur = async function (imagePath, secondImagePath, r = 10) {
    await (await Jimp.read(imagePath)).gaussian(r).writeAsync(testPath1);
    await (await Jimp.read(secondImagePath)).gaussian(r).writeAsync(testPath2);

    await compareAll(`Gaussian Blur ratio ${r}`, testPath1, testPath2);

    await fs.unlinkSync(testPath1);
    await fs.unlinkSync(testPath2);
}

var dither = async function (imagePath, secondImagePath) {
    await (await Jimp.read(imagePath)).dither565().writeAsync(testPath1);
    await (await Jimp.read(secondImagePath)).dither565().writeAsync(testPath2);

    await compareAll(`Dither`, testPath1, testPath2);

    await fs.unlinkSync(testPath1);
    await fs.unlinkSync(testPath2);
}

var removeNoise = async function (imagePath, secondImagePath) {
    await (await (await Jimp.read(imagePath)).color([{
        apply: 'desaturate',
        params: [90]
    }])).contrast(1).writeAsync(testPath1);
    await (await (await Jimp.read(secondImagePath)).color([{
        apply: 'desaturate',
        params: [90]
    }])).contrast(1).writeAsync(testPath2);


    await compareAll(`Remove noise`, testPath1, testPath2);

    await fs.unlinkSync(testPath1);
    await fs.unlinkSync(testPath2);
}

var binary = async function (imagePath, secondImagePath) {
    await (await Jimp.read(imagePath)).rgba(false).greyscale().contrast(1).posterize(2).writeAsync(testPath1);

    await (await Jimp.read(secondImagePath)).rgba(false).greyscale().contrast(1).posterize(2).writeAsync(testPath2);

    await compareAll(`Binary`, testPath1, testPath2);

    await fs.unlinkSync(testPath1);
    await fs.unlinkSync(testPath2);
}

var sharpen = async function (imagePath, secondImagePath) {
    await sharp(imagePath).sharpen(1, 1, 1).jpeg({
        quality: 100
    }).toFile(testPath1);
    await sharp(secondImagePath).sharpen(1, 1, 1).jpeg({
        quality: 100
    }).toFile(testPath2);

    await compareAll(`Sharpen`, testPath1, testPath2);

    await fs.unlinkSync(testPath1);
    await fs.unlinkSync(testPath2);
}

var normal = async function (imagePath, secondImagePath) {
    await compareAll(`Normal`, imagePath, secondImagePath);
}


var similarity = async function (imagePath, secondImagePath) {
    await greyScale(imagePath, secondImagePath);
    await normalize(imagePath, secondImagePath);
    await blur(imagePath, secondImagePath);
    await gaussianBlur(imagePath, secondImagePath);
    await dither(imagePath, secondImagePath);
    await removeNoise(imagePath, secondImagePath);
    await binary(imagePath, secondImagePath);
    await sharpen(imagePath, secondImagePath);
    await normal(imagePath, secondImagePath);
}



var main = async function () {
    downloadAllFile();
    const image1 = "images/img1.jpeg";
    const image2 = "images/img122.jpeg";
    await similarity(image1, image2);
}

main()