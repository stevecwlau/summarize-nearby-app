// map initilization
const hkCenter = [22.371813, 114.139577]

const map = L.map("map", {
    center: hkCenter,
    zoom: 11
})

// landsd basemap api
const basemapAPI = L.tileLayer("https://mapapi.geodata.gov.hk/gs/api/v1.0.0/xyz/basemap/wgs84/{z}/{x}/{y}.png", {
    attribution: '<a href="https://api.portal.hkmapservice.gov.hk/disclaimer" target="_blank" class="copyrightDiv">&copy; Map information from Lands Department</a><div style="width:28px;height:28px;display:inline-flex;background:url(https://api.hkmapservice.gov.hk/mapapi/landsdlogo.jpg);background-size:28px;"></div>'
});

basemapAPI.addTo(map)

// landsd label api
const labelAPI = L.tileLayer("https://mapapi.geodata.gov.hk/gs/api/v1.0.0/xyz/label/hk/en/wgs84/{z}/{x}/{y}.png")

labelAPI.addTo(map)

// extract igeocom points as featurecollection
const filPoints = {
    type: "FeatureCollection",
    features: data.features.filter(feature =>
        feature.properties.TYPE === "CVS" ||
        feature.properties.TYPE === "FLR" ||
        feature.properties.TYPE === "MAL" ||
        feature.properties.TYPE === "ROI" ||
        feature.properties.TYPE === "SMK" ||
        feature.properties.CLASS === "RSF" ||
        feature.properties.CLASS === "HNC" ||
        feature.properties.CLASS === "SCH"
    )
}

// add filtered igeocom
const iGeoCom = L.geoJSON(filPoints, {
    pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng)
    },
    style: function (feature) {
        return {
            color: "#4A7064",
            weight: 3,
            fillOpacity: 0.7,
            radius: 2
        }
    }
})

// iGeoCom.addTo(map)

// default radius in meters
let searchRadius = 0.5

// create a layer group for circles to check for count of circles
let circleGroup = L.featureGroup().addTo(map)

// layer for filtered points
let filteredPointsGroup = L.featureGroup().addTo(map);

// mouse click to add circle polygon
map.on("click", function (e) {
    const latlng = e.latlng
    const lat = latlng.lat
    const lng = latlng.lng

    let circlePoly = turf.circle([lng, lat], searchRadius, {
        steps: 1000,
        units: "kilometers",
        properties: {
            foo: "bar"
        }
    })

    // clear any existing circles before creating new ones
    if (circleGroup.getLayers().length > 0) {
        circleGroup.clearLayers()
    }

    circleGroup.addLayer(L.geoJSON(circlePoly))

    const bounds = circleGroup.getBounds()
    map.flyToBounds(bounds, {
        duration: 1,
        padding: [20, 20]
    })

    // turf points within polygon operation
    const ptsWithin = turf.pointsWithinPolygon(filPoints, circlePoly)

    const cmfCnt = ptsWithin.features.filter(
        feature => feature.properties.CLASS === "CMF").length
    const schCnt = ptsWithin.features.filter(
        feature => feature.properties.CLASS === "SCH").length
    const rsfCnt = ptsWithin.features.filter(
        feature => feature.properties.CLASS === "RSF").length
    const hncCnt = ptsWithin.features.filter(
        feature => feature.properties.CLASS === "HNC").length

    document.getElementById("cmfCnt").innerHTML = `${cmfCnt}`
    document.getElementById("schCnt").innerHTML = `${schCnt}`
    document.getElementById("rsfCnt").innerHTML = `${rsfCnt}`
    document.getElementById("hncCnt").innerHTML = `${hncCnt}`

    // clear previous filtered points
    filteredPointsGroup.clearLayers()

    // add filtered points to group
    L.geoJSON(ptsWithin, {
        pointToLayer: function (feature, latlng) {
            let color
            switch (feature.properties.CLASS) {
                case "CMF":
                    color = "#7344f2ff";
                    break
                case "SCH":
                    color = "#fc6bc2ff";
                    break
                case "RSF":
                    color = "#12de04ff";
                    break
                case "HNC":
                    color = "#f46b74";
                    break
            }
            return L.circleMarker(latlng, {
                color,
                weight: 3,
                fillOpacity: 0.9,
                radius: 5,
                className: "shadow-marker"

            })
        },
        onEachFeature: function (feature, layer) {
            layer.bindTooltip(
                `${feature.properties.CHINESENAME} </br> ${feature.properties.ENGLISHNAME}`
            )
        }
    }).addTo(filteredPointsGroup)
})

// function for updating radius
function updateSearchRadius() {
    const inputVal = $("#radius").val() / 1000
    searchRadius = parseFloat(inputVal)
}

// radius button click
$(".send-btn").click(updateSearchRadius)

// enter key on input
$("#radius").on("keyup", function (e) {
    if (e.key === "Enter") {
        updateSearchRadius()
    }
})

// function for resetting map
function resetMap() {
    circleGroup.clearLayers()
    filteredPointsGroup.clearLayers()
    map.flyTo(hkCenter, 11, {
        duration: 1
    })
    document.getElementById("cmfCnt").innerHTML = "0"
    document.getElementById("schCnt").innerHTML = "0"
    document.getElementById("rsfCnt").innerHTML = "0"
    document.getElementById("hncCnt").innerHTML = "0"
    $("#radius").val("")
    searchRadius = 0.5
}

// reset button click
$(".reset-btn").click(resetMap)