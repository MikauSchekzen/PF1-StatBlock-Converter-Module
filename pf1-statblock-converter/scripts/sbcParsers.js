import { sbcUtils } from "./sbcUtils.js"
import { sbcData, sbcError } from "./sbcData.js"

export class sbcParsing {}
export class sbcMapping {}

/** Convenience helper, tries to parse the number to integer, if it is NaN, will return 0 instead. */
sbcParsing.parseInteger = (value) => {let p = parseInt(value); return isNaN(p) ? 0 : p;};

/** Convenience helper, returns an array with the base text and the sub text if found. Format: base text (sub text) */
sbcParsing.parseSubtext = (value) => { return sbcUtils.parseSubtext(value); }

sbcParsing.parseValueToPath = (obj, path, value) => {
    var parts = path.split('.');
    var curr = obj;
    for(var i=0;i<parts.length-1;i++)
        curr = curr[parts[i]] || {};
    curr[parts[parts.length-1]] = value;
}

export class sbcParserBase {
    constructor() {

    }

    async parse(key, value) {
        return {};
    }
}

// Writes a given string into all fields defined in sbcMapping
class singleValueParser extends sbcParserBase {
    async parse(targetFields, value, line) {
        console.log("Trying to parse " + value + " into " + targetFields)
        console.log("line: " + line)

        try {
            targetFields.forEach(field => {
                sbcParsing.parseValueToPath(sbcData.characterData.actorData, field, value)
            })
            return true
            //throw "testError"
        } catch(err) {
            let errorMessage = `Failed to parse ${value} into ${targetFields}`
            let error = new sbcError(0, "Parse", errorMessage, line)
            sbcData.errors.push(error)
            return false
        }
    }
}





/* ------------------------------------ */
/* Parser the available categories      */
/* ------------------------------------ */

export function parseCategory (category, data, startLine) {

    switch (category) {
        case "special abilities":
            parseSpecialAbilities(data, startLine)
            break
        default:
            let functionName = "parse" + sbcUtils.capitalize(category) + "(data, startLine)"
            eval(functionName)
            break
    }
}

