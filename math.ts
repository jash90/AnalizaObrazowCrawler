import Jimp from "jimp";

export default class MathImage {

public static getSize = function (bitmap:any) {
    return {
        width: bitmap.width,
        height: bitmap.height
    };
}

public static calculateSquare = function (size:any) {
    return {
        width: Math.floor(size.width / 3),
        height: Math.floor(size.height / 3)
    };
}

public static calculateBigSquare = function (size:any) {
    return {
        width: Math.floor(size.width / 2),
        height: Math.floor(size.height / 2)
    };
}

public static compareSquare = function (square1:any, square2:any) {
    if (square1.width < square2.width && square1.height < square2.height)
        return square1;

    if (square1.width > square2.width && square1.height > square2.height)
        return square2;

    return square1;
}

public static getColorPixelFromImage = function (image:any, x:number, y:number) {
    return Jimp.intToRGBA(image.getPixelColor(x, y));
}

public static getDefaultSquare = function (image1:any, image2:any) {
    return MathImage.compareSquare(MathImage.calculateSquare(MathImage.getSize(image1.bitmap)), MathImage.calculateSquare(MathImage.getSize(image2.bitmap)));
}

public static getBigDefaultSquare = function (image1:any, image2:any) {
    return MathImage.compareSquare(MathImage.calculateBigSquare(MathImage.getSize(image1.bitmap)), MathImage.calculateBigSquare(MathImage.getSize(image2.bitmap)));
}

public static compareRGBA = function (color1:any, color2:any) {
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

public static comparePixelInImages = function (image1:any, image2:any, x:number, y:number) {
    const color1 = MathImage.getColorPixelFromImage(image1, x, y);
    const color2 = MathImage.getColorPixelFromImage(image2, x, y);

    if (MathImage.compareRGBA(color1, color2)) {
        return 1;
    } else {
        return 0;
    }
}

}