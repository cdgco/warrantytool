import ora from 'ora';
import puppeteer from 'puppeteer';
import { printTable, Table } from "console-table-printer";

export async function checkDell(computer) {
    const p = new Table({
        columns: [{
                name: "SERVICE",
                title: "SERVICE",
                maxLen: 60,
            },
            {
                name: "START",
                title: "START DATE",

            },
            {
                name: "END",
                title: "END DATE",
            },
        ],
    });
    if (process.argv.slice(2)[0] == undefined || process.argv.slice(2)[0] == '' || process.argv.slice(2)[0].length != 7) {
        console.log('Please provide a valid serial number and try again.');
        return;
    } else {
        var spinner = null
        const browserURL = 'http://127.0.0.1:21222';
        puppeteer.connect({ browserURL }).then(async browser => {
            const page = await browser.newPage()
            spinner = ora('Retrieving warranty information...').start()
            await page.goto('https://www.dell.com/support/home/en-us/product-support/servicetag/' + process.argv.slice(2)[0] + '/overview');
            try {
                const successDiv = await page.waitForSelector('#viewDetailsRedesign', {
                    timeout: 15 * 1000, // 15 seconds
                });
                const button = await successDiv.click();
            } catch (e) {
                spinner.fail('Unable to find warranty information.')
                await page.close()
                browser.disconnect()
                return
            }
            await page.waitForSelector('#warrantyDetailsPopup', {
                timeout: 15 * 1000, // 15 seconds
            });
            const warranty = await page.evaluate(() => {
                const model = document.querySelector(".product-summary").children[1].children[0].innerText
                const serviceTag = document.querySelector('#serviceTagLabel').children[1].innerText;
                const serviceCode = document.querySelector('#expressservicelabel').children[1].innerText;
                const shipDate = document.querySelector('#shippingDateLabel').children[1].innerText;
                const active = document.querySelector("#inline-warrantytext").nextElementSibling.classList.contains("text-success")
                const warrantyTable = document.querySelector(".mblWarrantyGrid")

                var warrantyData = []
                for (var i = 1; i < warrantyTable.children.length; i++) {
                    var row = warrantyTable.children[i]
                    var date = Date.parse(row.children[2].children[row.children[2].children.length - 1].innerText.trim())
                    var color = date < Date.now() ? 'red' : 'green'
                    var rowData = [row.children[0].innerText.trim(), row.children[1].children[row.children[1].children.length - 1].innerText.trim(), row.children[2].children[row.children[2].children.length - 1].innerText.trim(), color]
                    warrantyData.push(rowData)
                }
                var result = [model, serviceTag, serviceCode, shipDate, warrantyData, active];
                return result;
            });
            console.log("\n\nAsset Information:");

            var columns = [{
                "MODEL": warranty[0],
                "SERVICE TAG": warranty[1],
                "EXPRESS SERVICE CODE": warranty[2],
                "SHIP DATE": warranty[3],
            }]

            printTable(columns)
            console.log("\nWarranty Information:");

            for (var i = 0; i < warranty[4].length; i++) {
                p.addRow({ SERVICE: warranty[4][i][0], START: warranty[4][i][1], END: warranty[4][i][2] }, { color: warranty[4][i][3] });
            }
            p.printTable();
            if (warranty[5]) {
                spinner.succeed('Warranty Active')
            } else {
                spinner.fail('Warranty Expired')
            }
            await page.close()
            browser.disconnect()
        }).catch(err => {
            if (err.code == "ECONNREFUSED") {
                console.log("Unable to connect to existing browser, starting new one...");
                if (spinner === null) {
                    spinner = ora('Retrieving warranty information...').start();
                }
                puppeteer.launch({ headless: true }).then(async browser => {
                    const page = await browser.newPage()
                    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36');
                    await page.goto('https://www.dell.com/support/home/en-us/product-support/servicetag/' + process.argv.slice(2)[0] + '/overview');
                    try {
                        const successDiv = await page.waitForSelector('#viewDetailsRedesign', {
                            timeout: 40 * 1000, // 40 seconds
                        });
                        const button = await successDiv.click();
                    } catch (e) {
                        spinner.fail('Unable to find warranty information.')
                        await browser.close()
                        return
                    }
                    await page.waitForSelector('#warrantyDetailsPopup', {
                        timeout: 15 * 1000, // 15 seconds
                    });
                    const warranty = await page.evaluate(() => {
                        const model = document.querySelector(".product-summary").children[1].children[0].innerText
                        const serviceTag = document.querySelector('#serviceTagLabel').children[1].innerText;
                        const serviceCode = document.querySelector('#expressservicelabel').children[1].innerText;
                        const shipDate = document.querySelector('#shippingDateLabel').children[1].innerText;
                        const active = document.querySelector("#inline-warrantytext").nextElementSibling.classList.contains("text-success")
                        const warrantyTable = document.querySelector(".mblWarrantyGrid")

                        var warrantyData = []
                        for (var i = 1; i < warrantyTable.children.length; i++) {
                            var row = warrantyTable.children[i]
                            var date = Date.parse(row.children[2].children[row.children[2].children.length - 1].innerText.trim())
                            var color = date < Date.now() ? 'red' : 'green'
                            var rowData = [row.children[0].innerText.trim(), row.children[1].children[row.children[1].children.length - 1].innerText.trim(), row.children[2].children[row.children[2].children.length - 1].innerText.trim(), color]
                            warrantyData.push(rowData)
                        }
                        var result = [model, serviceTag, serviceCode, shipDate, warrantyData, active];
                        return result;
                    });
                    console.log("\n\nAsset Information:");

                    var columns = [{
                        "MODEL": warranty[0],
                        "SERVICE TAG": warranty[1],
                        "EXPRESS SERVICE CODE": warranty[2],
                        "SHIP DATE": warranty[3],
                    }]

                    printTable(columns)
                    console.log("\nWarranty Information:");

                    for (var i = 0; i < warranty[4].length; i++) {
                        p.addRow({ SERVICE: warranty[4][i][0], START: warranty[4][i][1], END: warranty[4][i][2] }, { color: warranty[4][i][3] });
                    }
                    p.printTable();
                    if (warranty[5]) {
                        spinner.succeed('Warranty Active')
                    } else {
                        spinner.fail('Warranty Expired')
                    }
                    await browser.close()

                }).catch(err => {
                    if (spinner != null && spinner.isSpinning) {
                        spinner.stop();
                    }
                    console.log(err);
                    console.log("\nAn unexpected error occured. Please check your configuration and try again.");
                    process.exit()
                })
            } else {
                if (spinner != null && spinner.isSpinning) {
                    spinner.stop();
                }
                console.log(err)
                console.log("\nAn unexpected error occured. Please check your configuration and try again.");
                process.exit()
            }
        })
    }
}

