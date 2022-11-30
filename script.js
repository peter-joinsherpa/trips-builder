
// Replace text        
function replaceText(text, searchValue, newValue, isHighlight = false) {

    // return original string if not replacement value provided
    if (!newValue) { return text;} 

    if (isHighlight) {

        return text.replace(searchValue, '<span class=\'highlight\'>' + newValue + '</span>');

    } else {

        return text.replace(searchValue, newValue);

    }
}

// Generate Request
function generateRequest(idName) {

    let version = document.getElementById("version").value;
    let environment = document.getElementById("environment").value;
    let passport = document.getElementById("passport").value;
    let vaccination = document.getElementById("vaccination").value;
    let originArray = document.getElementById("origin").value.split("-");
    let destinationArray = document.getElementById("destination").value.split("-");
    let apiKey = document.getElementById("apikey").value
    let responseDate = new Date().toISOString().split('T')[0];
    let request = "";
    let requestHeaderFormatted = "";

    try {

        request = config.requestBody[version];

        requestHeaderFormatted = config.requestHeaderFormatted[version];

// Host Environment
        requestHeaderFormatted = (idName == 'environment') ? replaceText(requestHeaderFormatted,"{{HOST}}", config.host[environment], true)
        : replaceText(requestHeaderFormatted,"{{HOST}}", config.host[environment]);

// Populate Request Object
        request = request.replace("{{DEPARTURE_DATE}}", responseDate);
        request = request.replace("{{ARRIVAL_DATE}}", responseDate);

        let requestFormatted = `${requestHeaderFormatted}<br><br>${request}`;

        request = replaceText(request,"{{VACCINATION}}", vaccination);
        requestFormatted = (idName == 'vaccination') ? replaceText(requestFormatted,"{{VACCINATION}}", vaccination, true)
            : replaceText(requestFormatted,"{{VACCINATION}}", vaccination);

        request = replaceText(request, "{{PASSPORT}}", passport);
        requestFormatted = (idName == 'passport') ? replaceText(requestFormatted,"{{PASSPORT}}", passport, true)
            : replaceText(requestFormatted,"{{PASSPORT}}", passport);

        let originCodeName = '';
        let originCodeValue = '';
        let destinationCodeName = '';
        let destinationCodeValue = '';

        if (version == 'v2') { 
            
            originCodeName = originArray[0];
            originCodeValue = originArray[1];
            destinationCodeName = destinationArray[0];
            destinationCodeValue = destinationArray[1];

        } else { //v3

            if (originArray.length === 2) {
                if (originArray[0] == 'airportCode') {
                    originCodeName = originArray[0];
                    originCodeValue = originArray[1];
                } else {
                    originCodeName = "locationCode";
                    originCodeValue = originArray[1];                        
                }
            }

            if (destinationArray[0] == 'airportCode') {
                destinationCodeName = destinationArray[0];
                destinationCodeValue = destinationArray[1];
            } else {
                destinationCodeName = "locationCode";
                destinationCodeValue = destinationArray[1];                        
            }                    
        }

        request = replaceText(request, "{{ORIGIN_CODE_NAME}}", originCodeName);
        requestFormatted = (idName == 'origin') ? replaceText(requestFormatted,"{{ORIGIN_CODE_NAME}}", originCodeName, true)
            : replaceText(requestFormatted,"{{ORIGIN_CODE_NAME}}", originCodeName);
        request = replaceText(request, "{{ORIGIN_CODE_VALUE}}", originCodeValue);
        requestFormatted = (idName == 'origin') ? replaceText(requestFormatted,"{{ORIGIN_CODE_VALUE}}", originCodeValue, true)
            : replaceText(requestFormatted,"{{ORIGIN_CODE_VALUE}}", originCodeValue);
            
        request = replaceText(request, "{{DESTINATION_CODE_NAME}}", destinationCodeName);
        requestFormatted = (idName == 'destination') ? replaceText(requestFormatted,"{{DESTINATION_CODE_NAME}}", destinationCodeName, true)
            : replaceText(requestFormatted,"{{DESTINATION_CODE_NAME}}", destinationCodeName);
            
        request = replaceText(request, "{{DESTINATION_CODE_VALUE}}", destinationCodeValue);
        requestFormatted = (idName == 'destination') ? replaceText(requestFormatted,"{{DESTINATION_CODE_VALUE}}", destinationCodeValue, true)
            : replaceText(requestFormatted,"{{DESTINATION_CODE_VALUE}}", destinationCodeValue);

        // Only replace text for API-Key in the formatted request
        requestFormatted = (idName == 'apikey') ? replaceText(requestFormatted,"{{API-KEY}}", apiKey, true)
            : replaceText(requestFormatted,"{{API-KEY}}", apiKey);

// Additional formatting to JSON request                
        requestFormatted = requestFormatted.replace(/[\r\n]+/g,"<br>").replaceAll("  ","&nbsp;&nbsp;"); // newlines and indents
        requestFormatted = requestFormatted.replaceAll("{{","<span class=\'highlight_parameter\'>{{")
            .replaceAll("}}","}}</span>"); // highlight missing parameters

// Load Request TextAreas - Formatted and hidden (used for actual request)
        document.getElementById("textarea_request_formatted").innerHTML = requestFormatted;
        document.getElementById("textarea_request_body").value = request;
        
// Enable/Disable [Submit Request] button 
        document.getElementById("btnSubmitRequest").disabled = (requestFormatted.indexOf('{{') !== -1) ? true : false;

// Clear Response Text
        const responseElements = document.querySelectorAll(`[id^="response-"]`);
        responseElements.forEach(element => {
            element.value = "";
        });
        document.getElementById("textarea_response_formatted").innerHTML = "";

    } catch(err) {

        document.getElementById("textarea_request_formatted").innerHTML = "ERROR: " + err;

    }
}

