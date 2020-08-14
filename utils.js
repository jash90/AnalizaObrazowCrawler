const axios = require("axios");
const NodeParse = require("node-html-parser");
const Fs = require('fs');
const Url = require('url');

const downloadUrl = "http://192.168.64.2/gallery1.html";
const baseUrl = Url.parse(downloadUrl).hostname;
const defaultFolderImage = "images";

const downloadSingleFile = async function (uri, filename) {
    try {
        const response = await axios.default({ url: uri, responseType: "stream" });
        response.data.pipe(Fs.createWriteStream(filename));
        console.log(`download done ${filename}`);
    } catch (error) {
        console.log(error);
    }

};

const downloadAllFile = async function () {
    if (Fs.existsSync(defaultFolderImage) && Fs.lstatSync(defaultFolderImage).size > 1000) {
        return;
    }

    if (!Fs.existsSync(defaultFolderImage)) {
        Fs.mkdirSync(defaultFolderImage);
    }

    const { data } = await axios.get(downloadUrl);
    const links = NodeParse.parse(String(data));

    const files = links.querySelectorAll('img');
    for (var i = 0; i < files.length; i++)
        await downloadSingleFile("http://" + baseUrl + "/" + files[i].rawAttributes.src, `${defaultFolderImage}/img` + Number(i + 1) + ".jpeg");


    console.log("Download Complete.");

}

module.exports = { downloadAllFile };