export async function checkHP(computer) {
    const p = new Table({
        columns: [{
                name: "SERVICE",
                title: "SERVICE",
                maxLen: 60,
            },
            {
                name: "START",
                title: "START DATE",

            },
            {
                name: "END",
                title: "END DATE",
            },
        ],
    });
    if (process.argv.slice(2)[0] == undefined || process.argv.slice(2)[0] == '' || process.argv.slice(2)[0].length < 10 || process.argv.slice(2)[0].length > 15) {
        console.log('Please provide a valid serial number and try again.');
        return;
    } else {
        var spinner = null
        const browserURL = 'http://127.0.0.1:21222';
        puppeteer.connect({ browserURL }).then(async browser => {
            const page = await browser.newPage()
            spinner = ora('Retrieving warranty information...').start();
            await page.goto('https://support.hp.com/us-en/checkwarranty');
            try {
                await page.type('#wFormSerialNumber', process.argv.slice(2)[0], { delay: 5 })
                const successDiv = await page.waitForSelector('#btnWFormSubmit', {
                    timeout: 15 * 1000, // 15 seconds
                });
                successDiv.click(),
                    await page.waitForSelector('#w-details', {
                        timeout: 15 * 1000, // 15 seconds
                    });
            } catch (e) {
                spinner.fail('Unable to find warranty information.')
                await page.close()
                browser.disconnect()
                return
            }
            const warranty = await page.evaluate(() => {
                const model = document.getElementById("hp-product-id").children[0].children[1].innerText
                const serial = document.getElementById("serialNumberValue").innerText
                const product = document.getElementById("productNumberValue").innerText
                const active = document.getElementById("w-details").innerText.includes("Warranty status details for your product: Active")
                const warrantyExtended = document.getElementById("additionalExtWarranty_1").children[0]
                const warrantyBase = document.getElementById("warrantyResultBase").children[0]

                var warrantyData = []

                if (warrantyExtended && warrantyExtended.children.length > 0) {
                    for (var i = 0; i < warrantyExtended.children.length; i++) {
                        if (warrantyExtended.children[i].innerText != '') {
                            var row = warrantyExtended.children[i]
                            if (row.children[0].children[0].children[0].innerText.includes('Warranty type')) {
                                var idx = 1
                            } else {
                                var idx = 0
                            }
                            var color = row.children[0].children[idx + 1].children[1].innerText.trim() == 'Expired' ? 'red' : 'green'
                            var rowData = [row.children[0].children[idx].children[1].innerText.trim(), row.children[0].children[idx + 2].children[1].innerText.trim(), row.children[0].children[idx + 3].children[1].innerText.trim(), color]
                            warrantyData.push(rowData)
                        }
                    }
                }
                if (warrantyBase && warrantyBase.children.length > 0) {
                    for (var i = 0; i < warrantyBase.children.length; i++) {
                        if (warrantyBase.children[i].innerText != '') {
                            var row = warrantyBase.children[i]
                            if (row.children[0].children[0].children[0].innerText.includes('Warranty type')) {
                                var idx = 1
                            } else {
                                var idx = 0
                            }
                            var color = row.children[0].children[idx + 1].children[1].innerText.trim() == 'Expired' ? 'red' : 'green'
                            var rowData = [row.children[0].children[idx].children[1].innerText.trim(), row.children[0].children[idx + 2].children[1].innerText.trim(), row.children[0].children[idx + 3].children[1].innerText.trim(), color]
                            warrantyData.push(rowData)
                        }
                    }
                }
                var result = [model, serial, product, warrantyData, active];
                return result;
            });
            console.log("\n\nAsset Information:");

            var columns = [{
                "MODEL": warranty[0],
                "SERIAL NUMBER": warranty[1],
                "PRODUCT NUMBER": warranty[2],
            }]

            printTable(columns)
            console.log("\nWarranty Information:");
            for (var i = 0; i < warranty[3].length; i++) {
                p.addRow({ "SERVICE": warranty[3][i][0], "START": warranty[3][i][1], "END": warranty[3][i][2] }, { color: warranty[3][i][3] })
            }

            p.printTable
            if (warranty[4]) {
                spinner.succeed('Warranty Active')
            } else {
                spinner.fail('Warranty Expired')
            }
            await page.close()
            browser.disconnect()
        }).catch(err => {
            if (err.code == "ECONNREFUSED") {
                console.log("Unable to connect to existing browser, starting new one...");
                if (spinner === null) {
                    spinner = ora('Retrieving warranty information...').start();
                }
                puppeteer.launch({
                    headless: false,
                }).then(async browser => {
                    const [page] = await browser.pages();
                    const session = await page.target().createCDPSession();
                    const { windowId } = await session.send('Browser.getWindowForTarget');
                    await session.send('Browser.setWindowBounds', { windowId, bounds: { windowState: 'minimized' } });
                    await page.goto('https://support.hp.com/us-en/checkwarranty')
                    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36');
                    try {
                        await page.type('#wFormSerialNumber', process.argv.slice(2)[0], { delay: 5 })
                        const successDiv = await page.waitForSelector('#btnWFormSubmit', {
                            timeout: 15 * 1000, // 15 seconds
                        });
                        successDiv.click(),
                            await page.waitForSelector('#w-details', {
                                timeout: 15 * 1000, // 15 seconds
                            });
                    } catch (e) {
                        spinner.fail('Unable to find warranty information.')
                        await browser.close()
                        return
                    }
                    const warranty = await page.evaluate(() => {
                        const model = document.getElementById("hp-product-id").children[0].children[1].innerText
                        const serial = document.getElementById("serialNumberValue").innerText
                        const product = document.getElementById("productNumberValue").innerText
                        const active = document.getElementById("w-details").innerText.includes("Warranty status details for your product: Active")
                        const warrantyExtended = document.getElementById("additionalExtWarranty_1").children[0]
                        const warrantyBase = document.getElementById("warrantyResultBase").children[0]

                        var warrantyData = []

                        if (warrantyExtended && warrantyExtended.children.length > 0) {
                            for (var i = 0; i < warrantyExtended.children.length; i++) {
                                if (warrantyExtended.children[i].innerText != '') {
                                    var row = warrantyExtended.children[i]
                                    if (row.children[0].children[0].children[0].innerText.includes('Warranty type')) {
                                        var idx = 1
                                    } else {
                                        var idx = 0
                                    }
                                    var color = row.children[0].children[idx + 1].children[1].innerText.trim() == 'Expired' ? 'red' : 'green'
                                    var rowData = [row.children[0].children[idx].children[1].innerText.trim(), row.children[0].children[idx + 2].children[1].innerText.trim(), row.children[0].children[idx + 3].children[1].innerText.trim(), color]
                                    warrantyData.push(rowData)
                                }
                            }
                        }
                        if (warrantyBase && warrantyBase.children.length > 0) {
                            for (var i = 0; i < warrantyBase.children.length; i++) {
                                if (warrantyBase.children[i].innerText != '') {
                                    var row = warrantyBase.children[i]
                                    if (row.children[0].children[0].children[0].innerText.includes('Warranty type')) {
                                        var idx = 1
                                    } else {
                                        var idx = 0
                                    }
                                    var color = row.children[0].children[idx + 1].children[1].innerText.trim() == 'Expired' ? 'red' : 'green'
                                    var rowData = [row.children[0].children[idx].children[1].innerText.trim(), row.children[0].children[idx + 2].children[1].innerText.trim(), row.children[0].children[idx + 3].children[1].innerText.trim(), color]
                                    warrantyData.push(rowData)
                                }
                            }
                        }
                        var result = [model, serial, product, warrantyData, active];
                        return result;
                    });
                    console.log("\n\nAsset Information:");

                    var columns = [{
                        "MODEL": warranty[0],
                        "SERIAL NUMBER": warranty[1],
                        "PRODUCT NUMBER": warranty[2],
                    }]

                    printTable(columns)
                    console.log("\nWarranty Information:");

                    for (var i = 0; i < warranty[3].length; i++) {
                        p.addRow({ "SERVICE": warranty[3][i][0], "START": warranty[3][i][1], "END": warranty[3][i][2] }, { color: warranty[3][i][3] })
                    }

                    p.printTable()
                    if (warranty[4]) {
                        spinner.succeed('Warranty Active')
                    } else {
                        spinner.fail('Warranty Expired')
                    }
                    await browser.close()

                }).catch(err => {
                    if (spinner != null && spinner.isSpinning) {
                        spinner.stop();
                    }
                    console.log(err);
                    console.log("\nAn unexpected error occured. Please check your configuration and try again.");
                    process.exit()
                })
            } else {
                if (spinner != null && spinner.isSpinning) {
                    spinner.stop();
                }
                console.log(err)
                console.log("\nAn unexpected error occured. Please check your configuration and try again.");
                process.exit()
            }
        })
    }
}