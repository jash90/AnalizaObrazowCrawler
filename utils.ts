import { parse } from 'node-html-parser';
import fs from "fs";
import Url from "url";
import axiosDefault from "axios";
import { ExifImage } from "exif";
import Jimp from "jimp";
import { combinations } from 'mathjs'
import axios from "./axios";
import Algorithm from "./algorithms";

const downloadUrl = "http://192.168.64.2";
const baseUrl = Url.parse(downloadUrl).hostname;
const defaultFolderImage = "images";
const defaultFolderSimilarity = "similarity";

export default class Utils {
    public static downloadSingleFile = async function (uri: any, filename: any) {
        try {
            const response = await axiosDefault({ url: uri, responseType: "stream" });
            response.data.pipe(fs.createWriteStream(filename));
            console.log(`download done ${filename}`);
        } catch (error) {
            console.log(error);
        }

    };

    public static downloadAllFile = async function () {
        try {
            if (fs.existsSync(defaultFolderImage) && fs.lstatSync(defaultFolderImage).size > 1000) {
                return;
            }

            if (!fs.existsSync(defaultFolderImage)) {
                fs.mkdirSync(defaultFolderImage);
            }

            var links = [downloadUrl];

            for (var i = 0; i < links.length; i++) {
                const link = links[i];
                const allLinksFromSite = await Utils.linksFromSite(link);

                links.push(...allLinksFromSite as any);
                links = links.filter(Utils.onlyUnique);
            }

            var fileIndex = 1;

            for (var i = 0; i < links.length; i++) {
                const link = links[i];
                const { data } = await axiosDefault.get(link);
                const site = parse(String(data));

                const files = site.querySelectorAll('img');
                for (var x = 0; x < files.length; x++) {
                    await Utils.downloadSingleFile("http://" + baseUrl + "/" + files[x].rawAttributes.src, `${defaultFolderImage}/img` + Number(fileIndex) + ".jpeg");
                    fileIndex = fileIndex + 1;
                }

            }

            console.log("Download Complete.");

        } catch (error) {
            console.log(error);
        }

    }

    public static linksFromSite = async function (downloadUrl: string) {
        try {
            const { data } = await axiosDefault.get(downloadUrl);

            const site = parse(String(data));

            var links = site.querySelectorAll('a');

            return links.map((link: any) => "http://" + baseUrl + "/" + link.rawAttributes.href);
        } catch (error) {
            console.log(error);
        }
    }

    public static onlyUnique = function (value: any, index: any, self: any) {
        return self.indexOf(value) === index;
    }

    public static sendFilesToDatabase = async function () {
        try {
            const files = fs.readdirSync(defaultFolderImage);

            let images = [];
            var h = ['|', '/', '-', '\\'];
            var i = 0;
            for (let index = 0; index < files.length; index++) {
                const file = files[index];
                const image = await Utils.createImage(file);
                const response = await axios.post("images",
                    { ...image }
                );

                images.push(response.data);

                process.stdout.write(`\rLoading ${h[i++]} sending images ${(index / files.length * 100).toFixed(2)}%`);
                i &= h.length - 1;

            }

            process.stdout.write("\r");

            console.log(images);

            console.log(`Sending completed: sended ${files.length} photos.`);

            return images;


        } catch (error) {
            console.log(error.response.data);
        }

    }

    public static createImage = async function (filename: any) {
        try {

            const path = defaultFolderImage + "/" + filename;

            let image: any = {
                filename,
                path,
                width: 0,
                height: 0,
                date_created: Date.now(),
                location: ""
            }

            const imageJimp = await Jimp.read(path);

            const { width, height } = imageJimp.bitmap;

            image.width = width;
            image.height = height;
            image.date_created = Utils.createdDate(path);

            const exifImage: any = new ExifImage({ image: path }, (error, exifData) => { });

            if (exifImage.exif) {
                const { CreateDate } = exifImage.exif;
                image.date_created = CreateDate;
            }

            if (exifImage.gps)
                image.location = Utils.parseCoordinates(exifImage.gps);

            return image;
        } catch (error) {
            console.log(error);
        }
    }

