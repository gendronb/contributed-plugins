const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const duration = require('dayjs/plugin/duration')

const { Parser } = require('xml2js')

dayjs.extend(utc)
dayjs.extend(duration)

const xmlParser = new Parser({
  normalizeTags: true,
  explicitArray: true
})

const getAllDimensionInfoByLayerId = (layers, dimensionName = 'time') => {

  // First, dedupe getcapabilities by url
  // so we don't call getCapabilities more than once for each URL

  const uniqueWmsServers = Array.from(
    new Set(layers.map((layer) => layer.esriLayer._getCapabilitiesURL))
  ).map((url) => {
    return url
  })

  // Then call getCapabilities for each unique url
  // and parse to JSON

  let uniqueCapabilities = Promise.allSettled(
    uniqueWmsServers.map((url) => {
      return window
        .fetch(`${url}?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0`)
        .then((response) => {
          return response.text()
        })
        .then((str) => xmlParser.parseStringPromise(str))
        .then((parsed) => {
          return {
            url,
            capabilities: parsed.wms_capabilities
          }
        })
    })
  )

  return uniqueCapabilities.then((result) => {

    // Filter array of results from promise.allsettled
    // extract actual capability result (value)
    // and key by layer id

    let uniqueCapabilitiesByUrl = result
      .filter((p) => p.status === 'fulfilled')
      .map((p) => p.value)
      .reduce((acc, item) => {
        acc[item.url] = item.capabilities
        return acc
      }, {})

    return layers
      .map((layer) => {
        let { esriLayer } = layer
        let url = esriLayer._getCapabilitiesURL

        return {
          id: layer.id,
          capabilities: getAllDimensionInfoFromJsonWmsCapabilities(
            uniqueCapabilitiesByUrl[url],
            dimensionName
          )
        }
      })
      .reduce((acc, layer) => {
        acc[layer.id] = layer.capabilities
        return acc
      }, {})
  })
}

const getAllDimensionInfoFromJsonWmsCapabilities = (
  wmsCapabilitities,
  dimensionName = 'time'
) => {
  let dimensionInfos = []

  //  Get root layer dimension info

  let rootLayer = wmsCapabilitities.capability[0].layer[0]
  let rootLayerDimensionInfo = getDimensionInfoFromJsonWmsLayerDefinition(
    rootLayer,
    dimensionName
  )

  let layers = rootLayer.layer

  layers.forEach((layer) => {
    let dimensionInfo = getDimensionInfoFromJsonWmsLayerDefinition(
      layer,
      dimensionName
    )

    if (dimensionInfo) {

      // Combine dimension info with root layer's

      let mergedDimensionInfo = mergeDimensionInfo(
        rootLayerDimensionInfo,
        dimensionInfo
      )
      dimensionInfos.push(mergedDimensionInfo)
    }
  })

  return dimensionInfos
}

const mergeDimensionInfo = (rootDimensioninfo, layerDimensionInfo) => {

  // Logic taken from OGC spec :
  // Dimension declarations are inherited by enclosed Layers, as specified in 7.2.4.8.
  // A layer may provide a dimension declaration that has the same name attribute (case-insensitive matching) as a
  // declaration in another layer. However, the dimension shall not be re-declared using the same name with
  // conflicting units or unitSymbol attributes. Extent values, and the attributes default, nearestValue and
  // multipleValues, may be different for each layer.

  let mergedDimensionInfo = { ...rootDimensioninfo, ...layerDimensionInfo }
  return mergedDimensionInfo
}

const getDimensionInfoFromJsonWmsLayerDefinition = (
  wmsLayer,
  dimensionName = 'time'
) => {
  let layerDimensions = wmsLayer.dimension || []
  let dimensions = layerDimensions
    .filter((node) => {
      let properties = node['$'] || {}
      return properties.name
        ? properties.name.toLowerCase() === dimensionName
        : false
    })
    .map((node) => {
      let properties = node['$'] || {}
      let nodeContent = node['_']
      return {
        id: wmsLayer.name[0],
        defaultValue: properties.default,
        multipleValues: Boolean(properties.multipleValues) || false,
        extent: nodeContent
      }
    })
  return dimensions[0] || null
}

// Utility function to determine if passed value is single date or tuple

const isRangeDual = range => range.length && range.length > 1

