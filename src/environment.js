import AWS from "aws-sdk";
import fs from "fs";

const lambdarc = `${process.cwd()}/.lambdarc.json`;

const configrc = `${process.cwd()}/config.js`;
const listingrc = `${process.cwd()}/listing.js`;

const config = {};
const listing = {};

function load() {
    if (fs.existsSync(lambdarc)) {
        Object.assign(config, require(lambdarc));
    } else {
        console.log("You must first create AWS Lambda project");
        process.exit(1);
    }

    if (fs.existsSync(listingrc)) {
        Object.assign(listing, require(listingrc));
    } else {
        console.log("Project configuration error");
        process.exit(2);
    }

    if (!fs.existsSync(configrc)) {
        console.log("Project configuration error");
        process.exit(3);
    }

    changeRegion(config.aws.region);
}

function changeRegion(region) {
    AWS.config.region = region;
}

export default {
    lambdarc,
    configrc,
    listingrc,

    config,
    listing,

    load,
    changeRegion
}
