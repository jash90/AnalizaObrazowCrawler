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



const testPath1 = "test1.jpeg";
const testPath2 = "test2.jpeg";




var main = async function () {
    downloadAllFile();
    const image1 = "images/img1.jpeg";
    const image2 = "images/img122.jpeg";
    await similarity(image1, image2);
}

main()