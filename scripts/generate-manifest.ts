/* eslint-disable @typescript-eslint/no-var-requires */
import path from "path";
import fs from "fs";

// supported Amazon domain names
const amazonDomains = [
    "https://www.amazon.com",
    "https://www.amazon.ca",
    "https://www.amazon.co.uk",
    "https://www.amazon.com.au",
];

const manifest: chrome.runtime.ManifestV3 = {
    manifest_version: 3,
    name: "Amazon Subscribe & Save one-click cancel",
    description:
        "Easy way to cancel Subscribe & Save subscriptions on Amazon with just one button click",
    version: "1.0",
    content_scripts: [
        {
            matches: [
                // subscribe and save can appear in either of these two URLs
                ...amazonDomains.map((domain) => `${domain}/auto-deliveries*`),
                ...amazonDomains.map(
                    (domain) =>
                        `${domain}/gp/subscribe-and-save/manager/viewsubscriptions*`,
                ),
            ],
            js: ["js/content_script.js"],
        },
    ],
};

const manifestJson = JSON.stringify(manifest, null, 4);

const manifestFilePath = path.join(__dirname, "../public/manifest.json");

fs.writeFileSync(manifestFilePath, manifestJson);
