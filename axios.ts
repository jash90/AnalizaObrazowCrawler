import axios from "axios";

//const defaultUrl = "https://analiza.raccoonsoftware.pl/";

const defaultUrl = "http://localhost:3091/";

const instance = axios.create({
    baseURL: defaultUrl,
    timeout: 20000
})

export default instance;