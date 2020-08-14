const MathAlgoritm = require("./math");
const flatMap = require('array.prototype.flatmap');
const Fs = require('fs');
const Jimp = require('jimp');
const { Image } = require('image-js');
const Sharp = require('sharp');

const testPath1 = "test1.jpeg";
const testPath2 = "test2.jpeg";


var oneSquare = function (name, image1, image2) {

    const defaultSquare = MathAlgoritm.getDefaultSquare(image1, image2);

    var sumSimilarity = 0;

    for (var i = 0; i < defaultSquare.width; i++)
        for (var j = 0; j < defaultSquare.height; j++) {
            sumSimilarity = sumSimilarity + MathAlgoritm.comparePixelInImages(image1, image2, defaultSquare.width + i, defaultSquare.height + j);
        }

    const similarity = (sumSimilarity / (defaultSquare.width * defaultSquare.height) * 100).toFixed(2);

    console.log(`One Square Compare : Similarity ${similarity} %`);

    return { name: `${name} one square`, similarity };
}

var fiveSquare = function (name, image1, image2) {

    const defaultSquare = MathAlgoritm.getDefaultSquare(image1, image2);

    var sumSimilarity = 0;

    for (var i = 0; i < defaultSquare.width; i++)
        for (var j = 0; j < defaultSquare.height; j++) {
            sumSimilarity = sumSimilarity + MathAlgoritm.comparePixelInImages(image1, image2, i, j) +
                MathAlgoritm.comparePixelInImages(image1, image2, defaultSquare.width + i, defaultSquare.height + j) +
                MathAlgoritm.comparePixelInImages(image1, image2, defaultSquare.width * 2 + i, j) +
                MathAlgoritm.comparePixelInImages(image1, image2, i, defaultSquare.height * 2 + j) +
                MathAlgoritm.comparePixelInImages(image1, image2, defaultSquare.width * 2 + i, defaultSquare.height * 2 + j);

        }

    const similarity = (sumSimilarity / (defaultSquare.width * defaultSquare.height * 5) * 100).toFixed(2);

    console.log(`Five Square Compare : Similarity ${similarity} %`);

    return { name: `${name} five square`, similarity };
}

var bigSquare = function (name, image1, image2) {

    const defaultSquare = MathAlgoritm.getBigDefaultSquare(image1, image2);

    var sumSimilarity = 0;

    for (var i = 0; i < defaultSquare.width; i++)
        for (var j = 0; j < defaultSquare.height; j++) {
            sumSimilarity = sumSimilarity + MathAlgoritm.comparePixelInImages(image1, image2, defaultSquare.width + i, defaultSquare.height + j);
        }

    const similarity = (sumSimilarity / (defaultSquare.width * defaultSquare.height) * 100).toFixed(2);

    console.log(`Big Square Compare : Similarity ${similarity} %`);

    return { name: `${name} big square`, similarity };
}

var random = function (name, image1, image2) {
    const square = MathAlgoritm.getBigDefaultSquare(image1, image2);

    const countPixels = square.width * square.height;

    const defaultSquare = MathAlgoritm.compareSquare(MathAlgoritm.getSize(image1.bitmap), MathAlgoritm.getSize(image2.bitmap));

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

    var sumSimilarity = 0;

    for (var i = 0; i < pixelsToCompare.length; i++) {
        sumSimilarity = sumSimilarity + MathAlgoritm.comparePixelInImages(image1, image2, pixelsToCompare[i].x, pixelsToCompare[i].y);
    }

    const similarity = (sumSimilarity / pixelsToCompare.length * 100).toFixed(2);

    console.log(`Random Compare : Similarity ${similarity} %`);

    return { name: `${name} random`, similarity };
}

var histogram = async function (name, imagePath, secondImagePath) {
    const image1 = await Image.load(imagePath);
    const image2 = await Image.load(secondImagePath);
    const image1Histogram = image1.getHistograms();
    const image2Histogram = image2.getHistograms();
    const countHistogram = flatMap(image1Histogram, (x) => x).length;

    var sumSimilarity = 0;

    for (var i = 0; i < image1Histogram.length; i++)
        for (var j = 0; j < image1Histogram[i].length; j++) {
            if (Math.abs(image1Histogram[i][j] - image2Histogram[i][j]) <= countHistogram * 0.1) {
                sumSimilarity = sumSimilarity + 1;
            }
        }

    const similarity = (sumSimilarity / countHistogram * 100).toFixed(2);

    console.log(`Histogram Compare : Similarity ${similarity} %`);

    return { name: `${name} histogram`, similarity };
}