// Post request to Trips Endpoint if API-KEY provided   
async function submitRequest() {

    document.body.style.cursor = 'wait';

    if (!document.getElementById("apikey").value) {

        document.getElementById('apikey').style.borderColor = 'red';
        return false;

    } else {
        document.getElementById('apikey').style.borderColor = '';
    }

    let version = document.getElementById("version").value;
    let environment = document.getElementById("environment").value;
    let myHeaders = new Headers();
    let apiEndpoint = "";
        
    if (version == 'v2') { 
        apiEndpoint = config.host[environment] + "/v2/trips?include=procedure,restriction&language=en-US&affiliateId=test1&key=" + document.getElementById("apikey").value;
        myHeaders.append("content-type", "application/json");

    } else { //v3
        apiEndpoint = config.host[environment] + "/v3/trips?include=procedure,restriction";
        myHeaders.append("content-type", "application/vnd.api+json");
        myHeaders.append("x-api-key", document.getElementById("apikey").value);
    }

    var requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: document.getElementById("textarea_request_body").value,
        redirect: 'follow'
    };

// Fetch Response
    jsonResults = await callApiAsync(apiEndpoint, requestOptions, version);

    if (jsonResults) {

        let results = await processResponse(jsonResults, version);

// Populate Results
        document.getElementById("node_headline").innerHTML = (version == 'v2') 
            ? "data.attributes.segments[].summary.headline" 
            : "data.attributes.headline";
        document.getElementById("response-headline").value = results.headline;

        document.getElementById("node_destinationTravelRestrictions").innerHTML = (version == 'v2') 
            ? "data.attributes.segments[].summary.groupings[].type = DESTINATION_TRAVEL_RESTRICTIONS" 
            : "data.attributes.informationGroups[].type = TRAVEL_RESTRICTIONS";
        document.getElementById("response-destination_travel_restrictions").value = results.destinationTravelRestrictions;

        document.getElementById("node_visas").innerHTML = (version == 'v2') 
            ? "data.attributes.segments[].summary.groupings[].type = VISAS" 
            : "data.attributes.informationGroups[].type = VISA_REQUIREMENTS";
        document.getElementById("response-visas").value = results.visas;


// Populate Response textarea        
        //let responseFormatted = JSON.stringify(jsonResults, null, 4).replace(/[\r\n]+/g,"<br>").replaceAll("  ","&nbsp;&nbsp;"); // newlines and indents
        let responseFormatted = JSON.stringify(jsonResults, null, 4); // newlines and indents
        responseFormatted = highlightLine(responseFormatted, "\"version\":", "highlight");
        responseFormatted = highlightLine(responseFormatted, results.headline, "highlight_headline");        
        for (const id of results.destinationTravelRestrictionsIds){
            responseFormatted = highlightLine(responseFormatted, id, "highlight_destinationTravelRestrictions");
        }
        for (const id of results.visasIds){
            responseFormatted = highlightLine(responseFormatted, id, "highlight_visas");
        }        

        document.getElementById("textarea_response_formatted").innerHTML = responseFormatted.replace(/[\r\n]+/g,"<br>").replaceAll("  ","&nbsp;&nbsp;"); // newlines and indents;

    }

    document.body.style.cursor = 'default';

}

