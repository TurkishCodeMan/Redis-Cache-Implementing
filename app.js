const express = require("express");
const app = express();
const fetch = require("node-fetch")

const redis = require("redis");
const client = redis.createClient(); //Default Port 6379
client.on("connect", function () {
    console.log("Redis calısıyor");
});

const port = process.env.PORT || 3000;


const setResponse = (username, repos) => {
    return `<h2>${username} has ${repos} repos !</h2>`
}

const getRepos = async (req, res, next) => {
    try {
        console.log("Fetching Data");
        const { username } = req.params;
        const response = await fetch(`https://api.github.com/users/${username}`)
        const data = await response.json();
        const repos = data.public_repos;

        // //Cache Varmı Kontrol yoksa cacheye at
        client.get(username, (err, reply) => {
            if (err) return console.log(err);
            if (reply != null) {
                return;
            }
            if (reply == null) {
                client.setex(username, 3600, repos)
            }
        })


        return res.send(setResponse(username, repos));
    } catch (error) {
        return error.message;
    }
}

const cache = async (req, res, next) => {
    const { username } = req.params;

    client.get(username, (err, data) => {
        if (err) throw err;
        if (data != null) {
            return res.send(setResponse(username, data));

        }else{
            next();
        }
    })
}


app.get("/repos/:username", cache, getRepos);


app.listen(port, (err) => {
    if (err) return console.log(err);

    console.log("Listening on port 3000");
})