var greyScale = async function (imagePath, secondImagePath) {
    await (await Jimp.read(imagePath)).grayscale().writeAsync(testPath1);
    await (await Jimp.read(secondImagePath)).grayscale().writeAsync(testPath2);

    await compareAll("Grey Scale", testPath1, testPath2);

    await Fs.unlinkSync(testPath1);
    await Fs.unlinkSync(testPath2);
}

var normalize = async function (imagePath, secondImagePath) {
    await (await Jimp.read(imagePath)).normalize().writeAsync(testPath1);
    await (await Jimp.read(secondImagePath)).normalize().writeAsync(testPath2);

    await compareAll("Normalize", testPath1, testPath2);

    await Fs.unlinkSync(testPath1);
    await Fs.unlinkSync(testPath2);
}

var blur = async function (imagePath, secondImagePath, r = 10) {
    await (await Jimp.read(imagePath)).blur(r).writeAsync(testPath1);
    await (await Jimp.read(secondImagePath)).blur(r).writeAsync(testPath2);

    await compareAll(`Blur ratio ${r}`, testPath1, testPath2);

    await Fs.unlinkSync(testPath1);
    await Fs.unlinkSync(testPath2);
}

var gaussianBlur = async function (imagePath, secondImagePath, r = 10) {
    await (await Jimp.read(imagePath)).gaussian(r).writeAsync(testPath1);
    await (await Jimp.read(secondImagePath)).gaussian(r).writeAsync(testPath2);

    await compareAll(`Gaussian Blur ratio ${r}`, testPath1, testPath2);

    await Fs.unlinkSync(testPath1);
    await Fs.unlinkSync(testPath2);
}

var dither = async function (imagePath, secondImagePath) {
    await (await Jimp.read(imagePath)).dither565().writeAsync(testPath1);
    await (await Jimp.read(secondImagePath)).dither565().writeAsync(testPath2);

    await compareAll(`Dither`, testPath1, testPath2);

    await Fs.unlinkSync(testPath1);
    await Fs.unlinkSync(testPath2);
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

    await Fs.unlinkSync(testPath1);
    await Fs.unlinkSync(testPath2);
}

var binary = async function (imagePath, secondImagePath) {
    await (await Jimp.read(imagePath)).rgba(false).greyscale().contrast(1).posterize(2).writeAsync(testPath1);

    await (await Jimp.read(secondImagePath)).rgba(false).greyscale().contrast(1).posterize(2).writeAsync(testPath2);

    await compareAll(`Binary`, testPath1, testPath2);

    await Fs.unlinkSync(testPath1);
    await Fs.unlinkSync(testPath2);
}

var sharpen = async function (imagePath, secondImagePath) {
    await Sharp(imagePath).sharpen(1, 1, 1).jpeg({
        quality: 100
    }).toFile(testPath1);
    await Sharp(secondImagePath).sharpen(1, 1, 1).jpeg({
        quality: 100
    }).toFile(testPath2);

    await compareAll(`Sharpen`, testPath1, testPath2);

    await Fs.unlinkSync(testPath1);
    await Fs.unlinkSync(testPath2);
}

var normal = async function (imagePath, secondImagePath) {
    await compareAll(`Normal`, imagePath, secondImagePath);
}

var compareAll = async function (name, imagePath, secondImagePath) {
    const image1 = await Jimp.read(imagePath);
    const image2 = await Jimp.read(secondImagePath);

    console.log(`[ ${name} ]`);
    console.log(oneSquare(name, image1, image2));
    console.log(fiveSquare(name, image1, image2));
    console.log(bigSquare(name, image1, image2));
    console.log(random(name, image1, image2));
    console.log(await histogram(name, imagePath, secondImagePath));
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

module.exports = {
    oneSquare, fiveSquare, bigSquare, random, histogram, compareAll, greyScale, normalize, blur, gaussianBlur, dither, removeNoise, binary, sharpen, normal, similarity
};