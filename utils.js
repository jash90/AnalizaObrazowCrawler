const axios = require("axios");
const NodeParse = require("node-html-parser");
const Fs = require('fs');
const Url = require('url');

const downloadUrl = "http://192.168.64.2";
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

    var links = [downloadUrl];

    for (var i = 0; i < links.length; i++) {
        const link = links[i];
        const allLinksFromSite = await linksFromSite(link);

        links.push(...allLinksFromSite);
        links = links.filter(onlyUnique);
    }

    var fileIndex = 1;

    for (var i = 0; i < links.length; i++) {
        const link = links[i];
        const { data } = await axios.get(link);
        const site = NodeParse.parse(String(data));

        const files = site.querySelectorAll('img');
        for (var x = 0; x < files.length; x++) {
            await downloadSingleFile("http://" + baseUrl + "/" + files[x].rawAttributes.src, `${defaultFolderImage}/img` + Number(fileIndex) + ".jpeg");
            fileIndex = fileIndex + 1;
        }

    }

    console.log("Download Complete.");

}

const linksFromSite = async function (downloadUrl) {
    const { data } = await axios.get(downloadUrl);

    const site = NodeParse.parse(String(data));

    var links = site.querySelectorAll('a');

    return links.map(link => "http://" + baseUrl + "/" + link.rawAttributes.href);
}

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

module.exports = { downloadAllFile };