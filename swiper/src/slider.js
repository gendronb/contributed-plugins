import noUiSlider from 'nouislider'

import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import utc from 'dayjs/plugin/utc'

dayjs.extend(duration)
dayjs.extend(utc)

const handleChange = (value) => console.info(value)

const buildDiscreteSlider = ({ domEl, values, initialValues = null, isDual = false, labelFormat = 'YYYY', onChange = handleChange }) => {

  const min = Math.min(...values)
  const max = Math.max(...values)

  const scalebarExtent = max - min

  const rangeAsArray = values.map((t, i) => {
    let percentage = ((t - min) / scalebarExtent) * 100
    return [percentage, t]
  })

  let range = {
    min: min,
    max: max
  }

  const start = initialValues //initialValues.length ? initialValues : [initialValues]

  const rangeAsObj = rangeAsArray.reduce((obj, item) => {
    return {
      ...obj,
      [`${item[0]}%`]: item[1]
    }
  }, range)

  const pipsPositionsAsArray = rangeAsArray.map((t) => t[1])

  noUiSlider.create(domEl, {

    range: rangeAsObj,
    snap: true,
    start: start,
    connect: isDual,
    step: 1,

    behaviour: 'tap-drag-hover',

    tooltips: {
      to: function (value) {
        return dayjs.utc(value).format(labelFormat)
      },
      from: function (value) {
        return value
      }
    },

    format: {
      to: function (value) {
        return Number(value)
      },
      from: function (value) {
        return Number(value)
      }
    },

    pips: {
      mode: 'values',
      stepped: true,
      values: pipsPositionsAsArray,
      density: 100,
      format: {
        to: function (value) {
          return dayjs.utc(value).format(labelFormat)
        },
        from: function (value) {
          return value
        }
      }
    }
  })

  const labels = document.getElementsByClassName('noUi-value')
  const markers = document.getElementsByClassName('noUi-marker')

  let curIndex = 0
  let testIndex = 1

  while (testIndex !== labels.length) {

    let d1 = labels[curIndex].getBoundingClientRect()
    let d2 = labels[testIndex].getBoundingClientRect()
    let ox = Math.abs(d1.x - d2.x) < (d1.x < d2.x ? d2.width : d1.width) * 1.2
    let oy = Math.abs(d1.y - d2.y) < (d1.y < d2.y ? d2.height : d1.height)

    if (ox && oy) {
      labels[testIndex].classList.add('overflow')
      markers[testIndex].classList.add('overflow')
      testIndex++
    } else {
      curIndex = testIndex - curIndex !== 1 ? testIndex : curIndex + 1
      testIndex++
    }
  }

  let tooltips = document.getElementsByClassName('noUi-tooltip')
  for (let i = 0; i < tooltips.length; i++) {
    tooltips[i].classList.add('hidden')
  }

  domEl.noUiSlider.on('start', function () {
    let tooltips = document.getElementsByClassName('noUi-tooltip')
    for (let i = 0; i < tooltips.length; i++) {
      tooltips[i].classList.remove('hidden')
    }
  })

  domEl.noUiSlider.on('end', function () {
    let tooltips = document.getElementsByClassName('noUi-tooltip')
    for (let i = 0; i < tooltips.length; i++) {
      tooltips[i].classList.add('hidden')
    }
  })

  domEl.noUiSlider.on('change', function (e) {
    onChange(e)
  })

}

export default buildDiscreteSlider
