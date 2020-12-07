import { sbcConfig } from "./sbcConfig.js"
import { sbcUtils } from "./sbcUtils.js"
import { sbcData, sbcError } from "./sbcData.js"
import { parseCategory, sbcMapping } from "./sbcParsers.js"

/* ------------------------------------ */
/* sbcParser    						*/
/* ------------------------------------ */

export class sbcParser {

    /* ------------------------------------ */
    /* Prepare the input                    */
    /* ------------------------------------ */

    static async prepareInput() {
        sbcConfig.options.debug && sbcUtils.log("Preparing Input")

        try {

            // Initial Clean-up of input
            // Replace different dash-glyphs with the minus-glyph
            // Remove weird multiplication signs
            // Remove double commas
            // Replace real fractions with readable characters
            // ½ ⅓ ¼ ⅕ ⅙ ⅛
            //sbcData.preparedInput.data = sbcData.input.replace(/^\s*[\r\n]/gm,"")
            sbcData.preparedInput.data = sbcData.input.replace(/–|—|−/gm,"-")
            .replace(/×/gm, "x")
            .replace(/,,/gm, ",")
            .replace(/½/gm, "1/2")
            .replace(/⅓/gm, "1/3")
            .replace(/¼/gm, "1/4")
            .replace(/⅕/gm, "1/5")
            .replace(/⅙/gm, "1/6")
            .replace(/⅛/gm, "1/8")

            // Separate the input into separate lines and put them into an array,
            // so that we can place highlights on specific lines when for
            // example an error occurs

            .split(/\n/g)

            sbcData.preparedInput.success = true

            await this.parseInput()

        } catch (errorMessage) {
            let error = new sbcError(0, "Prepare", errorMessage)
            sbcData.errors.push(error)
            sbcData.preparedInput.success = false
        }
        
    }

    /* ------------------------------------ */
    /* Parse the input                      */
    /* ------------------------------------ */

    static async parseInput() {
        sbcConfig.options.debug && sbcUtils.log("Parsing Input")

        // Check if there is stuff to parse and a temporary actor to hold the data
        if (sbcData.characterData == null || !sbcData.input) {
            sbcData.characterData == null && sbcData.errors.push(new sbcError(0, "Input", "No valid characterData found"))
            !sbcData.input && sbcData.errors.push(new sbcError(0, "Parse", "Not enough input found to parse"))
            sbcData.parsedInput.success = false
        }

        if (sbcData.preparedInput.success) {

            // DO STUFF WITH THE PARSED INPUT
            // parse the different blocks of content

            try {

                let characterData = sbcData.characterData

                let availableCategories = Object.keys(sbcMapping.map);

                /* ------------------------------------ */
                /* The input was prepared and is        */
                /* currently in the form of an arry     */
                /* which consists of one entry per line */
                /* ------------------------------------ */

                // Split the input data via the category names of our mapping
                // base (no keyword, so use everything up to the defense keyword)
                // defense
                // offense
                // tactics
                // statistics
                // ecology
                // special abilities
                // description


                // Get the index position of our keywords/categories
                // Bonus, filter for the categories found in the statblock
                
                let categoryIndexPositions = {}
                for (let i=1; i<availableCategories.length; i++) {

                    let categoryPattern = new RegExp("^\\b" + availableCategories[i] + "\\b","i")
                    sbcData.preparedInput.data.filter(function(item, index){

                        if (item.search(categoryPattern) !== -1) {
                            categoryIndexPositions[availableCategories[i]] = index
                        }

                    })
                    
                }

                // Check, if any categories could be found
                let foundCategories = Object.keys(categoryIndexPositions)
                let foundCategoriesString = sbcUtils.capitalize(foundCategories.join(", "))
                foundCategories.unshift("base")

                console.log("foundCategories unshift")
                console.log(foundCategories)

                if (foundCategories.length !== 0) {

                    // Check, if the needed categories are there
                    let neededCategories = ["defense","offense","statistics"]
                    let foundAllNeededCategories = neededCategories.every(i => foundCategories.includes(i));

                    if (foundAllNeededCategories) {

                        // Split the input into chunks for the found categories
                        // via the index positions found earlier
                        // and send these chunks off to the correct parser in sbcParsers.js

                        let dataChunks = {
                            "base": [],
                            "defense": [],
                            "offense": [],
                            "statistics": [],
                            "tactics": [],
                            "ecology": [],
                            "special abilities": [],
                            "description": [],
                        }
                        
                        let lastLine = 0
                        for (let i=0; i<foundCategories.length; i++) {
                            
                            let category = foundCategories[i]
                            let startLine = lastLine
                            let stopLine = categoryIndexPositions[foundCategories[i+1]]

                            console.log("category: " + category + " > " + "startLine: " + startLine + " > stopLine: " + stopLine)

                            if (i === foundCategories.length-1) {
                                dataChunks[category] = sbcData.preparedInput.data.slice(startLine)
                            } else {
                                dataChunks[category] = sbcData.preparedInput.data.slice(startLine, stopLine)
                            }

                            await parseCategory(category, dataChunks[category], startLine)

                            lastLine = stopLine

                        }

                        // If parsing and character generation is success
                        // close the inputDialog and resetSBC
                        sbcData.parsedInput.success = true

                    } else {

                        let errorMessage = `Failed to find enough keywords to parse the input.<br>
                                        Found Keywords: ${foundCategoriesString}<br>
                                        Needed Keywords: Defense, Offense, Statistics<br>
                                        Optional Keywords: Special Abilities, Ecology, Tactics, Description`
                        let error = new sbcError(0, "Parse", errorMessage)
                        sbcData.errors.push(error)
                        sbcData.parsedInput.success = false

                    }

                } else {

                    let errorMessage = `Failed to find any keywords to parse the input.<br>
                                        Needed Keywords: Defense, Offense, Statistics<br>
                                        Optional Keywords: Special Abilities, Ecology, Tactics, Description`
                    let error = new sbcError(0, "Parse", errorMessage)
                    sbcData.errors.push(error)
                    sbcData.parsedInput.success = false

                }

            } catch (e) {

                let errorMessage = "parseInput() failed with an unspecified error. Sorry!"
                let error = new sbcError(0, "Parse", errorMessage)
                sbcData.errors.push(error)
                sbcData.parsedInput.success = false
                throw e

            }

        } else {

            let errorMessage = "parseInput() failed as the input could not be prepared successfully"
            let error = new sbcError(0, "Parse", errorMessage)
            sbcData.errors.push(error)
            sbcData.parsedInput.success = false
            
        }
        
    }

}