/* ------------------------------------ */
/* Parser for base data                 */
/* ------------------------------------ */
export async function parseBase(data, startLine) {
    console.log("Base data:")
    console.log(data)

    let nameFound = false
    let crFound = false
    let mrFound = false

    /*
    "base": {
        "name": [],
        "cr": new sbcSingleValueParser(["data.details.level.value"]),
        "mr": [],
        "xp": [],
        "source": [],
        "alignment": [],
        "size": [],
        "space": [],
        "reach": [],
        "classes": {
            "class": {
                "className": [],
                "classNameSuffix": [],
                "classLevel": []
            }
        },
        "gender": [],
        "race": [],
        "creatureType": [],
        "creatureSubtype": [],
        "init": ["data.attributes.init.total"],
        "senses": ["data.traits.senses"],
        "perception": [],
        "aura": ["data.details.aura"]
    }
    */

    // Loop through the lines given in baseData
    for (let line=0; line<data.length; line++) {

        try {
            console.log("nameFound: " + nameFound)
            let lineContent = data[line]
            console.log("lineContent: " + lineContent)

            // Search for the line containing name, cr and mr, if it's not already found
            // For this we take the first line
            if (!nameFound && line === 0) {
                // remove CR and MR if they are found
                let name = lineContent.replace(/\(?\s*CR\s*(\d+\/*\d*|-)\)?/, "").trim()
                let nameFields = sbcMapping.map.base["name"].fields
                let parser = new singleValueParser
                let parsedName = await parser.parse(nameFields, name, line)
                if (parsedName) { nameFound = true }
                // Check, if CR is in this line as well
                if (lineContent.search(/\s*CR\s*(\d+\/*\d*|-)/) !== -1) {
                    let cr = lineContent.match(/\s*CR\s*(\d+\/*\d*|-)/)[1].trim()
                    let crFractions = { "1/8" : 0.125, "1/6" : 0.1625, "1/4": 0.25, "1/3": 0.3375, "1/2": 0.5 }

                    if (crFractions[cr] != null) {
                        cr = crFractions[cr];
                    } 

                    let crFields = sbcMapping.map.base["cr"].fields
                    let parsedCR = await parser.parse(crFields, cr, line)
                    if (parsedCR) { crFound = true }
                }
                // Check, if MR is in this line as well
                if (lineContent.search(/\s*MR\s*(\d+\/*\d*|-)/) !== -1) {
                    let mr = lineContent.match(/\s*MR\s*(\d+\/*\d*|-)/)[1].trim()
                    let mrFields = sbcMapping.map.base["mr"].fields
                    let parsedMR = await parser.parse(mrFields, mr, line)
                    if (parsedMR) { mrFound = true }
                }
                
            }

            if (!crFound) {
                let cr = lineContent.match(/\s*CR\s*(\d+\/*\d*|-)/)[0].trim()
                console.log("CR: "+ cr)

                let crFractions = { "1/8" : 0.125, "1/6" : 0.1625, "1/4": 0.25, "1/3": 0.3375, "1/2": 0.5 }

                if (crFractions[cr] != null) {
                    cr = crFractions[cr];
                } 

                let fields = sbcMapping.map.base["cr"].fields
                let parser = new singleValueParser
                let parsedCR = await parser.parse(fields, cr, line)
                if (parsedCR) { crFound = true }
            }
            

            

        } catch (err) {
            
            let errorMessage = `Failed to parse the highlighted line`
            let error = new sbcError(0, "Parse", errorMessage, line)
            sbcData.errors.push(error)
            throw err
            return false

        }






    }
    
}


/* ------------------------------------ */
/* Parser for defense data              */
/* ------------------------------------ */
export function parseDefense(data, startLine) {
    //console.log("Defense data:")
    //console.log(data)
}

/* ------------------------------------ */
/* Parser for offense data              */
/* ------------------------------------ */
export function parseOffense(data, startLine) {
    //console.log("Offense data:")
    //console.log(data)
}

/* ------------------------------------ */
/* Parser for statistics data           */
/* ------------------------------------ */
export function parseStatistics(data, startLine) {
    //console.log("Statistics data:")
    //console.log(data)

}

/* ------------------------------------ */
/* Parser for tactics data              */
/* ------------------------------------ */
export function parseTactics(data, startLine) {
    //console.log("Tatics data:")
    //console.log(data)
}

/* ------------------------------------ */
/* Parser for ecology data              */
/* ------------------------------------ */
export function parseEcology(data, startLine) {
    //console.log("Ecology data:")
    //console.log(data)
}

/* ------------------------------------ */
/* Parser for special ability data      */
/* ------------------------------------ */
export function parseSpecialAbilities(data, startLine) {
    //console.log("Special Ability data:")
    //console.log(data)
}

/* ------------------------------------ */
/* Parser for description data          */
/* ------------------------------------ */
export function parseDescription(data, startLine) {
    //console.log("Description data:")
    //console.log(data)
}

/* ------------------------------------ */
/* Initialize Parser Mapping            */
/* ------------------------------------ */

export function initMapping() {

    if (sbcMapping.map) {
        return;
    }

    sbcMapping.map = {
        "base": {
            "name": {
                "fields": ["data.name","data.token.name"],
                "supportedValues": "String"
            },
            "cr": ["data.details.cr.base","data.details.cr.total"],
            "mr": [], // currently not supported by the game system
            "level": ["data.details.level.value"],
            "xp": ["data.details.xp.value"],
            "source": ["data.details.notes"],
            "alignment": ["data.details.alignment"],
            "size": ["data.traits.size"],
            "space": ["token.height","token.width"],
            "reach": [],
            "classes": [],
            "gender": ["data.details.gender"],
            "deity": ["data.details.deity"],
            "race": [],
            "creatureType": [],
            "creatureSubtype": [],
            "init": ["data.attributes.init.total"],
            "senses": {
                "fields": ["data.traits.senses"],
                "supportedValues": Object.keys(CONFIG["PF1"].senses).map(x => x.toLowerCase())
            },
            "perception": ["data.skills.per.value"],
            "aura": []
        },
        "defense": {
            "hp": ["data.attributes.hp.value", "data.attributes.hp.max"],
            "sp": ["data.attributes.sp.value", "data.attributes.sp.max"],
            "rp": ["data.attributes.rp.value", "data.attributes.rp.max"],
            "eac": ["data.attributes.eac.value"],
            "kac": ["data.attributes.kac.value"],
            "fort": ["data.attributes.fort.bonus"],
            "ref": ["data.attributes.reflex.bonus"],
            "will": ["data.attributes.will.bonus"],
            "sr": ["data.traits.sr"],
            "dr": ["data.traits.damageReduction.value", "data.traits.damageReduction.negatedBy"],
            "resistances": [],
            "weaknesses": [],
            "immunities": [],
            "defensive abilities": []
        },
        "offense": {
            
        },
        "tactics": {

        },
        "statistics": {

        },
        "ecology": {

        },
        "special abilities": {

        },
        "description": {

        }
    }

}