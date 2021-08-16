const fs = require("fs");
const yargs = require("yargs/yargs");
const noise = require("noise-network");
const StreamSpeed = require("streamspeed");
const {hideBin} = require("yargs/helpers");
const argv = yargs(hideBin(process.argv)).argv

function receive(output) {
    const server = noise.createServer();
    server.on("connection", (encryptedStream) => {
        console.log("Data connection established.");

        const fileStream = fs.createWriteStream(require("path").join(__dirname, output));

        encryptedStream.pipe(fileStream);
        let ss = new StreamSpeed();
        ss.add(encryptedStream);
        ss.on("speed", (speed) => console.log(`Receiving at ${StreamSpeed.toHuman(speed)}/s.`));
        encryptedStream.on("end", () => { console.log("File received."); encryptedStream.end(); fileStream.end(); console.log("You can exit now."); });
    });

    const keyPair = noise.keygen();
    server.listen(keyPair, () => {
        console.log(`The channel ID is ${server.publicKey.toString("hex")}.`);
    });
}

function send(channel, input) {
    const client = noise.connect(channel);
    const fileStream = fs.createReadStream(require("path").join(__dirname, input));

    fileStream.pipe(client);
    fileStream.on("end", () => { console.log("File sent."); client.end(); });
    let ss = new StreamSpeed();
    ss.add(fileStream);
    ss.on("speed", (speed) => console.log(`Sending at ${StreamSpeed.toHuman(speed)}/s.`));
}

function main() {
    if (argv.file === undefined || (argv.channel === undefined && !argv.receive)) throw new Error("You need to specify parameters --file and --channel.");
    if (argv.receive === "true") {
        receive(argv.file);
    } else if (argv.send === "true") {
        send(argv.channel, argv.file);
    } else {
        throw new Error("You need to specify whether --receive=true or --send=true.");
    }
}

main();