    public static parseCoordinates = function (gps:any) {
        if (Object.keys(gps).length < 3)
            return;

        const { GPSLatitude, GPSLongitude, GPSLatitudeRef, GPSLongitudeRef } = gps;

        return `${GPSLatitude[0]}°${GPSLatitude[1]}’${GPSLatitude[2]}"${GPSLatitudeRef},`
            + `${GPSLongitude[0]}°${GPSLongitude[1]}’${GPSLongitude[2]}"${GPSLongitudeRef}`;
    }

    public static createdDate = function (file:string) {
        const { birthtime } = fs.statSync(file)
        return birthtime
    }

    public static sendPatternSimilarity = async function () {
        try {

            const directories = fs.readdirSync(defaultFolderSimilarity, { withFileTypes: true } as any)
                .filter((directory: any) => directory.isDirectory())
                .map((directory: any) => defaultFolderSimilarity + "/" + directory.name);

            let similarity = [];

            for (let index = 0; index < directories.length; index++) {

                const directory = directories[index];
                const files = fs.readdirSync(directory);

                for (let x = 0; x < files.length; x++) {

                    const file1 = files[x];

                    for (let y = x; y < files.length; y++) {

                        const file2 = files[y];

                        if (x != y) {
                            similarity.push([file1, file2].sort());
                        }
                    }
                }
            }

            const similarityDatabase = [];

            for (let i = 0; i < similarity.length; i++) {
                const element = similarity[i];
                const response1 = await axios.get(`images/filename/${element[0]}`);
                const response2 = await axios.get(`images/filename/${element[1]}`);
                const imageId = Number(response1.data.id);
                const secondImageId = Number(response2.data.id);
                try {
                    const response = await axios.post(`similarities`, { imageId, secondImageId });
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

    public static sendAlgorithms = async function () {
        try {

            const algorithmsEdit = ["grey scale", "normalize", "blur", "gaussian blur", "dither", "remove noise", "binary", "sharpen", "normal"];
            const algorithmsParameters = [{}, {}, { r: 10 }, { r: 10 }, {}, {}, {}, {}, {}];
            const algorithmsCompare = ["one square", "five square", "big square", "random", "histogram"];

            let algorithms = [];

            for (let i = 0; i < algorithmsEdit.length; i++)
                for (let j = 0; j < algorithmsCompare.length; j++) {
                    try {
                        const response = await axios.post(`algorithms`, { name: `${algorithmsEdit[i]} ${algorithmsCompare[j]}`, parameters: JSON.stringify(algorithmsParameters[i]) });
                        algorithms.push(response.data);
                    } catch (error) {
                        console.log(error.response.data);
                    }

                }

            console.log(algorithms);

            console.log(`Sending completed: sended ${algorithms.length} algorytm.`);

            return algorithms;
        } catch (error) {
            console.log(error);
        }

    }

    public static generatedResultsAndSendResult = async function (images:any, similarities:any, algorithms:any) {
        try {

            var h = ['|', '/', '-', '\\'];
            var x = 0;
            let l = 0;

            console.time("time");

            for (let i = 0; i < images.length; i++) {
                const image1 = images[i];
                for (let j = i + 1; j < images.length; j++) {
                    const image2 = images[j];
                    if (image1.id !== image2.id)
                        for (let k = 0; k < algorithms.length; k++) {
                            const algorithm = algorithms[k];
                            let compare: any = { imageId: Number(image1.id), secondImageId: Number(image2.id), versionAlgorithmId: Number(algorithm.id) };

                            const similarityEntity = similarities.find((value: any) => (value.imageId === image1.id && value.secondImageId === image2.id) || (value.imageId === image2.id && value.secondImageId === image1.id));
                            const result: any = await Algorithm.compareWithAlgorithm(algorithm.name, algorithm.parameters, image1.path, image2.path);
                            compare.similarity = Number(result.similarity);
                            compare.correct = result.similarity >= 50 && !!similarityEntity || result.similarity < 50 && !similarityEntity;


                            const response = await axios.post("compares", {
                                ...compare
                            });
                            process.stdout.write(`\rLoading generate result ${h[x++]} ${(l / (combinations(images.length, 2) * algorithms.length) * 100).toFixed(5)}%     `);
                            x &= h.length - 1;
                            l++;
                        }
                }
            }
            process.stdout.write("\r");
            console.timeEnd("time");
        } catch (error) {
            console.log(error);
        }
    }

}



