const fs = require("fs");
const yargs = require("yargs/yargs");
const noise = require("noise-network");
const StreamSpeed = require("streamspeed");
const {hideBin} = require("yargs/helpers");
const argv = yargs(hideBin(process.argv)).argv

function receive(output) {
    server.on("connection", (encryptedStream) => {
        console.log("Data connection established.");

        const fileStream = fs.createWriteStream(output);

        encryptedStream.pipe(fileStream);
        let ss = new StreamSpeed();
        ss.add(encryptedStream);
        ss.on("speed", (speed) => console.log(`Receiving at ${speed/1000} KBps.`));
    })

    const keyPair = noise.keygen();
    server.listen(keyPair, () => {
        console.log(`The channel ID is ${server.publicKey.toString("hex")}.`);
    });
}

function send(channel, input) {
    const client = noise.connect(channel);
    const fileStream = fs.createReadStream(output);

    fileStream.pipe(client);
    let ss = new StreamSpeed();
    ss.add(fileStream);
    ss.on("speed", (speed) => console.log(`Sending at ${speed/1000} KBps.`));
}

function main() {
    if (argv.file === undefined || (argv.channel === undefined && !argv.receive)) throw new Error("You need to specify parameters --file and --channel.");
    if (argv.receive === true) {
        receive(argv.file);
    } else if (argv.send === true) {
        send(channel, argv.file);
    } else {
        throw new Error("You need to specify whether --receive=true or --send=true.");
    }
}

main();