
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

module.exports = {
    getDefaultSquare,compareImages,calculateSize,calculateBigSquare, getBigDefaultSquare
}