const applyDimensionToLayers = (layers, value) => {

  let dimensionName = 'time'
  let customParameters = {}

  const dates = getDatesFromTimestamps(value, 'wmst')
  const query = isRangeDual(value) ? `${dates[0]}/${dates[1]}` : `${dates[0]}`

  let wmsDimensionName = ['time', 'elevation'].indexOf(dimensionName) !== -1 ? dimensionName.toUpperCase() : `dim_${dimensionName}`.toUpperCase()
  customParameters[wmsDimensionName] = query

  for (let layer of layers) {
    let { esriLayer, type } = layer
    if (type.toLowerCase() === 'ogcwms') {
      esriLayer.setCustomParameters({}, customParameters)
    }
  }

}

const getDatesFromTimestamps = (value) => {

  let values = value.length ? value : [value]
  const isDualRange = isRangeDual(values)

  const min = getDateWMTS(values[0])
  const max = getDateWMTS(isDualRange ? values[1] : values[0])

  return [min, max]

}

const getDateWMTS = (date) => {
  let wmsDate = dayjs.utc(date).format()
  return wmsDate
}

// Given an array of string extents (1 or more simple or range values)
// returns a list of string extents without duplicates

const getStringExtentFromMultipleStringExtents = (extents) => {

  return [
    ...new Set(
      [].concat(...extents.map((e) => (e || '').split(',').map((v) => v.trim())))
    )
  ].join(', ')

}

const mergeLayerDimensionInfosWithConfigParams = (layerDimensionInfos, configParams) => {

  const DEFAULT_DATETIME_FORMAT = 'YYYY'
  // const DEFAULT_DIMENSION = 'time'

  // This is a multidimension array (array of layers, each with array of dimension information),
  // so we need to flatten it before extracting extent from each dimension info

  let flattenedDimensionInfos = layerDimensionInfos.flat(1)

  let merged = {
    dateTimeFormat: configParams.dateTimeFormat || DEFAULT_DATETIME_FORMAT,
    dimension: configParams.dimension || null,
    multipleValues: false, // always for now
    defaultValue: configParams.defaultValue || null,
    extent:
    configParams.extent ||
      getStringExtentFromMultipleStringExtents(
        flattenedDimensionInfos.map((d) => (d && d.extent) || null)
      ) || ''
  }

  return merged

}

const formatDate = (value, dateTimeFormat) => {
  let values = value.length ? value : [value]
  return values.map(v => dayjs.utc(v).format(dateTimeFormat)).join('-')
}

const addDuration = (dateStart, arrDuration) => {
  return arrDuration.reduce((date, durationComponent) => {
    return dayjs.utc(date).add(durationComponent[0], durationComponent[1])
  }, dateStart)
}

const buildTimeStampsArrayFromInterval = (strDateStart, strDateEnd, strIsoDuration) => {

  const dateStart = dayjs.utc(strDateStart)
  const dateEnd = dayjs.utc(strDateEnd)

  // Parse ISO string representation (ex. 'P1Y2M')
  const isoDuration = dayjs.duration(strIsoDuration)

  // Format duration to its components
  // (between [] is the string constant for each component)
  // then split to individual components (ex. '1|y')
  // and split again to array [1, 'y'], converting value to number
  // and filtering out NaN for non-existing duration components

  const arrDuration = isoDuration
    .format('Y[|y]-M[|M]-D[|d]-H[|h]-m[|m]-s[|s]')
    .split('-')
    .map((i) => {
      let splitted = i.split('|')
      return [Number(splitted[0]), splitted[1]]
    })
    .filter((i) => !isNaN(i[0]))

  let arrTimestamps = []
  let dateCurrent = dateStart
  while (dateCurrent < dateEnd) {
    arrTimestamps.push(dateCurrent.valueOf())
    dateCurrent = addDuration(dateCurrent, arrDuration)
  }
  arrTimestamps.push(dateEnd.valueOf())

  return arrTimestamps
}

const isDiscreteExtent = (strExtent) => {
  let dayJsDate = dayjs(strExtent)
  if (dayJsDate.isValid()) {
    return true
  } else {
    return false
  }
}

const getTimestampsArrayFromStringExtentArray = (arrStringExtent) => {

  let arrTimestamps = []

  arrTimestamps = arrStringExtent.map(extent => {

    if (isDiscreteExtent(extent)) {
      return dayjs.utc(extent).valueOf()
    } else {
      let [startDate, endDate, interval] = extent.split('/')
      return buildTimeStampsArrayFromInterval(startDate, endDate, interval)
    }

  })

  // Flatten and return
  return [].concat(...arrTimestamps)

}

export { getAllDimensionInfoByLayerId, mergeLayerDimensionInfosWithConfigParams, getTimestampsArrayFromStringExtentArray, applyDimensionToLayers, formatDate }
