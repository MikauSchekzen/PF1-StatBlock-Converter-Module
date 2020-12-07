import { sbcConfig } from "./sbcConfig.js"
import { sbcData, sbcErrorLevels } from "./sbcData.js"

export class sbcUtils {
    static openingBrackets = ['(', '[', '{'];
    static closingBrackers = [')', ']', '}'];
    static matchingClosingBrackets = {'(': ')', '[' : ']', '{': '}'};

    /* ------------------------------------ */
    /* Resetting and Updating   			*/
    /* ------------------------------------ */
    static resetConfiguration () {
        sbcConfig.options = {
            "actorReady": false,
            "debug": false,
            "inputDelay": 1000,
            "defaultActorType": 0,
            "tokenSettings": {
                "displayName": 20,
                "vision": false,
                "disposition": -1,
                "displayBars": 20,
                "bar1": {},
                "bar2": {}
            }
        }

    }

    static resetData () {
        sbcData.errors = []
        sbcData.sbcActorType = 0
        sbcData.input = ""
        sbcData.preparedInput = {}
        sbcData.parsedInput = {}
        sbcData.characterData = {}
    }

    static resetErrorLog () {
        this.errors = []
        let errorArea = $(".sbcErrorContainer #sbcErrors")
        errorArea.html("")
    }

    static resetInput() {
        let inputArea = $(".sbcContainer #sbcInput")
        let highlights = $("#sbcHighlights")
        inputArea.val(null)
        highlights.html("")
    }
    
    static resetPreview() {
        let previewArea = $(".sbcContainer #sbcPreview")
        previewArea.html("")
    }   

    static async updatePreview() {
        this.resetPreview()
        let previewArea = $(".sbcContainer #sbcPreview")
        let preview = await renderTemplate('modules/pf1-statblock-converter/templates/sbcPreview.hbs' , {data: sbcData.characterData.actorData.data})
        previewArea.append(preview)
    }

    static updateErrorArea() {
        sbcUtils.logErrors()
    }

    /* ------------------------------------ */
    /* Log to the console and errorArea     */
    /* ------------------------------------ */

    static log(message) {
        sbcConfig.options.debug && console.log("sbc-pf1 | " + message);
    }

    static logErrors() {

        if (sbcData.errors.length > 0) {

            let errorLines = []

            let errorArea = $(".sbcErrorContainer #sbcErrors")
            errorArea.empty()
            errorArea.append("There were " + sbcData.errors.length + " issue(s) parsing the provided statblock:<br/>")

            let lastText = ""
            let lastId = 0
            let duplicateErrors = 2

            this.log("> There were " + sbcData.errors.length + " issue(s) parsing the provided statblock:");
            
            // Loop over all errors and create error messages as well as highlight problematic areas in the input
            for(let i=0; i<sbcData.errors.length; i++) {

                let error = sbcData.errors[i]

                let id = "sbcError-" + i
                let level = sbcErrorLevels[error.level]
                let keyword = error.keyword
                let text = error.message
                let line = error.line
                let message = level + " >> " + keyword + " failed >> " + text

                if (text == lastText) {

                    let duplicateErrorIndicator = $("#" + lastId)
                    duplicateErrorIndicator.text(duplicateErrors)

                    duplicateErrorIndicator.addClass("active")
                    duplicateErrors++

                } else {

                    // Create a new error message in the error area
                    lastId = id
                    lastText = text
                    let errorMessage = `<div draggable='false' class='sbcErrors ${id}'><span id='${id}' class='identicalErrorIndicator'>${duplicateErrors}</span>${message}</div>`
                    this.log("> " + text)
                    
                    errorArea.append(errorMessage)
                    duplicateErrors = 2

                    if (line !== -1) errorLines.push(line)
                    
                }
   
            }
            
            // Highlight the lines, in which an error occured
            if (sbcData.preparedInput.data) {
                let highlights = $("#sbcHighlights")
                let inputArea = $("#sbcInput")
                let highlightedText = this.applyHighlights(errorLines)

                inputArea.scrollTop(0)
                highlights.html(highlightedText)
            }
            

        }
        
    }

    /* ------------------------------------ */
    /* Workers                              */
    /* ------------------------------------ */

