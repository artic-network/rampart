const fs = require('fs');
const path = require('path');
const { getProtocolsPath, warn, log } = require("../utils");

const main = async (args) => {
    args.name.forEach((name) => {
        if (name === "default") {
            warn(`Can't delete the default protocol!`)
            return;
        }
        const protocolPath = path.join(getProtocolsPath(), name);
        if (fs.existsSync(protocolPath)) {
            fs.rmdirSync(protocolPath, { recursive: true });
            log(`Removed protocol ${name}`);
        } else {
            warn(`Protocol ${name} doesn't exist!`)
        }
    })

}

module.exports = { default: main}