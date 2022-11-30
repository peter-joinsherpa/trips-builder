const config = {
    "host": {
        "sandbox": "https://requirements-api.sandbox.joinsherpa.com",
        "production": "https://requirements-api.joinsherpa.com"
    },
    "requestHeaderFormatted": {
        "v2": `curl --location --request POST '{{HOST}}/v2/trips?include=procedure,restriction&language=en-US&affiliateId=sherpa&key={{API-KEY}}' \\
--header 'content-type: application/json' \\`,
        "v3": `curl --location --request POST '{{HOST}}/v3/trips?include=procedure,restriction' \\
--header 'content-type: application/vnd.api+json' \\
--header 'x-api-key: {{API-KEY}}' \\`
    },    
    "requestBody": {
        "v2": `{
    "data": {
        "type": "TRIP",
        "attributes": {
            "category": "ONE_WAY_TRIP",
            "segments": [
                {
                    "segmentType": "OUTBOUND",
                    "origin": {
                        "{{ORIGIN_CODE_NAME}}": "{{ORIGIN_CODE_VALUE}}"
                    },
                    "destination": {
                        "{{DESTINATION_CODE_NAME}}": "{{DESTINATION_CODE_VALUE}}"
                    },
                    "departureDate": "{{DEPARTURE_DATE}}",
                    "departureTime": "00:00",
                    "arrivalDate": "{{ARRIVAL_DATE}}",
                    "arrivalTime": "00:00"
                }
            ],
            "travellers": [
                {
                    "vaccinations": [
                        {
                            "type": "COVID_19",
                            "status": "{{VACCINATION}}"
                        }
                    ],
                    "nationality": "{{PASSPORT}}"
                }
            ]
        }
    }
}`,
        
        "v3": `{
    "data": {
        "type": "TRIP",
        "attributes": {
            "traveller": {
                "passports": ["{{PASSPORT}}"],
                "vaccinations": [
                    {
                        "type": "COVID_19",
                        "status": "{{VACCINATION}}"
                    }
                ]
            },
            "locale": "en-US",
            "travelNodes": [
                {
                    "type": "ORIGIN",
                    "departure": {
                        "date": "{{DEPARTURE_DATE}}",
                        "time": "00:00",
                        "travelMode": "AIR"
                    },
                    "{{ORIGIN_CODE_NAME}}": "{{ORIGIN_CODE_VALUE}}"
                    
                },
                {
                    "type": "DESTINATION",
                    "arrival": {
                        "date": "{{ARRIVAL_DATE}}",
                        "time": "00:00",
                        "travelMode": "AIR"
                    },
                    "{{DESTINATION_CODE_NAME}}": "{{DESTINATION_CODE_VALUE}}"
                }
            ]
        }
    }
}`
    }
};