function highlightLine(jsonString, searchFor, className="highlight") {
    var regex = new RegExp('(.*' + searchFor + '.*)', 'g');
    var highlighted = `<span class="${className}">$1</span>`;
    var newJsonString = jsonString.replace(regex, highlighted);

    return newJsonString;
}

// Post request to Trips Endpoint if API-KEY provided   
async function callApiAsync(apiEndpoint, requestOptions, version) {

    let response = await fetch(apiEndpoint, requestOptions);
    let json = await response.json();


    if (response.ok) { // Success

        return json;

    } else { //Error

        //document.getElementById("response-textarea").value = `${json.message} (${response.status})`;
        document.getElementById("textarea_response_formatted").innerHTML = `${json.message} (${response.status})`;
        return false;
    }

}

// Post request to Trips Endpoint if API-KEY provided   
async function processResponse(json, version) {

    let results = {
        headline: "",
        destinationTravelRestrictions: "",
        destinationTravelRestrictionsIds: [],
        visas: "",
        visasIds: []
    };

    if (version == 'v2') { 

        results.headline = json.data.attributes.segments[0].summary.headline;

        json.data.attributes.segments[0].summary.groupings.forEach(function(item) {

            if (item.type == 'DESTINATION_TRAVEL_RESTRICTIONS') {
                item.included.forEach(function(included) {

                    let includedResults = searchIncluded(json.included, included.id, version);
                    results.destinationTravelRestrictions += `${included.id} : ${includedResults.title} (${includedResults.country}|${includedResults.enforcement})\n`;
                    results.destinationTravelRestrictionsIds.push(included.id);

                });
            }

            if (item.type == 'VISAS') {
                item.included.forEach(function(included) {

                    let includedResults = searchIncluded(json.included, included.id, version);
                    results.visas += `${included.id} : ${includedResults.title} (${includedResults.country}|${includedResults.enforcement})\n`;
                    results.visas += (includedResults.documentLinks) ? includedResults.documentLinks : includedResults.sourceLink;
                    results.visasIds.push(included.id);                  

                });
            }

        });

    } else { //v3

        results.headline = json.data.attributes.headline;
        
        json.data.attributes.informationGroups.forEach(function(item) {

            if (item.type == 'TRAVEL_RESTRICTIONS') {
                item.groupings.forEach(function(groupings) {
                    groupings.data.forEach(function(data) {

                        let includedResults = searchIncluded(json.included, data.id, version);
                        results.destinationTravelRestrictions += `${data.id} : ${includedResults.title} (${includedResults.country}|${includedResults.enforcement})\n`;
                        results.destinationTravelRestrictionsIds.push(data.id);

                    });
                });
            }

            if (item.type == 'VISA_REQUIREMENTS') {
                    item.groupings.forEach(function(groupings) {
                    groupings.data.forEach(function(data) {

                        let includedResults = searchIncluded(json.included, data.id, version);
                        results.visas += `${data.id} : ${includedResults.title} (${includedResults.country}|${includedResults.enforcement})\n`;
                        results.visas += (includedResults.documentLinks) ? includedResults.documentLinks : includedResults.sourceLink;
                        results.visasIds.push(data.id);  

                    });
                });
            }

        });

    }

    return results
}

// Search Included Array   
function searchIncluded(includedArray, id, version) {

    let results = {};

    for (let included of includedArray) {
        if (included.id == id) {
            results.title = included.attributes.title;
            results.description = included.attributes.description;
            results.enforcement = included.attributes.enforcement;

            if (version == 'v2') { 

                results.country = included.attributes.country;
                results.sourceLink = included.attributes.source.url;

                if (Array.isArray(included.attributes.documentLinks) && included.attributes.documentLinks.length) {
                    results.documentLinks = included.attributes.documentLinks[0].url;
                } else {
                    results.documentLinks = "";
                }

            } else { //v3

                results.country = included.relationships.location.data.id;
                results.sourceLink = included.attributes.sources[0].url;

                if (Array.isArray(included.attributes.actions) && included.attributes.actions.length) {
                    results.documentLinks = included.attributes.actions[0].url;
                } else {
                    results.documentLinks = "";
                }
            }

            break;
        }
    }

    return results;
}