    static applyHighlights(errorLines) {

        let highlightedText = []

        for (let i=0; i<sbcData.preparedInput.data.length; i++) {          

            if (errorLines.includes(i)) {
                let highlightedLine = "<mark>" + sbcData.preparedInput.data[i] + "</mark><br/>"
                highlightedText.push(highlightedLine)
            } else {
                sbcData.preparedInput.data[i] !== "<br>" && highlightedText.push(sbcData.preparedInput.data[i] + "<br/>")
            }

        }

        return highlightedText
      }

    static getModifier(attribute) {
        return Math.floor(((attribute-10)/2));
    }
    
    static getSumOfChangeModifiers(changePool) {
        let sumOfChanges = 0;
        let changeKeys = Object.keys(changePool)
        for (let i=0; i<changeKeys.length; i++) {
            sumOfChanges += changePool[changeKeys[i]];
        }
        return sumOfChanges;
    }
    
    static getEncumbrance (strength) {
        // If(Str <= 10) MaxCarryingCapacity = 10*Str
        // If(Str > 10) MaxCarryingCapacity = 5/4 * 2^Floor(Str/5)* Round[20 * 2^(Mod(Str,5)/5)]
        
        if(strength <= 10) {
            return strength*10;
        } else {
            return 5/4 * (2 ** Math.floor(strength/5)) * Math.round(20 * ( 2 ** ( (strength % 5) / 5 ) ) );
        }
    }
    
    static getDiceAverage (diceSize) {
        let sum = 0;
        for (let i=1; i<=diceSize; i++) {
            sum += i;
        }
            
        return sum/diceSize;
    }
    
    static makeValueRollable(string) {
            
        var output = string.replace(/(\d+d\d+)/g, "[[$1]]");
        
        return output;
    }
    
    static capitalize (string) {
        return string.toLowerCase().replace(/^\w|\s\w/g, function (letter) {
            return letter.toUpperCase();
        })
    }

    static camelize(string) {
        if (!string) {
            return string;
        }
        return string.replace(/(?:^\w|[A-Z]|\b\w)/g, function(word, index) {
            return word.toUpperCase();
        }).replace(/\s+/g, ' ');
    }

    static stringContains(string, subString, bCaseSensitive = true) {
        if (bCaseSensitive) {
            return string.includes(subString);
        }
        return string.toLowerCase().includes(subString.toLowerCase());
    }

    static stringStartsWith(string, searchString, bCaseSensitive = true) {
        if (!string) return false;
        if (!searchString) return false;

        try {
            if (searchString.length > string.length) {
                return false;
            }

            if (bCaseSensitive) {
                return string.startsWith(searchString);
            } else {
                let startPart = string.substring(0, searchString.length);
                return startPart.toLowerCase() === searchString.toLowerCase();
            }
        } catch (err) {
            sbcUtils.log(`stringStartsWith('${string}', '${searchString}', ${bCaseSensitive}) threw an error: ${err}`);
            throw err;
        }
    }

    static switchValue(obj){
        const ret = {};
        Object.keys(obj).forEach(key => {
            ret[obj[key]] = key;
        });
        return ret;
    }
    

    /* ------------------------------------ */
    /* Functions from the Starfinder Parser */
    /* ------------------------------------ */



