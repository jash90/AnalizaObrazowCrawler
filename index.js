const Algorithms = require("./algorithms");
const Utils = require("./utils");

const axios = require('axios').default;

var main = async function () {
    try {
         await Utils.downloadAllFile();
         const images = await Utils.sendFilesToDatabase();
         const similarities = await Utils.sendPatternSimilarity();
         const algorithms = await Utils.sendAlgorithms();
        
        // const responseImage = await axios.get('http://localhost:3091/images');
        // const images = responseImage.data;
        // const responseSimilarity = await axios.get('http://localhost:3091/similaritys');
        // const similarities = responseSimilarity.data;
        // const responseAlgorithms = await axios.get('http://localhost:3091/algorithms');
        // const algorithms = responseAlgorithms.data;
    
        const result = await Utils.generatedResultsAndSendResult(images, similarities, algorithms);
        console.log(images, similarities, algorithms, result);

    } catch (error) {
        console.log(error.response.data.message);
    }
}

main()