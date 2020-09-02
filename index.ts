import Utils from "./utils"
import axios from "./axios";


async function main() {
    try {
        //await Utils.downloadAllFile();
        const images = await Utils.sendFilesToDatabase();
        const similarities = await Utils.sendPatternSimilarity();
        const algorithms = await Utils.sendAlgorithms();

        // const responseImage = await axios.get("images");
        // var images = responseImage.data;
        // images = images.slice(0, 2);
        // const responseSimilarity = await axios.get('similarities');
        // const similarities = responseSimilarity.data;
        // const responseAlgorithms = await axios.get('algorithms');
        // const algorithms = responseAlgorithms.data;

        await Utils.generatedResultsAndSendResult(images, similarities, algorithms);
        console.log(images, similarities, algorithms);

    } catch (error) {
        console.log(error);
    }

}

main();
