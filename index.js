const Utils = require("./utils");

var main = async function () {
    try {
        await Utils.downloadAllFile();
        const images = await Utils.sendFilesToDatabase();
        const similarities = await Utils.sendPatternSimilarity();
        const algorithms = await Utils.sendAlgorithms();
        await Utils.generatedResultsAndSendResult(images, similarities, algorithms);

    } catch (error) {
        console.log(error);
    }
}

main()