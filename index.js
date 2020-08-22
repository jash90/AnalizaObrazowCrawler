const Algorithms = require("./algoritms");
const Utils = require("./utils");

var main = async function () {
    try {
        await Utils.downloadAllFile();
        await Utils.sendFilesToDatabase();
        // const image1 = "images/img1.jpeg";
        // const image2 = "images/img122.jpeg";
        // await Algorithms.similarity(image1, image2);

    } catch (error) {
        console.log(error);
    }
}

main()