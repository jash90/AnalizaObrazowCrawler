const NodeParse = require("node-html-parser");
const Fs = require('fs');
const Url = require('url');

const downloadUrl = "http://192.168.64.2";
const baseUrl = Url.parse(downloadUrl).hostname;
const defaultFolderImage = "images";
const defaultFolderSimilarity = "similarity";

const axios = require('axios').default;

const { ExifImage } = require('exif');
const Jimp = require('jimp');

const downloadSingleFile = async function (uri, filename) {
    try {
        const response = await axios({ url: uri, responseType: "stream" });
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

const onlyUnique = function (value, index, self) {
    return self.indexOf(value) === index;
}

const sendFilesToDatabase = async function () {
    try {
        const files = Fs.readdirSync(defaultFolderImage);

        let images = [];
        var h = ['|', '/', '-', '\\'];
        var i = 0;
        for (let index = 0; index < files.length; index++) {
            const file = files[index];
            const image = await createImage(file);
            const response = await axios.post("http://localhost:3091/images",
                { ...image }
            );

            images.push(response.data);
            process.stdout.write(`\rLoading ${h[i++]} sending images ${(index / files.length * 100).toFixed(2)}%    `);
            i &= h.length - 1;

        }

        process.stdout.write("\r");

        console.log(images);

        console.log(`Sending completed: sended ${files.length} photos.`);

        return images;


    } catch (error) {
        console.log(error);
    }

}

const createImage = async function (file) {

    const path = defaultFolderImage + "/" + file;

    let image = {
        filename: file,
        path,
        width: 0,
        height: 0,
        date_created: Date.now().toString(),
        location: ""
    }

    const imageJimp = await Jimp.read(path);

    const { width, height } = imageJimp.bitmap;

    image.width = width;
    image.height = height;
    image.date_created = createdDate(path);

    const exifImage = new ExifImage({ image: path }, (error, exifData) => { });

    if (exifImage.exif) {
        const { CreateDate,
            ExifImageWidth,
            ExifImageHeight } = exifImage.exif;

        image.width = ExifImageWidth;
        image.height = ExifImageHeight;
        image.date_created = CreateDate;
    }

    if (exifImage.gps)
        image.location = parseCoordinates(exifImage.gps);

    return image;
}

const parseCoordinates = function (gps) {
    if (Object.keys(gps).length < 3)
        return;

    const { GPSLatitude, GPSLongitude, GPSLatitudeRef, GPSLongitudeRef } = gps;

    return `${GPSLatitude[0]}°${GPSLatitude[1]}’${GPSLatitude[2]}"${GPSLatitudeRef},`
        + `${GPSLongitude[0]}°${GPSLongitude[1]}’${GPSLongitude[2]}"${GPSLongitudeRef}`;
}

const createdDate = function (file) {
    const { birthtime } = Fs.statSync(file)
    return birthtime
}

const sendPatternSimilarity = async function () {
    try {

        const directories = Fs.readdirSync(defaultFolderSimilarity, { withFileTypes: true })
            .filter(directory => directory.isDirectory())
            .map(directory => defaultFolderSimilarity + "/" + directory.name);

        let similarity = [];

        for (let index = 0; index < directories.length; index++) {

            const directory = directories[index];
            const files = Fs.readdirSync(directory);

            for (let x = 0; x < files.length; x++) {

                const file1 = files[x];

                for (let y = 0; y < files.length; y++) {

                    const file2 = files[y];

                    if (x != y) {
                        const array = JSON.stringify([file1, file2].sort());
                        if (!similarity.some(function (value) {
                            return JSON.stringify(value) === array;
                        })) {
                            similarity.push([file1, file2].sort());
                        }
                    }
                }
            }
        }

        const similarityDatabase = [];

        for (let i = 0; i < similarity.length; i++) {
            const element = similarity[i];
            const response1 = await axios.get(`http://localhost:3091/images/filename/${element[0]}`);
            const response2 = await axios.get(`http://localhost:3091/images/filename/${element[1]}`);
            const imageId = Number(response1.data.id);
            const secondImageId = Number(response2.data.id);
            try {
                const response = await axios.post(`http://localhost:3091/similaritys`, {imageId, secondImageId});
                similarityDatabase.push(response.data);
            } catch (error) {
                console.log(error.response.data);
            }
            
        }

        console.log(similarityDatabase);

        console.log(`Sending completed: sended ${similarityDatabase.length} similarities.`);

        return similarityDatabase;

    } catch (error) {
        console.log(error);
    }
}

const sendAlgorithms = function () {

    const algorithmsEdit = ["grey scale", "normalize", "blur", "gaussian blur", "dither", "remove noise", "binary", "sharpen", "normal"];
    const algorithmsParameters = [{}, {}, { r: 10 }, { r: 10 }, {}, {}, {}, {}, {}];
    const algorithmsCompare = ["one square", "five square", "big square", "random", "histogram"];

    let algorithms = [];

    for (let i = 0; i < algorithmsEdit.length; i++)
        for (let j = 0; j < algorithmsCompare.length; j++) {
            algorithms.push({ name: `${algorithmsEdit[i]} ${algorithmsCompare[j]}`, parameters: JSON.stringify(algorithmsParameters[i]) });
        }

    console.log(algorithms);

    return algorithms;

}



module.exports = { downloadAllFile, sendFilesToDatabase, sendPatternSimilarity, sendAlgorithms };