    /** Will try to find an entry in the specified compendium that matches all the terms, will return the first entry that does. */
    static async fuzzyFindCompendiumAsync(compendiumName, searchString) {
        if (!compendiumName) {
            sbcUtils.log("No compendium name specified.");
            return null;
        }

        if (!searchString) {
            sbcUtils.log("No search string specified.");
            return null;
        }

        let compendium = game.packs.find(element => element.title.includes(compendiumName));
        if (compendium == undefined) {
            sbcUtils.log("Could not find compendium named " + compendium + ".");
            return null;
        }

        let rawString = this.parseSubtext(searchString)[0];
        
        // Let the compendium load
        await compendium.getIndex();
        
        let terms = rawString.toLowerCase().replace("(ex)","").replace("(su)","").replace("(sp)","").trim().replace(/[*,;()\[\]'"]/g,"").split(' ');
        let entryWeWant = null;
        for (let entry of compendium.index) {
            let rawEntryName = this.parseSubtext(entry.name)[0];
            let entryName = rawEntryName.toLowerCase().replace("(ex)","").replace("(su)","").replace("(sp)","").trim();
            let entryTerms = entryName.replace(/[*,;()\[\]'"]/g,"").split(' ');

            if (terms.length !== entryTerms.length) {
                continue;
            }
            
            let bAllTermsPresent = true;
            for (let term of terms) {
                if (!entryTerms.includes(term)) {
                    bAllTermsPresent = false;
                    break;
                }
            }

            if (!bAllTermsPresent) {
                continue;
            }

            entryWeWant = compendium.getEntry(entry._id);
            break;
        }

        if (entryWeWant != undefined) {
            //sbcUtils.log("Item " + JSON.stringify(entryWeWant));
        } else {
            //sbcUtils.log("Item " + entryName + " not found.");
        }
        return entryWeWant;
    }

    static async fuzzyFindItemAsync(statBlockItemName) {
        statBlockItemName = statBlockItemName.toLowerCase();

        // Common substitutions
        statBlockItemName = statBlockItemName.replace("grenades", "grenade");
        if (statBlockItemName.endsWith("grenade 1")) {
            statBlockItemName = statBlockItemName.replace("grenade 1", "grenade i");
        } else if (statBlockItemName.endsWith("grenade 2")) {
            statBlockItemName = statBlockItemName.replace("grenade 2", "grenade ii");
        } else if (statBlockItemName.endsWith("grenade 3")) {
            statBlockItemName = statBlockItemName.replace("grenade 3", "grenade iii");
        } else if (statBlockItemName.endsWith("grenade 4")) {
            statBlockItemName = statBlockItemName.replace(" 4", "grenade iv");
        } else if (statBlockItemName.endsWith("grenade 5")) {
            statBlockItemName = statBlockItemName.replace("grenade 5", "grenade v");
        }

        statBlockItemName = statBlockItemName.replace("batteries", "battery");
        if (sbcUtils.stringContains(statBlockItemName, "battery", false)) {
            if (!sbcUtils.stringContains(statBlockItemName, "capacity", false)) {
                statBlockItemName += ", standard";
            }
        }
        return this.fuzzyFindCompendiumAsync("Equipment", statBlockItemName);
    }

    static async fuzzyFindSpellAsync(statBlockSpellName) {
        statBlockSpellName = statBlockSpellName.replace("/ ", "/");
        statBlockSpellName = statBlockSpellName.replace(" /", "/");
        return this.fuzzyFindCompendiumAsync("Spells", statBlockSpellName);
    }

    static parseSubtext = (value) => {
        let startSubtextIndex = value.indexOf('(');
        let endSubtextIndex = value.indexOf(')');
        if (startSubtextIndex > -1 && endSubtextIndex > startSubtextIndex) {
            let baseValue = value.substring(0, startSubtextIndex).trim();
            let subValue = value.substring(startSubtextIndex+1, endSubtextIndex).trim();
            return [baseValue, subValue];
        } else {
            return [value];
        }
    }

    static splitEntries(baseString, additionalEntrySplitters = null) {
        let textualEntrySplitters = ["or", "and"];
        if (additionalEntrySplitters) {
            textualEntrySplitters = textualEntrySplitters.concat(additionalEntrySplitters);
        }

        let results = null;
        let stack = [];
        let entry = "";
        for (let i = 0; i<baseString.length; i++) {
            let character = baseString[i];
            let stackTop = stack.length > 0 ? stack[stack.length-1] : '';
            if (sbcUtils.openingBrackets.includes(character)) {
                entry += character;
                stack.push(character);
            } else if (stackTop && character == sbcUtils.matchingClosingBrackets[stackTop]) {
                entry += character;
                stack.pop();
            } else if (character === ',' || character === ';') {
                if (stack.length === 0 && entry.length > 0) {
                    if (!results) {
                        results = [entry.trim()];
                    } else {
                        results.push(entry.trim());
                    }
                    entry = "";
                } else {
                    entry += character;
                }
            } else {
                entry += character;
                for (let splitter of textualEntrySplitters) {
                    let ending = " " + splitter;
                    if (entry.toLowerCase().endsWith(ending) && stack.length == 0 && baseString[i+1] == ' ') {
                        entry = entry.substring(0, entry.length - splitter.length);
                        if (!results) {
                            results = [entry.trim()];
                        } else {
                            results.push(entry.trim());
                        }
                        entry = "";
                    }
                }
            }
        }

        entry = entry.trim();
        if (entry) {
            if (!results) {
                results = [entry];
            } else {
                results.push(entry);
            }
        }

        return results;
    }
}
