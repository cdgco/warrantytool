# Dell / HP Warranty Lookup Tool
Warranty Tool is a cross-platform command line tool to quickly check warranties by serial number. Warranty tool runs on Chrome through Puppeteer and will either use your existing open browser, or run in a headless instance.

# Installation

Install the tool globally by running `npm i -g warrantytool`.

(Optional) Configure Chrome to work with puppeteer by launching Chrome with the `--remote-debugging-port=21222` flag, or add the flag to your Chrome shortcut to always launch with the Puppeteer control port enabled. If you do not enable the control port, Warranty Tool will run in it's own headless instance, but performance is significantly impacted and the tool may be flagged as a bot.

# Usage

Run `hp-warranty SERIALNUMBER` or `dell-warranty SERIALNUMBER` from your terminal, replacing `SERIALNUMBER` with your desired serial or service tag.

To use Warranty Tool without installing globally, run `node dell-warranty SERIALNUMBER` or `node hp-warranty SERIALNUMBER` from the Warranty Tool directory.

